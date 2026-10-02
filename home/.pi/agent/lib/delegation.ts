export { resolveSubagentModel, type ResolvedSubagentModel, type ResolveSubagentModelOptions } from "./subagent-model.ts";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	DEFAULT_MAX_BYTES,
	DEFAULT_MAX_LINES,
	formatSize,
	truncateHead,
	withFileMutationQueue,
	type ExtensionAPI,
} from "@earendil-works/pi-coding-agent";
import type { Usage } from "@earendil-works/pi-ai";

// Documented pi-subagents RPC protocol. RPC spawn is async-only, which makes
// extension-owned children first-class, controllable entries in FleetView.
const RPC_REQUEST_EVENT = "subagents:rpc:v1:request";
const RPC_REPLY_PREFIX = "subagents:rpc:v1:reply:";
const ASYNC_COMPLETE_EVENT = "subagent:async-complete";
const RPC_TIMEOUT_MS = 15_000;
const PREVIEW_POLL_MS = 750;

type RpcReply<T> =
	| { version: 1; requestId: string; success: true; data: T }
	| { version: 1; requestId: string; success: false; error: { code: string; message: string } };

type RpcSpawn = {
	text?: string;
	details?: { runId?: string; asyncId?: string; asyncDir?: string };
};

type AsyncRunStatus = {
	steps?: Array<{
		status?: string;
		currentTool?: string;
		currentToolArgs?: string;
		toolCount?: number;
		recentTools?: Array<{ tool: string; args: string; endMs?: number }>;
	}>;
};
type ToolCallPreview = { id?: string; tool: string; args: string; completedAt?: number };

type AsyncCompletion = {
	id?: string;
	runId?: string;
	state?: string;
	success?: boolean;
	summary?: string;
	durationMs?: number;
	results?: Array<{
		status?: string;
		success?: boolean;
		summary?: string;
		agent?: string;
		model?: string;
		thinking?: string;
		usage?: {
			input?: number;
			output?: number;
			cacheRead?: number;
			cacheWrite?: number;
			cost?: number | { total?: number };
			turns?: number;
			toolCalls?: number;
			durationMs?: number;
		};
	}>;
};

export type DelegationThinking = "off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";
export interface DelegationIdentity {
	requestId: string;
	ownerRunId: string;
	nodeId: string;
}
export interface DelegationIntercomBridge {
	mode?: "always" | "fork-only" | "off";
	instructionFile?: string;
	resultDelivery?: boolean;
}
/**
 * Delegation wrappers cannot answer a blocking contact_supervisor ask: the
 * parent stays blocked inside the calling tool until the child finishes, so the
 * ask only stalls until the 10-minute timeout. Delegated spawns therefore
 * default to the bridge off; pass intercomBridge to opt a spawn back in.
 */
const DEFAULT_INTERCOM_BRIDGE: DelegationIntercomBridge = { mode: "off" };
export interface DelegationRequest extends DelegationIdentity {
	agent: string;
	task: string;
	context: "fresh" | "fork";
	cwd: string;
	model?: string;
	thinking?: DelegationThinking;
	timeoutMs?: number;
	artifacts?: boolean;
	/** Override the delegation default of { mode: "off" }. */
	intercomBridge?: DelegationIntercomBridge;
	result: { kind: "text" } | { kind: "structured"; schema: Record<string, unknown> };
}
export interface DelegationUpdate extends DelegationIdentity {
	runId?: string;
	currentTool?: string;
	currentToolArgs?: string;
	recentOutput?: string;
	recentOutputLines?: string[];
	recentTools?: Array<{ tool: string; args: string }>;
	model?: string;
	toolCount?: number;
	durationMs?: number;
	tokens?: number;
}
export interface DelegationUsage {
	input: number;
	output: number;
	cacheRead: number;
	cacheWrite: number;
	cost: number;
	turns: number;
	toolCalls: number;
	durationMs: number;
}
export interface DelegationResponse {
	requestId: string;
	ownerRunId?: string;
	nodeId?: string;
	status: string;
	error?: string;
	runId?: string;
	agent?: string;
	model?: string;
	thinking?: string;
	result?: { kind: "text"; text: string } | { kind: "structured"; value: unknown };
	usage?: DelegationUsage;
}

