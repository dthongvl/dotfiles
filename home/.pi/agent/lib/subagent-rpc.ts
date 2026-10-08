import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isAbsolute, resolve as resolvePath } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { DelegationRequest } from "./delegation.ts";

// Public, versioned in-process RPC. Unlike structured delegation this enters
// the native async executor, including Fleet, persistence and completion wakes.
const REQUEST_EVENT = "subagents:rpc:v1:request";
const REPLY_PREFIX = "subagents:rpc:v1:reply:";
const REPLY_TIMEOUT_MS = 60_000;

type RpcData = { text: string; details?: Record<string, unknown> };
type RpcReply =
  | { version: 1; requestId: string; success: true; data: RpcData }
  | {
      version: 1;
      requestId: string;
      success: false;
      error: { code: string; message: string };
    };

export type AsyncDelegationRequest = Pick<
  DelegationRequest,
  | "agent"
  | "task"
  | "context"
  | "cwd"
  | "model"
  | "thinking"
  | "timeoutMs"
  | "artifacts"
  | "intercomBridge"
>;

export class SubagentRpcError extends Error {
  constructor(
    message: string,
    readonly requestId: string,
    readonly code: string,
    readonly launchOutcome: "rejected" | "unknown",
    readonly runId?: string,
  ) {
    super(message);
    this.name = "SubagentRpcError";
  }
}

function rpc(
  pi: ExtensionAPI,
  method: "spawn" | "stop",
  params: Record<string, unknown>,
): Promise<RpcData & { requestId: string }> {
  const requestId = randomUUID();
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribers: Array<() => void> = [];
    const cleanup = () => {
      if (timer) clearTimeout(timer);
      for (const unsubscribe of unsubscribers) unsubscribe();
    };
    const fail = (
      message: string,
      code: string,
      outcome: "rejected" | "unknown",
    ) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new SubagentRpcError(message, requestId, code, outcome));
    };
    try {
      unsubscribers.push(
        pi.events.on(`${REPLY_PREFIX}${requestId}`, (payload) => {
          const reply = payload as RpcReply;
          if (settled || reply?.version !== 1 || reply.requestId !== requestId)
            return;
          if (!reply.success) {
            fail(
              reply.error?.message ?? "Subagent RPC failed.",
              reply.error?.code ?? "execution_failed",
              "rejected",
            );
            return;
          }
          if (typeof reply.data?.text !== "string") {
            fail(
              "Invalid subagent RPC reply; the launch outcome is unknown. Inspect Fleet before retrying.",
              "invalid_reply",
              "unknown",
            );
            return;
          }
          settled = true;
          cleanup();
          resolve({ ...reply.data, requestId });
        }),
      );
      unsubscribers.push(
        pi.on("session_shutdown", () =>
          fail(
            "Subagent RPC owner shut down; the launch outcome is unknown. Inspect Fleet before retrying.",
            "owner_shutdown",
            "unknown",
          ),
        ),
      );
      timer = setTimeout(
        () =>
          fail(
            `Subagent RPC ${method} did not reply. The launch outcome is unknown; do not retry automatically. Check that pi-subagents is loaded and inspect Fleet/status (request ${requestId}).`,
            "reply_timeout",
            "unknown",
          ),
        REPLY_TIMEOUT_MS,
      );
      pi.events.emit(REQUEST_EVENT, {
        version: 1,
        requestId,
        method,
        params,
        source: { extension: "dthongvl.delegated-tools" },
      });
    } catch (error) {
      fail(
        error instanceof Error ? error.message : String(error),
        "dispatch_failed",
        "unknown",
      );
    }
  });
}

