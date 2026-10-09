import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { parseFrontmatter, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { Usage } from "@earendil-works/pi-ai";
import { spawnSubagent } from "../vendor/pi-subagent/subagent.ts";
import herdrSubagentExtension from "../vendor/pi-subagent/index.ts";
import { closePane } from "../vendor/pi-subagent/herdr.ts";
import { assistantText, effectiveRunState, readLatestAssistant, readMetadata, updateMetadata, type RunMetadata } from "../vendor/pi-subagent/shared.ts";
import type { AsyncDelegationRequest } from "./subagent-rpc.ts";

const agentDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const profiles = {
  "dthongvl.finder": { file: "finder.md", label: "Finder" },
  "dthongvl.librarian": { file: "librarian.md", label: "Librarian" },
  "dthongvl.oracle": { file: "oracle.md", label: "Oracle" },
} as const;
const registrationEvent = "dthongvl:herdr-backend:registered";

/** All Herdr tools share one parent lifecycle and pane selector. */
export function registerHerdrBackend(pi: ExtensionAPI): void {
  let registered = false;
  pi.events.emit(registrationEvent, () => { registered = true; });
  if (registered) return;
  pi.events.on(registrationEvent, acknowledge => {
    if (typeof acknowledge === "function") acknowledge();
  });
  herdrSubagentExtension(pi);
}

type HerdrDelegationResult = {
  text: string;
  status: "completed" | "cancelled" | "timed_out" | "failed";
  runId: string;
  details: Record<string, unknown>;
  usage?: Usage;
};

function readUsage(sessionFile: string): Usage | undefined {
  let content: string;
  try { content = readFileSync(sessionFile, "utf8"); } catch { return undefined; }
  let total: Usage | undefined;
  for (const line of content.split("\n")) {
    try {
      const entry = JSON.parse(line);
      const usage: Usage | undefined = entry.type === "message" && entry.message?.role === "assistant" ? entry.message.usage : undefined;
      if (!usage) continue;
      total ??= { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } };
      for (const key of ["input", "output", "cacheRead", "cacheWrite", "totalTokens"] as const) total[key] += usage[key] ?? 0;
      for (const key of ["input", "output", "cacheRead", "cacheWrite", "total"] as const) total.cost[key] += usage.cost?.[key] ?? 0;
    } catch { /* Ignore an incomplete JSONL tail. */ }
  }
  return total;
}

/** Run a supported read-only specialist using its existing agent profile. */
export async function waitForHerdrDelegation(
  pi: ExtensionAPI,
  request: AsyncDelegationRequest,
  options: {
    signal?: AbortSignal;
    parentSessionId?: string;
    parentSessionFile?: string;
    name?: string;
    onLaunched?: (runId: string, details: Record<string, unknown>) => void;
  } = {},
): Promise<HerdrDelegationResult> {
  options.signal?.throwIfAborted();
  if (!Object.hasOwn(profiles, request.agent))
    throw new Error(`Agent ${request.agent} does not support the Herdr backend.`);
  const profile = profiles[request.agent as keyof typeof profiles];
  const { label } = profile;
  const { frontmatter, body } = parseFrontmatter(readFileSync(join(agentDir, "herdr-agents", profile.file), "utf8"));
  const target = request.model ?? String(frontmatter.model);
  const slash = target.indexOf("/");
  if (slash <= 0 || slash === target.length - 1) throw new Error(`Expected provider/model, got ${target}`);
  const extensionPaths = typeof frontmatter.subagentOnlyExtensions === "string"
    ? [frontmatter.subagentOnlyExtensions] : frontmatter.subagentOnlyExtensions as string[];
  const args = [
    "--name", options.name ?? label, "--provider", target.slice(0, slash), "--model", target.slice(slash + 1),
    "--thinking", request.thinking ?? String(frontmatter.thinking), "--cwd", request.cwd ?? process.cwd(),
    "--tools", String(frontmatter.tools), "--no-extensions", "--no-context-files", "--no-prompt-templates",
    "--system-prompt", body.trim(),
    "--extension", join(agentDir, "extensions/herdr-agent-state.ts"),
  ];
  for (const path of extensionPaths ?? []) args.push("--extension", path.startsWith("~/") ? join(homedir(), path.slice(2)) : resolve(agentDir, path));
  // Cursor models need this installed provider extension in isolated children.
  if (target.startsWith("cursor/"))
    args.push("--extension", join(homedir(), ".pi/agent/npm/node_modules/pi-cursor-sdk/dist/index.js"));
  if (frontmatter.inheritSkills === false) args.push("--no-skills");
  args.push("--prompt", request.task);
  const deadline = Date.now() + (request.timeoutMs ?? Number(frontmatter.timeoutMs));
  const run = spawnSubagent(args, { sessionId: options.parentSessionId, sessionFile: options.parentSessionFile });
  const details = { backend: "herdr", runId: run.handle, paneId: run.paneId, runDir: run.runDir, sessionFile: run.sessionFile };
  let shuttingDown = false;
  const unsubscribe = pi.on("session_shutdown", () => { shuttingDown = true; });
  const result = (status: HerdrDelegationResult["status"], text: string): HerdrDelegationResult => ({
    status, text, details, runId: run.handle, usage: readUsage(run.sessionFile),
  });
  const stop = (): void => {
    try {
      closePane(run.paneId);
      updateMetadata(run.runDir, { state: "exited", suspended: false });
    } catch (error) {
      throw new Error(`Herdr pane ${run.paneId} may still be active: ${String(error)}. Do not launch a replacement.`);
    }
  };
  try {
    options.onLaunched?.(run.handle, details);
    while (true) {
      if (options.signal?.aborted || shuttingDown) {
        stop();
        return result("cancelled", `${label} was cancelled; its transcript was retained. Partial output does not establish which work completed.`);
      }
      if (Date.now() >= deadline) {
        stop();
        return result("timed_out", `${label} timed out; pane ${run.paneId} was closed and its transcript retained.`);
      }
      const metadata: RunMetadata | undefined = readMetadata(run.runDir);
      if (!metadata) throw new Error(`Missing metadata for ${label} ${run.handle}`);
      const state = effectiveRunState(metadata);
      if (state === "error") throw new Error(metadata.error ?? `${label} failed`);
      if (state === "exited") {
        let startupError = "";
        try { startupError = readFileSync(join(run.runDir, "stderr.log"), "utf8").trim(); } catch { /* Optional diagnostic. */ }
        throw new Error(`${label} exited before completing its response${startupError ? `: ${startupError.slice(-4000)}` : ""}`);
      }
      if (metadata.hasStarted && (state === "completed" || state === "idle")) {
        const message = readLatestAssistant(metadata.sessionFile);
        if (!message) throw new Error(`${label} settled without an assistant response`);
        if (message.stopReason === "error" || message.stopReason === "aborted")
          throw new Error(message.errorMessage || assistantText(message));
        if (message.stopReason === "toolUse") throw new Error(`${label} settled with an unfinished tool call`);
        return result("completed", assistantText(message));
      }
      await delay(500);
    }
  } catch (error) {
    let message = error instanceof Error ? error.message : String(error);
    try { stop(); } catch (stopError) { message += `\n${String(stopError)}`; }
    return result("failed", message);
  } finally {
    unsubscribe();
  }
}