function rpc<T>(
	pi: ExtensionAPI,
	method: "spawn" | "stop",
	params: Record<string, unknown>,
	options: { timeoutMs?: number; onLateReply?: (data: T) => void } = {},
): Promise<T> {
	return new Promise((resolve, reject) => {
		const requestId = randomUUID();
		let settled = false;
		let unsubscribe: (() => void) | void;
		let timer: ReturnType<typeof setTimeout>;
		const cleanup = () => {
			if (typeof unsubscribe === "function") unsubscribe();
			clearTimeout(timer);
		};
		const finish = (callback: () => void) => {
			if (settled) return;
			settled = true;
			cleanup();
			callback();
		};
		timer = setTimeout(() => {
			if (!options.onLateReply) {
				finish(() => reject(new Error(`pi-subagents RPC '${method}' timed out.`)));
				return;
			}
			settled = true;
			reject(new Error(`pi-subagents RPC '${method}' timed out.`));
			timer = setTimeout(cleanup, 60_000);
		}, options.timeoutMs ?? RPC_TIMEOUT_MS);
		unsubscribe = pi.events.on(`${RPC_REPLY_PREFIX}${requestId}`, (raw) => {
			const reply = raw as RpcReply<T>;
			if (!reply || reply.requestId !== requestId) return;
			if (settled) {
				if (reply.success) options.onLateReply?.(reply.data);
				cleanup();
				return;
			}
			if (reply.success) finish(() => resolve(reply.data));
			else finish(() => reject(new Error(`${reply.error.code}: ${reply.error.message}`)));
		});
		pi.events.emit(RPC_REQUEST_EVENT, {
			version: 1,
			requestId,
			method,
			params,
			source: { extension: "dthongvl.delegation" },
		});
	});
}

function asyncUsage(completion: AsyncCompletion): DelegationUsage | undefined {
	const usage = completion.results?.[0]?.usage;
	if (!usage) return undefined;
	return {
		input: usage.input ?? 0,
		output: usage.output ?? 0,
		cacheRead: usage.cacheRead ?? 0,
		cacheWrite: usage.cacheWrite ?? 0,
		cost: typeof usage.cost === "number" ? usage.cost : (usage.cost?.total ?? 0),
		turns: usage.turns ?? 0,
		toolCalls: usage.toolCalls ?? 0,
		durationMs: usage.durationMs ?? completion.durationMs ?? 0,
	};
}

function fullToolArgPreview(args: Record<string, unknown>): string {
	const value = ["command", "path", "file_path", "pattern", "query", "url", "task", "describe", "search"]
		.map((key) => args[key])
		.find((item): item is string => typeof item === "string" && item.trim().length > 0);
	if (!value) return "";
	const normalized = value.replace(/\s+/g, " ").trim();
	return normalized.length > 500 ? `${normalized.slice(0, 497)}...` : normalized;
}

async function readFullToolArgs(asyncDir: string): Promise<ToolCallPreview[]> {
	const transcript = await readFile(join(asyncDir, "run-0", "session.jsonl"), "utf8");
	const calls: ToolCallPreview[] = [];
	for (const line of transcript.split("\n")) {
		if (!line) continue;
		let entry: {
			timestamp?: string | number;
			message?: { role?: string; content?: unknown[]; toolCallId?: string; timestamp?: number };
		};
		try {
			entry = JSON.parse(line) as typeof entry;
		} catch {
			continue;
		}
		if (entry.message?.role === "assistant" && Array.isArray(entry.message.content)) {
			for (const item of entry.message.content) {
				if (!item || typeof item !== "object") continue;
				const call = item as { type?: string; id?: string; name?: string; arguments?: Record<string, unknown> };
				if (call.type !== "toolCall" || !call.name || !call.arguments) continue;
				calls.push({ id: call.id, tool: call.name, args: fullToolArgPreview(call.arguments) });
			}
			continue;
		}
		if (entry.message?.role !== "toolResult" || !entry.message.toolCallId) continue;
		const call = calls.findLast((item) => item.id === entry.message?.toolCallId);
		if (!call) continue;
		const timestamp = entry.message.timestamp ?? entry.timestamp;
		const completedAt = typeof timestamp === "number" ? timestamp : typeof timestamp === "string" ? Date.parse(timestamp) : NaN;
		if (Number.isFinite(completedAt)) call.completedAt = completedAt;
	}
	return calls;
}

function restoreFullArgs(tool: string, preview: string, endMs: number | undefined, calls: ToolCallPreview[], used: Set<number>): string {
	const prefix = preview.endsWith("...") ? preview.slice(0, -3) : preview;
	const match = calls
		.map((call, index) => ({ call, index }))
		.filter(({ call, index }) => !used.has(index) && call.tool === tool && call.args.startsWith(prefix))
		.sort((left, right) => {
			if (endMs !== undefined) {
				const leftDistance = left.call.completedAt === undefined ? Number.POSITIVE_INFINITY : Math.abs(left.call.completedAt - endMs);
				const rightDistance = right.call.completedAt === undefined ? Number.POSITIVE_INFINITY : Math.abs(right.call.completedAt - endMs);
				if (leftDistance !== rightDistance) return leftDistance - rightDistance;
			} else if ((left.call.completedAt === undefined) !== (right.call.completedAt === undefined)) {
				return left.call.completedAt === undefined ? -1 : 1;
			}
			return right.index - left.index;
		})[0];
	if (match) {
		used.add(match.index);
		return match.call.args;
	}
	return preview;
}