async function spawnAsyncDelegation(
  pi: ExtensionAPI,
  request: AsyncDelegationRequest,
  signal?: AbortSignal,
): Promise<{
  text: string;
  details: Record<string, unknown>;
  runId: string;
  cancelled: boolean;
}> {
  signal?.throwIfAborted();
  // RPC has no abort token. Retain the launch reply even if the caller aborts,
  // then stop the exact returned run rather than abandoning an untracked child.
  const data = await rpc(pi, "spawn", {
    ...request,
    async: true,
    artifacts: request.artifacts ?? false,
    intercomBridge: request.intercomBridge ?? { mode: "off" },
  });
  const runId = data.details?.asyncId ?? data.details?.runId;
  if (typeof runId !== "string" || !runId) {
    throw new SubagentRpcError(
      "Subagent launch returned no run ID. The launch outcome is unknown; inspect Fleet before retrying.",
      data.requestId,
      "invalid_receipt",
      "unknown",
    );
  }
  if (signal?.aborted) {
    try {
      const stopped = await rpc(pi, "stop", { id: runId });
      return {
        text: stopped.text,
        details: data.details ?? {},
        runId,
        cancelled: true,
      };
    } catch (error) {
      throw new SubagentRpcError(
        `Run ${runId} was launched but cancellation could not be confirmed: ${error instanceof Error ? error.message : String(error)}. Inspect Fleet and stop this exact run; do not launch a replacement.`,
        error instanceof SubagentRpcError ? error.requestId : "",
        "stop_failed",
        "unknown",
        runId,
      );
    }
  }
  return {
    text: data.text,
    details: data.details ?? {},
    runId,
    cancelled: false,
  };
}

type Completion = {
  id?: string;
  runId?: string;
  success?: boolean;
  state?: string;
  summary?: string;
  error?: unknown;
  stopped?: boolean;
  timedOut?: boolean;
  interrupted?: boolean;
  results?: Array<{
    output?: string;
    summary?: string;
    status?: string;
    success?: boolean;
    stopped?: boolean;
    timedOut?: boolean;
    interrupted?: boolean;
    truncated?: boolean;
    outputPartial?: boolean;
    artifactPaths?: { outputPath?: string };
  }>;
};

type WaitOutcome =
  | { kind: "complete"; completion: Completion }
  | { kind: "attention"; requestId?: string }
  | { kind: "cancelled" }
  | { kind: "timed_out" }
  | { kind: "shutdown" }
  | { kind: "error"; error: unknown };

export type AsyncDelegationResult = {
  text: string;
  details: Record<string, unknown>;
  runId: string;
  status:
    | "completed"
    | "failed"
    | "timed_out"
    | "cancelled"
    | "interrupted"
    | "attention";
};

