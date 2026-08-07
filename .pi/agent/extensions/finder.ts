import { mkdtemp, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
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
const AGENT = "dthongvl.finder";
const MODEL = "openai-codex/gpt-5.6-terra";
const THINKING = "low";
const RUN_TIMEOUT_MS = 10 * 60 * 1000;
const RPC_TIMEOUT_MS = 15_000;

const description = `Intelligently search your codebase: Use it for complex, multi-step search tasks where you need to find code based on functionality or concepts rather than exact matches. Anytime you want to chain multiple grep calls you should use this tool.

WHEN TO USE THIS TOOL:
- You must locate code by behavior or concept
- You need to run multiple searches in sequence
- You must correlate or look for connections between several areas of the codebase
- You must filter broad terms ("config", "logger", "cache") by context
- You need answers to questions such as "Where do we validate JWT authentication headers?" or "Which module handles file-watcher retry logic?"

WHEN NOT TO USE THIS TOOL:
- When you know the exact file path - use read directly
- When looking for specific symbols or exact strings - use grep or find
- When you need to create, modify files, or run mutating terminal commands

USAGE GUIDELINES:
1. Spawn multiple finder calls in parallel when their search scopes are independent.
2. Formulate the query as a precise engineering request.
3. Name concrete artifacts, patterns, APIs, file types, or directories to narrow scope.
4. State explicit success criteria so the agent knows when to stop.
5. Never issue vague or exploratory queries; be definitive and goal-oriented.
6. Avoid broad root-level filename scans when the query can be directory-scoped.`;

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
		const onAbort = () => finish(() => reject(new Error("Codebase search cancelled.")));
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
			source: { extension: "dthongvl.finder" },
		});
	});
}

function completionOutput(completion: Completion): string {
	return completion.results?.[0]?.summary?.trim()
		|| completion.summary?.trim()
		|| "Finder completed without a textual response.";
}

async function truncateOutput(output: string): Promise<{ text: string; fullOutputPath?: string }> {
	const truncation = truncateHead(output, {
		maxLines: DEFAULT_MAX_LINES,
		maxBytes: DEFAULT_MAX_BYTES,
	});
	if (!truncation.truncated) return { text: output };

	const tempDir = await mkdtemp(join(tmpdir(), "pi-finder-"));
	const fullOutputPath = join(tempDir, "output.md");
	await withFileMutationQueue(fullOutputPath, () => writeFile(fullOutputPath, output, "utf8"));
	const notice = `\n\n[Finder output truncated to ${truncation.outputLines} lines or ${formatSize(truncation.outputBytes)}. Full output: ${fullOutputPath}]`;
	return { text: `${truncation.content}${notice}`, fullOutputPath };
}

async function stopRun(pi: ExtensionAPI, runId: string): Promise<void> {
	await rpc(pi, "stop", { id: runId }, { timeoutMs: RPC_TIMEOUT_MS }).catch(() => undefined);
}

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "finder",
		label: "Finder",
		description,
		promptSnippet: "Locate code by behavior or concept and return relevant files with line ranges",
		promptGuidelines: [
			"Use finder for complex, multi-step codebase discovery: behavior-level questions, flows spanning multiple modules, or correlating related patterns.",
			"For direct path, symbol, or exact-string lookups, use read, grep, or find instead of finder.",
			"Give finder a precise query with likely directories, file types, keywords, and explicit success criteria; run independent finder queries in parallel.",
		],
		renderCall(args, theme, context) {
			let output = theme.fg("toolTitle", theme.bold("Finder"));
			if (context.expanded) {
				const prompt = args.query?.trim() || "...";
				output += `\n${theme.fg("muted", "Prompt:")}\n${theme.fg("toolOutput", prompt)}`;
			}
			return new Text(output, 0, 0);
		},

		renderResult(result, { expanded, isPartial }, theme, context) {
			const output = result.content
				.filter((item): item is Extract<typeof item, { type: "text" }> => item.type === "text")
				.map((item) => item.text)
				.join("\n");
			if (isPartial || context.isError || expanded) {
				return new Text(theme.fg(context.isError ? "error" : "toolOutput", output), 0, 0);
			}
			return new Text(theme.fg("success", "Finder has completed"), 0, 0);
		},
		parameters: Type.Object({
			query: Type.String({
				description: "The search query describing what the agent should find. Be specific and include technical terms, file types, likely directories, or expected code patterns. Formulate the query so it is clear when the agent has found the right code.",
				minLength: 1,
			}),
		}, { additionalProperties: false }),

		async execute(_toolCallId, params, signal, onUpdate, ctx) {
			const query = params.query.trim();
			if (!query) throw new Error("Finder query must not be empty.");

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
				const launch = {
					agent: AGENT,
					task: query,
					model: MODEL,
				};
				const spawn = await rpc<SpawnData>(pi, "spawn", {
					workflowScript: `return runs.run("finder", ${JSON.stringify(launch)})`,
					cwd: ctx.cwd,
					context: "fresh",
					artifacts: false,
					async: true,
					timeoutMs: RUN_TIMEOUT_MS,
					agentScope: "both",
				}, {
					timeoutMs: RPC_TIMEOUT_MS,
					onLateReply: (lateSpawn) => {
						const lateRunId = lateSpawn.details?.asyncId ?? lateSpawn.details?.runId;
						if (lateRunId) void stopRun(pi, lateRunId);
					},
				});

				runId = spawn.details?.asyncId ?? spawn.details?.runId;
				if (!runId) throw new Error(`Finder spawn did not return a run id: ${spawn.text ?? "unknown response"}`);
				if (cancelled) {
					await stopRun(pi, runId);
					throw new Error("Codebase search cancelled.");
				}

				onUpdate?.({
					content: [{ type: "text", text: "Searching codebase..." }],
					details: { status: "in-progress", runId, asyncDir: spawn.details?.asyncDir, model: MODEL, thinking: THINKING, query },
				});

				const deadline = Date.now() + RUN_TIMEOUT_MS + 30_000;
				let completion: Completion | undefined;
				while (!completion) {
					if (cancelled) {
						await stopRun(pi, runId);
						throw new Error("Codebase search cancelled.");
					}
					completion = buffered.find((item) => item.id === runId || item.runId === runId);
					if (completion) break;
					const remaining = deadline - Date.now();
					if (remaining <= 0) {
						await stopRun(pi, runId);
						throw new Error(`Finder timed out. Run: ${runId}`);
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

				if (cancelled) {
					await stopRun(pi, runId);
					throw new Error("Codebase search cancelled.");
				}
				const child = completion.results?.[0];
				const output = await truncateOutput(completionOutput(completion));
				if (completion.success !== true || completion.state !== "complete" || child?.success !== true) {
					const location = completion.asyncDir ?? spawn.details?.asyncDir;
					throw new Error(`Finder run ${runId} ended in state '${completion.state ?? child?.status ?? "unknown"}': ${output.text}${location ? `\nArtifacts: ${location}` : ""}`);
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