function liveTools(status: AsyncRunStatus, fullCalls: ToolCallPreview[] = []): Pick<DelegationUpdate, "currentTool" | "currentToolArgs" | "toolCount" | "recentTools" | "recentOutputLines"> | undefined {
	const step = status.steps?.find((item) => item.status === "running") ?? status.steps?.[0];
	if (!step) return undefined;
	const used = new Set<number>();
	const recentTools = (step.recentTools ?? []).slice(-3).map(({ tool, args, endMs }) => ({
		tool,
		args: restoreFullArgs(tool, args, endMs, fullCalls, used),
	}));
	const recentOutputLines = recentTools.map(({ tool, args }) => `${tool}: ${args}`);
	const currentToolArgs = step.currentTool
		? restoreFullArgs(step.currentTool, step.currentToolArgs ?? "", undefined, fullCalls, used)
		: step.currentToolArgs;
	if (step.currentTool && !recentTools.some(({ tool, args }) => tool === step.currentTool && args === (currentToolArgs ?? ""))) {
		recentOutputLines.push(`${step.currentTool}: ${currentToolArgs ?? ""}`);
	}
	if (recentOutputLines.length === 0 && !step.currentTool) return undefined;
	return {
		currentTool: step.currentTool,
		currentToolArgs,
		toolCount: step.toolCount,
		recentTools,
		recentOutputLines,
	};
}

export function delegationUsage(usage?: DelegationUsage): Usage | undefined {
	if (!usage) return undefined;
	const billedTokens = usage.input + usage.output + usage.cacheRead + usage.cacheWrite;
	const costFor = (tokens: number) => (billedTokens > 0 ? (usage.cost * tokens) / billedTokens : 0);
	return {
		input: usage.input,
		output: usage.output,
		cacheRead: usage.cacheRead,
		cacheWrite: usage.cacheWrite,
		totalTokens: billedTokens,
		cost: {
			input: costFor(usage.input),
			output: costFor(usage.output),
			cacheRead: costFor(usage.cacheRead),
			cacheWrite: costFor(usage.cacheWrite),
			total: usage.cost,
		},
	};
}

export function installDelegationFailureAccounting(pi: ExtensionAPI, toolName: string) {
	const pending = new Map<string, { usage?: Usage; details?: Record<string, unknown> }>();
	pi.on("tool_result", (event) => {
		if (event.toolName !== toolName || !event.isError) return;
		const terminal = pending.get(event.toolCallId);
		if (!terminal) return;
		pending.delete(event.toolCallId);
		const existing =
			event.details && typeof event.details === "object" ? (event.details as Record<string, unknown>) : {};
		return { isError: true, usage: terminal.usage, details: { ...existing, ...terminal.details } };
	});
	return (toolCallId: string, usage?: DelegationUsage, details?: Record<string, unknown>) => {
		if (pending.size >= 128) pending.delete(pending.keys().next().value!);
		pending.set(toolCallId, { usage: delegationUsage(usage), details });
	};
}