/** Wait for a native background child without polling or hiding it from Fleet. */
export async function waitForAsyncDelegation(
  pi: ExtensionAPI,
  request: AsyncDelegationRequest,
  options: {
    signal?: AbortSignal;
    onLaunched?: (runId: string, details: Record<string, unknown>) => void;
  } = {},
): Promise<AsyncDelegationResult> {
  let runId: string | undefined;
  let settled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopping = false;
  const early = new Map<string, WaitOutcome>();
  const unsubscribers: Array<() => void> = [];
  let finish!: (outcome: WaitOutcome) => void;
  const pending = new Promise<WaitOutcome>((resolve) => {
    finish = (outcome) => {
      if (settled) return;
      settled = true;
      resolve(outcome);
    };
  });
  const observe = (id: unknown, outcome: WaitOutcome) => {
    if (typeof id !== "string" || settled) return;
    if (runId) {
      if (id === runId) finish(outcome);
      return;
    }
    if (early.size >= 128) early.delete(early.keys().next().value!);
    early.set(id, outcome);
  };
  const stop = async (status: "cancelled" | "timed_out") => {
    if (!runId || settled || stopping) return;
    stopping = true;
    try {
      await rpc(pi, "stop", { id: runId });
      finish({ kind: status });
    } catch (error) {
      finish({
        kind: "error",
        error: new SubagentRpcError(
          `Run ${runId} may still be active: ${error instanceof Error ? error.message : String(error)}. Inspect Fleet; do not launch a replacement.`,
          error instanceof SubagentRpcError ? error.requestId : "",
          "stop_failed",
          "unknown",
          runId,
        ),
      });
    }
  };
  const abort = () => {
    void stop("cancelled");
  };
  try {
    // Subscribe before spawn: very short children can finish before its reply.
    unsubscribers.push(
      pi.events.on("subagent:async-complete", (payload) => {
        const completion = payload as Completion;
        observe(completion?.runId ?? completion?.id, {
          kind: "complete",
          completion,
        });
      }),
    );
    unsubscribers.push(
      pi.events.on("pi-intercom:detach-request", (payload) => {
        const attention = payload as { runId?: string; requestId?: string };
        observe(attention?.runId, {
          kind: "attention",
          requestId: attention?.requestId,
        });
      }),
    );
    unsubscribers.push(
      pi.events.on("subagent:control-event", (payload) => {
        const control = payload as {
          event?: { type?: string; runId?: string };
        };
        if (control?.event?.type === "needs_attention")
          observe(control.event.runId, { kind: "attention" });
      }),
    );
    unsubscribers.push(
      pi.on("session_shutdown", () => finish({ kind: "shutdown" })),
    );
    const receipt = await spawnAsyncDelegation(pi, request, options.signal);
    runId = receipt.runId;
    if (receipt.cancelled) return { ...receipt, status: "cancelled" };
    options.onLaunched?.(runId, receipt.details);
    const buffered = early.get(runId);
    early.clear();
    if (buffered) finish(buffered);
    options.signal?.addEventListener("abort", abort, { once: true });
    if (options.signal?.aborted) abort();
    timer = setTimeout(
      () => {
        void stop("timed_out");
      },
      Math.min((request.timeoutMs ?? 30 * 60_000) + 60_000, 2_147_483_647),
    );
    const outcome = await pending;
    if (outcome.kind === "error") throw outcome.error;
    if (outcome.kind === "shutdown")
      throw new SubagentRpcError(
        `Owner shut down while waiting for run ${runId}. Its outcome is unknown; inspect Fleet.`,
        "",
        "owner_shutdown",
        "unknown",
        runId,
      );
    if (outcome.kind === "attention")
      return {
        text: `Subagent ${runId} needs supervisor input. The tool released its wait so you can answer the native supervisor request${outcome.requestId ? ` ${outcome.requestId}` : ""}. The child has not completed; do not start a replacement.`,
        details: { ...receipt.details, supervisorRequestId: outcome.requestId },
        runId,
        status: "attention",
      };
    if (outcome.kind === "cancelled" || outcome.kind === "timed_out")
      return {
        text:
          outcome.kind === "cancelled"
            ? "Subagent was cancelled. Tool previews do not establish which changes completed."
            : `Timed out waiting for subagent ${runId}; a stop was accepted.`,
        details: receipt.details,
        runId,
        status: outcome.kind,
      };
    const completion = outcome.completion;
    const child = completion.results?.[0];
    let status: AsyncDelegationResult["status"] =
      completion.timedOut || child?.timedOut
        ? "timed_out"
        : completion.stopped || completion.state === "stopped" || child?.stopped
          ? "cancelled"
          : completion.interrupted ||
              child?.interrupted ||
              completion.state === "paused" ||
              child?.status === "paused"
            ? "interrupted"
            : completion.success === true &&
                completion.state === "complete" &&
                child?.success !== false &&
                child?.status !== "failed"
              ? "completed"
              : "failed";
    let text = child?.output;
    let partial = child?.truncated === true || child?.outputPartial === true;
    const outputPath = child?.artifactPaths?.outputPath;
    if (outputPath && (!text || child?.truncated || child?.outputPartial)) {
      const asyncDir = receipt.details.asyncDir;
      const path = isAbsolute(outputPath)
        ? outputPath
        : typeof asyncDir === "string"
          ? resolvePath(asyncDir, outputPath)
          : undefined;
      if (path) {
        try {
          text = await readFile(path, "utf8");
          partial = false;
        } catch {
          /* Keep the inline result if the optional artifact is unavailable. */
        }
      }
    }
    if (!text && status === "completed") {
      status = "failed";
      text = `Subagent completed but supplied no final text result. ${child?.summary || completion.summary || "Inspect its native report in Fleet."}`;
    }
    if (!text) {
      const errorText =
        typeof completion.error === "string"
          ? completion.error
          : completion.error &&
              typeof completion.error === "object" &&
              "message" in completion.error
            ? String(completion.error.message)
            : undefined;
      text =
        errorText ||
        child?.summary ||
        completion.summary ||
        `Subagent ended with status: ${status}`;
    }
    if (partial)
      text +=
        "\n\n[Native result is partial; no readable full final-output artifact was available. Inspect the child in Fleet.]";
    if (status === "cancelled")
      text = `Subagent was cancelled. Partial output does not establish which changes completed.\n\n${text}`;
    return {
      text,
      details: { ...receipt.details, completionState: completion.state },
      runId,
      status,
    };
  } finally {
    if (timer) clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
    for (const unsubscribe of unsubscribers) unsubscribe();
  }
}
