import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";

const RPC_REQUEST_EVENT = "subagents:rpc:v1:request";
const RPC_REPLY_PREFIX = "subagents:rpc:v1:reply:";
const AGENT = "dthongvl.oracle";
const MODEL = "openai-codex/gpt-5.6-sol";
const RUN_TIMEOUT_MS = 30 * 60 * 1000;
const RPC_TIMEOUT_MS = 15_000;

const description = `Consult the oracle - an AI advisor powered by OpenAI Codex's GPT-5.6 Sol model with high reasoning effort that can plan, review, and provide expert guidance.

The oracle has read-only access to relevant Pi tools for local code inspection, saved-thread reading, and web research.

Consult the oracle for:
- Code reviews and architecture feedback
- Difficult bugs in code paths spanning multiple files
- Planning complex implementations or refactors
- Complex technical questions requiring deep reasoning
- A second opinion when the current approach is uncertain

Do not consult the oracle for:
- Simple file reads or exact keyword searches
- Routine web lookups
- Basic code modifications or executing an already-agreed plan

Usage guidelines:
- Ask for a specific judgment, review, plan, or debugging analysis
- Include relevant context and what has already been tried
- Pass known relevant files so the oracle is instructed to read them first
- Treat the response as advisory and reconcile it with your own code reading before acting`;

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
	options: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<T> {
	return new Promise<T>((resolveReply, reject) => {
		const requestId = randomUUID();
		const replyEvent = `${RPC_REPLY_PREFIX}${requestId}`;
		let unsubscribe: (() => void) | void;
		let settled = false;

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
		const onAbort = () => finish(() => reject(new Error("Oracle consultation cancelled.")));
		const timeout = setTimeout(
			() => finish(() => reject(new Error(`pi-subagents RPC '${method}' did not reply within ${options.timeoutMs ?? RPC_TIMEOUT_MS}ms.`))),
			options.timeoutMs ?? RPC_TIMEOUT_MS,
		);

		unsubscribe = pi.events.on(replyEvent, (raw) => {
			const reply = raw as RpcReply<T>;
			if (!reply || reply.requestId !== requestId) return;
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
			source: { extension: "dthongvl.oracle" },
		});
	});
}

function completionOutput(completion: Completion): string {
	return completion.results?.[0]?.summary?.trim()
		|| completion.summary?.trim()
		|| "Oracle completed without a textual response.";
}

function buildTask(task: string, context: string | undefined, files: string[], parentThreadID?: string): string {
	const sections: string[] = [];
	if (context?.trim()) sections.push(`Context: ${context.trim()}`);
	sections.push(`Task: ${task.trim()}`);
	if (files.length > 0) sections.push(`Relevant files:\n\n${files.map((file) => `- ${file}`).join("\n")}`);
	if (parentThreadID) {
		sections.push(`Parent thread: ${parentThreadID}\nYou can use the read_thread tool with this ID to read the full conversation that invoked you if you need more context.`);
	}
	return sections.join("\n\n");
}

async function stopRun(pi: ExtensionAPI, runId: string): Promise<void> {
	await rpc(pi, "stop", { id: runId }, { timeoutMs: RPC_TIMEOUT_MS }).catch(() => undefined);
}

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "oracle",
		label: "Oracle",
		description,
		promptSnippet: "Consult a read-only GPT-5.6 Sol advisor for architecture, reviews, planning, and difficult debugging",
		promptGuidelines: [
			"Use oracle for architecture decisions, complex plans, difficult cross-file debugging, important code reviews, or a genuinely useful second opinion.",
			"Pass oracle a specific task, useful context, and every known relevant file; treat its result as advisory rather than delegating implementation ownership.",
			"Oracle automatically receives the invoking parent session ID. When a different prior Pi conversation matters, include its session ID or JSONL path and say exactly what oracle should extract with read_thread.",
		],
		renderCall(args, theme, context) {
			let output = theme.fg("toolTitle", theme.bold("Oracle"));
			if (context.expanded) {
				const prompt = args.task?.trim() || "...";
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
			return new Text(theme.fg("success", "Oracle has spoken"), 0, 0);
		},
		parameters: Type.Object({
			task: Type.String({
				description: "The task or question you want the oracle to help with. Be specific about the guidance, review, planning, or debugging judgment you need.",
				minLength: 1,
			}),
			context: Type.Optional(Type.String({
				description: "Optional context about the current situation, what you have tried, or background that would help the oracle provide better guidance.",
			})),
			files: Type.Optional(Type.Array(Type.String(), {
				description: "Optional list of specific text or image file paths the oracle should examine. Relative paths are resolved from the current working directory and requested as the subagent's initial reads.",
			})),
		}, { additionalProperties: false }),

		async execute(_toolCallId, params, signal, onUpdate, ctx) {
			const files = (params.files ?? []).map((file) => resolve(ctx.cwd, file.replace(/^@/, "")));
			const parentThreadID = ctx.sessionManager.getSessionFile()
				? ctx.sessionManager.getSessionId()
				: undefined;
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
				// RPC spawn is intentionally async-only. Do not abort the reply wait: if the
				// caller cancels during launch, we still need the returned id to stop the child.
				const launch = {
					agent: AGENT,
					task: buildTask(params.task, params.context, files, parentThreadID),
					reads: files,
					model: MODEL,
					acceptance: false,
				};
				const spawn = await rpc<SpawnData>(pi, "spawn", {
					workflowScript: `return runs.run("oracle", ${JSON.stringify(launch)})`,
					context: "fresh",
					cwd: ctx.cwd,
					artifacts: false,
					async: true,
					timeoutMs: RUN_TIMEOUT_MS,
					agentScope: "both",
				}, { timeoutMs: RPC_TIMEOUT_MS });

				runId = spawn.details?.asyncId ?? spawn.details?.runId;
				if (!runId) throw new Error(`Oracle spawn did not return a run id: ${spawn.text ?? "unknown response"}`);
				if (cancelled) {
					await stopRun(pi, runId);
					throw new Error("Oracle consultation cancelled.");
				}

				onUpdate?.({
					content: [{ type: "text", text: "Oracle is consulting the codebase..." }],
					details: { status: "in-progress", runId, asyncDir: spawn.details?.asyncDir, model: MODEL, thinking: "high" },
				});

				const deadline = Date.now() + RUN_TIMEOUT_MS + 30_000;
				let completion: Completion | undefined;
				while (!completion) {
					completion = buffered.find((item) => item.id === runId || item.runId === runId);
					if (completion) break;
					if (cancelled) {
						await stopRun(pi, runId);
						throw new Error("Oracle consultation cancelled.");
					}
					const remaining = deadline - Date.now();
					if (remaining <= 0) {
						await stopRun(pi, runId);
						throw new Error(`Oracle consultation timed out. Run: ${runId}`);
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

				const output = completionOutput(completion);
				const child = completion.results?.[0];
				if (completion.success !== true || completion.state !== "complete" || child?.success !== true) {
					const location = completion.asyncDir ?? spawn.details?.asyncDir;
					throw new Error(`Oracle run ${runId} ended in state '${completion.state ?? child?.status ?? "unknown"}': ${output}${location ? `\nArtifacts: ${location}` : ""}`);
				}

				return {
					content: [{ type: "text", text: output }],
					details: {
						status: "done",
						runId,
						asyncDir: completion.asyncDir ?? spawn.details?.asyncDir,
						durationMs: completion.durationMs,
						model: MODEL,
						thinking: "high",
						files,
						artifactPath: child.artifactPath,
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