export async function delegate(
	pi: ExtensionAPI,
	request: Omit<DelegationRequest, keyof DelegationIdentity>,
	options: {
		ownerRunId: string;
		nodeId?: string;
		signal?: AbortSignal;
		onStarted?: () => void;
		onUpdate?: (update: DelegationUpdate) => void;
	},
): Promise<DelegationResponse> {
	const identity: DelegationIdentity = {
		requestId: randomUUID(),
		ownerRunId: options.ownerRunId,
		nodeId: options.nodeId ?? `delegation-${randomUUID()}`,
	};
	if (options.signal?.aborted) return { ...identity, status: "cancelled", error: "Delegation cancelled." };

	let runId: string | undefined;
	let asyncDir: string | undefined;
	let cancelled = false;
	let polling = false;
	let pollTimer: ReturnType<typeof setTimeout> | undefined;
	let lastDetail: string | undefined;
	let lastStatusDetail: string | undefined;
	const completions: AsyncCompletion[] = [];
	let wake: (() => void) | undefined;
	const unsubscribe = pi.events.on(ASYNC_COMPLETE_EVENT, (raw) => {
		const completion = raw as AsyncCompletion;
		completions.push(completion);
		wake?.();
	});
	const stop = async (id: string) => {
		await rpc(pi, "stop", { id }).catch(() => undefined);
	};
	const abort = () => {
		cancelled = true;
		wake?.();
		if (runId) void stop(runId);
	};
	options.signal?.addEventListener("abort", abort, { once: true });

	try {
		const model = request.model && request.thinking && !request.model.endsWith(`:${request.thinking}`)
			? `${request.model}:${request.thinking}`
			: request.model;
		const spawnParams: Record<string, unknown> = {
			agent: request.agent,
			task: request.task,
			context: request.context,
			cwd: request.cwd,
			...(model ? { model } : {}),
			...(request.timeoutMs ? { timeoutMs: request.timeoutMs } : {}),
			artifacts: request.artifacts ?? false,
			intercomBridge: request.intercomBridge ?? DEFAULT_INTERCOM_BRIDGE,
			async: true,
			mission: false,
		};
		const spawn = await rpc<RpcSpawn>(pi, "spawn", spawnParams, {
			onLateReply: (late) => {
				const id = late.details?.asyncId ?? late.details?.runId;
				if (id) void stop(id);
			},
		});
		runId = spawn.details?.asyncId ?? spawn.details?.runId;
		asyncDir = spawn.details?.asyncDir;
		if (!runId) throw new Error(`Subagent spawn did not return a run id: ${spawn.text ?? "unknown response"}`);
		if (cancelled) {
			await stop(runId);
			return { ...identity, runId, status: "cancelled", error: "Delegation cancelled." };
		}
		options.onStarted?.();
		options.onUpdate?.({ ...identity, runId, model: request.model });
		polling = true;
		const pollPreview = async () => {
			if (!polling || cancelled || !runId || !asyncDir) return;
			try {
				const status = JSON.parse(await readFile(join(asyncDir, "status.json"), "utf8")) as AsyncRunStatus;
				if (!polling || cancelled) return;
				const statusDetail = liveTools(status)?.recentOutputLines?.join("\n");
				if (!statusDetail || statusDetail === lastStatusDetail) return;
				const fullCalls = await readFullToolArgs(asyncDir).catch(() => undefined);
				if (!fullCalls) return;
				const progress = liveTools(status, fullCalls);
				const detail = progress?.recentOutputLines?.join("\n");
				if (progress && detail && detail !== lastDetail) {
					lastStatusDetail = statusDetail;
					lastDetail = detail;
					options.onUpdate?.({
						...identity,
						runId,
						model: request.model,
						...progress,
					});
				}
			} catch {
				// A status read can race run startup or completion; the next poll retries.
			} finally {
				if (polling && !cancelled) pollTimer = setTimeout(() => void pollPreview(), PREVIEW_POLL_MS);
			}
		};
		void pollPreview();

		const deadline = Date.now() + (request.timeoutMs ?? 30 * 60_000) + 30_000;
		let completion: AsyncCompletion | undefined;
		while (!completion) {
			completion = completions.find((item) => item.id === runId || item.runId === runId);
			if (completion) break;
			if (cancelled) {
				await stop(runId);
				return { ...identity, runId, status: "cancelled", error: "Delegation cancelled." };
			}
			const remaining = deadline - Date.now();
			if (remaining <= 0) {
				await stop(runId);
				return { ...identity, runId, status: "timed_out", error: "Delegation timed out." };
			}
			await new Promise<void>((resolve) => {
				const timer = setTimeout(resolve, remaining);
				wake = () => {
					clearTimeout(timer);
					resolve();
				};
			});
			wake = undefined;
		}

		const child = completion.results?.[0];
		const output = child?.summary?.trim() || completion.summary?.trim();
		const success = completion.success === true && child?.success !== false && completion.state === "complete";
		return {
			...identity,
			runId,
			agent: child?.agent ?? request.agent,
			model: child?.model ?? request.model,
			thinking: child?.thinking ?? request.thinking,
			status: success ? "completed" : completion.state === "stopped" ? "cancelled" : "failed",
			...(output ? { result: { kind: "text" as const, text: output } } : {}),
			...(!success ? { error: output ?? `Subagent ended in state '${completion.state ?? child?.status ?? "unknown"}'.` } : {}),
			usage: asyncUsage(completion),
		};
	} finally {
		polling = false;
		if (pollTimer) clearTimeout(pollTimer);
		unsubscribe();
		options.signal?.removeEventListener("abort", abort);
	}
}

export async function truncateToolOutput(
	output: string,
	label: string,
	prefix: string,
): Promise<{ text: string; fullOutputPath?: string }> {
	const truncation = truncateHead(output, {
		maxLines: DEFAULT_MAX_LINES,
		maxBytes: DEFAULT_MAX_BYTES,
	});
	if (!truncation.truncated) return { text: output };
	const dir = await mkdtemp(join(tmpdir(), prefix));
	const fullOutputPath = join(dir, "output.md");
	await withFileMutationQueue(fullOutputPath, () => writeFile(fullOutputPath, output, "utf8"));
	return {
		text: `${truncation.content}\n\n[${label} truncated to ${truncation.outputLines} lines or ${formatSize(truncation.outputBytes)}. Full output: ${fullOutputPath}]`,
		fullOutputPath,
	};
}
