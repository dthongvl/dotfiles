import { randomUUID } from "node:crypto";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  formatSize,
  truncateHead,
  withFileMutationQueue,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const RPC_REQUEST_EVENT = "subagents:rpc:v1:request";
const RPC_REPLY_PREFIX = "subagents:rpc:v1:reply:";
const AGENT = "dthongvl.librarian";
const MODEL = "openai-codex/gpt-5.6-sol";
const THINKING = "off";
const RUN_TIMEOUT_MS = 30 * 60 * 1000;
const RPC_TIMEOUT_MS = 15_000;

const description = `The Librarian is a codebase-understanding subagent for remote repositories outside the local workspace.

It uses reusable local checkouts to inspect GitHub and GitLab repositories that are public or accessible through the user's existing Git credentials.

Use this when you need deep understanding of existing code across one or more repositories:
- explaining architecture, flows, or subsystem design
- finding where a feature is implemented in an external codebase
- comparing patterns across repositories
- understanding how code evolved through commit history
- reading or diffing files in a remote repository

Do not use this for:
- local workspace reads or searches
- code modifications or implementations
- simple local lookups when a direct local tool is enough
- questions unrelated to understanding existing repositories

Guidance:
- name the repository or project when you know it
- ask a specific question or describe the feature or codepath you want understood
- include context about what you are trying to achieve
- expect a thorough answer suitable for sharing
- return the answer in full rather than summarizing it`;

type RpcReply<T = unknown> =
  | { version: 1; requestId: string; success: true; data: T }
  | { version: 1; requestId: string; success: false; error: { code: string; message: string } };

type PingData = {
  version?: number;
  capabilities?: { asyncSpawn?: boolean; stop?: boolean };
  events?: { asyncComplete?: string };
};

type SpawnData = {
  text?: string;
  details?: { runId?: string; asyncId?: string; asyncDir?: string };
};

type Completion = {
  id?: string;
  runId?: string;
  state?: string;
  success?: boolean;
  summary?: string;
  asyncDir?: string;
  durationMs?: number;
  results?: Array<{
    status?: string;
    success?: boolean;
    summary?: string;
    agent?: string;
    artifactPath?: string;
  }>;
};

function rpc<T>(
  pi: ExtensionAPI,
  method: string,
  params: Record<string, unknown>,
  options: {
    signal?: AbortSignal;
    timeoutMs?: number;
    onLateReply?: (data: T) => void;
    lateReplyTimeoutMs?: number;
  } = {},
): Promise<T> {
  return new Promise<T>((resolveReply, reject) => {
    const requestId = randomUUID();
    const replyEvent = `${RPC_REPLY_PREFIX}${requestId}`;
    let unsubscribe: (() => void) | void;
    let settled = false;
    let timeout: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      if (typeof unsubscribe === "function") unsubscribe();
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", onAbort);
    };
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn();
    };
    const onAbort = () => finish(() => reject(new Error("Librarian research cancelled.")));
    const timeoutError = () => new Error(`pi-subagents RPC '${method}' did not reply within ${options.timeoutMs ?? RPC_TIMEOUT_MS}ms.`);

    timeout = setTimeout(() => {
      if (!options.onLateReply) {
        finish(() => reject(timeoutError()));
        return;
      }
      if (settled) return;
      settled = true;
      options.signal?.removeEventListener("abort", onAbort);
      reject(timeoutError());
      timeout = setTimeout(cleanup, options.lateReplyTimeoutMs ?? 60_000);
    }, options.timeoutMs ?? RPC_TIMEOUT_MS);

    unsubscribe = pi.events.on(replyEvent, (raw) => {
      const reply = raw as RpcReply<T>;
      if (!reply || reply.requestId !== requestId) return;
      if (settled) {
        if (reply.success) options.onLateReply?.(reply.data);
        cleanup();
        return;
      }
      if (reply.success) finish(() => resolveReply(reply.data));
      else finish(() => reject(new Error(`${reply.error.code}: ${reply.error.message}`)));
    });

    options.signal?.addEventListener("abort", onAbort, { once: true });
    if (options.signal?.aborted) {
      onAbort();
      return;
    }

    pi.events.emit(RPC_REQUEST_EVENT, {
      version: 1,
      requestId,
      method,
      params,
      source: { extension: "dthongvl.librarian" },
    });
  });
}

function buildTask(query: string, context?: string): string {
  if (!context?.trim()) return query.trim();
  return `Context: ${context.trim()}\n\nQuery: ${query.trim()}`;
}

function completionOutput(completion: Completion): string {
  return completion.results?.[0]?.summary?.trim()
    || completion.summary?.trim()
    || "Librarian completed without a textual response.";
}

async function truncateOutput(output: string): Promise<{ text: string; fullOutputPath?: string }> {
  const truncation = truncateHead(output, {
    maxLines: DEFAULT_MAX_LINES,
    maxBytes: DEFAULT_MAX_BYTES,
  });
  if (!truncation.truncated) return { text: output };

  const tempDir = await mkdtemp(join(tmpdir(), "pi-librarian-"));
  const fullOutputPath = join(tempDir, "output.md");
  await withFileMutationQueue(fullOutputPath, () => writeFile(fullOutputPath, output, "utf8"));
  const notice = `\n\n[Librarian output truncated to ${truncation.outputLines} lines or ${formatSize(truncation.outputBytes)}. Full output: ${fullOutputPath}]`;
  return { text: `${truncation.content}${notice}`, fullOutputPath };
}

async function stopRun(pi: ExtensionAPI, runId: string): Promise<void> {
  await rpc(pi, "stop", { id: runId }, { timeoutMs: RPC_TIMEOUT_MS }).catch(() => undefined);
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "librarian",
    label: "Librarian",
    description,
    promptSnippet: "Research and explain code in remote GitHub or GitLab repositories using reusable local checkouts",
    promptGuidelines: [
      "Use librarian for deep understanding of remote repositories, including architecture, implementation flows, cross-repository comparisons, and commit history.",
      "Do not use librarian for the current local workspace, code modifications, simple lookups, or unrelated questions.",
      "Give librarian a specific repository-focused query and relevant background context; return its answer in full.",
    ],
    renderResult(result, { expanded, isPartial }, theme, context) {
      const output = result.content
        .filter((item): item is Extract<typeof item, { type: "text" }> => item.type === "text")
        .map((item) => item.text)
        .join("\n");
      if (isPartial || context.isError || expanded) {
        return new Text(theme.fg(context.isError ? "error" : "toolOutput", output), 0, 0);
      }
      return new Text(theme.fg("success", "Librarian has completed"), 0, 0);
    },
    parameters: Type.Object({
      query: Type.String({
        description: "Your question about the codebase. Be specific about what you want to understand or explore.",
        minLength: 1,
      }),
      context: Type.Optional(Type.String({
        description: "Optional context about what you're trying to achieve or background information.",
      })),
    }, { additionalProperties: false }),

    async execute(_toolCallId, params, signal, onUpdate, ctx) {
      const query = params.query.trim();
      if (!query) throw new Error("Librarian query must not be empty.");

      const ping = await rpc<PingData>(pi, "ping", {}, { signal, timeoutMs: 3_000 });
      if (ping.version !== 1 || ping.capabilities?.asyncSpawn !== true || ping.capabilities?.stop !== true) {
        throw new Error("The installed pi-subagents extension does not provide the required RPC v1 async spawn/stop capabilities.");
      }
      const completionEvent = ping.events?.asyncComplete;
      if (!completionEvent) throw new Error("pi-subagents RPC did not advertise an async completion event.");

      const buffered: Completion[] = [];
      let runId: string | undefined;
      let wake: (() => void) | undefined;
      let cancelled = signal?.aborted ?? false;
      const unsubscribeComplete = pi.events.on(completionEvent, (raw) => {
        buffered.push(raw as Completion);
        wake?.();
      });
      const onAbort = () => {
        cancelled = true;
        wake?.();
        if (runId) void stopRun(pi, runId);
      };
      signal?.addEventListener("abort", onAbort, { once: true });

      try {
        const spawn = await rpc<SpawnData>(pi, "spawn", {
          tasks: [{
            agent: AGENT,
            task: buildTask(query, params.context),
            model: MODEL,
            acceptance: false,
          }],
          concurrency: 1,
          context: "fresh",
          cwd: ctx.cwd,
          artifacts: false,
          async: true,
          timeoutMs: RUN_TIMEOUT_MS,
          agentScope: "both",
        }, {
          timeoutMs: RPC_TIMEOUT_MS,
          lateReplyTimeoutMs: RUN_TIMEOUT_MS + 30_000,
          onLateReply: (lateSpawn) => {
            const lateRunId = lateSpawn.details?.asyncId ?? lateSpawn.details?.runId;
            if (lateRunId) void stopRun(pi, lateRunId);
          },
        });

        runId = spawn.details?.asyncId ?? spawn.details?.runId;
        if (!runId) throw new Error(`Librarian spawn did not return a run id: ${spawn.text ?? "unknown response"}`);
        if (cancelled) {
          await stopRun(pi, runId);
          throw new Error("Librarian research cancelled.");
        }

        onUpdate?.({
          content: [{ type: "text", text: "Librarian is researching remote repositories..." }],
          details: {
            status: "in-progress",
            runId,
            asyncDir: spawn.details?.asyncDir,
            model: MODEL,
            thinking: THINKING,
            query,
          },
        });

        const deadline = Date.now() + RUN_TIMEOUT_MS + 30_000;
        let completion: Completion | undefined;
        while (!completion) {
          if (cancelled) {
            await stopRun(pi, runId);
            throw new Error("Librarian research cancelled.");
          }
          completion = buffered.find((item) => item.id === runId || item.runId === runId);
          if (completion) break;
          const remaining = deadline - Date.now();
          if (remaining <= 0) {
            await stopRun(pi, runId);
            throw new Error(`Librarian timed out. Run: ${runId}`);
          }
          await new Promise<void>((resolveWait) => {
            const timer = setTimeout(resolveWait, remaining);
            wake = () => {
              clearTimeout(timer);
              resolveWait();
            };
          });
          wake = undefined;
        }

        const child = completion.results?.[0];
        const output = await truncateOutput(completionOutput(completion));
        if (cancelled) {
          await stopRun(pi, runId);
          throw new Error("Librarian research cancelled.");
        }
        if (completion.success !== true || completion.state !== "complete" || child?.success !== true) {
          const location = completion.asyncDir ?? spawn.details?.asyncDir;
          throw new Error(`Librarian run ${runId} ended in state '${completion.state ?? child?.status ?? "unknown"}': ${output.text}${location ? `\nArtifacts: ${location}` : ""}`);
        }

        return {
          content: [{ type: "text", text: output.text }],
          details: {
            status: "done",
            runId,
            asyncDir: completion.asyncDir ?? spawn.details?.asyncDir,
            durationMs: completion.durationMs,
            model: MODEL,
            thinking: THINKING,
            query,
            artifactPath: child.artifactPath,
            fullOutputPath: output.fullOutputPath,
          },
        };
      } finally {
        wake?.();
        signal?.removeEventListener("abort", onAbort);
        if (typeof unsubscribeComplete === "function") unsubscribeComplete();
      }
    },
  });
}
