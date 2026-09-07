import { randomUUID } from "node:crypto";
import { mkdtemp, writeFile } from "node:fs/promises";
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

// Documented pi-subagents structured delegation protocol. Kept here because the
// git-installed extension is intentionally not a Node-resolvable dependency.
export const DELEGATION_REQUEST_EVENT = "prompt-template:subagent:request";
export const DELEGATION_STARTED_EVENT = "prompt-template:subagent:started";
export const DELEGATION_UPDATE_EVENT = "prompt-template:subagent:update";
export const DELEGATION_RESPONSE_EVENT = "prompt-template:subagent:response";
export const DELEGATION_CANCEL_EVENT = "prompt-template:subagent:cancel";

export type DelegationThinking = "off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";
export interface DelegationIdentity {
	requestId: string;
	ownerRunId: string;
	nodeId: string;
}
export interface DelegationRequest extends DelegationIdentity {
	agent: string;
	task: string;
	context: "fresh" | "fork";
	cwd: string;
	model?: string;
	thinking?: DelegationThinking;
	timeoutMs?: number;
	artifacts?: boolean;
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

export function matchesDelegation(payload: Partial<DelegationIdentity>, identity: DelegationIdentity): boolean {
	return (
		payload.requestId === identity.requestId &&
		payload.ownerRunId === identity.ownerRunId &&
		payload.nodeId === identity.nodeId
	);
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
	return new Promise((resolve) => {
		let settled = false;
		let launched = false;
		let cancellationTimer: ReturnType<typeof setTimeout> | undefined;
		const unsubscribers: Array<() => void> = [];
		const cleanup = () => {
			for (const unsubscribe of unsubscribers) unsubscribe();
			clearTimeout(timer);
			if (cancellationTimer) clearTimeout(cancellationTimer);
			options.signal?.removeEventListener("abort", cancel);
		};
		const finish = (response: DelegationResponse) => {
			if (settled) return;
			settled = true;
			cleanup();
			resolve(response);
		};
		const cancel = () => {
			if (!launched) {
				finish({ ...identity, status: "cancelled", error: "Delegation cancelled." });
				return;
			}
			pi.events.emit(DELEGATION_CANCEL_EVENT, identity);
			if (!cancellationTimer)
				cancellationTimer = setTimeout(
					() =>
						finish({
							...identity,
							status: "cancelled",
							error: "Delegation cancellation was not acknowledged.",
						}),
					2_000,
				);
		};
		const timer = setTimeout(
			() => {
				pi.events.emit(DELEGATION_CANCEL_EVENT, identity);
				finish({
					...identity,
					status: "timed_out",
					error: "Delegation timed out.",
				});
			},
			(request.timeoutMs ?? 30 * 60_000) + 30_000,
		);
		unsubscribers.push(
			pi.events.on(DELEGATION_STARTED_EVENT, (raw) => {
				if (matchesDelegation(raw as Partial<DelegationIdentity>, identity)) options.onStarted?.();
			}),
		);
		unsubscribers.push(
			pi.events.on(DELEGATION_UPDATE_EVENT, (raw) => {
				const update = raw as DelegationUpdate;
				if (matchesDelegation(update, identity)) options.onUpdate?.(update);
			}),
		);
		unsubscribers.push(
			pi.events.on(DELEGATION_RESPONSE_EVENT, (raw) => {
				const response = raw as DelegationResponse;
				if (matchesDelegation(response, identity)) finish(response);
			}),
		);
		options.signal?.addEventListener("abort", cancel, { once: true });
		// Recheck after listeners are installed and before launch.
		if (options.signal?.aborted) {
			cancel();
			return;
		}
		launched = true;
		pi.events.emit(DELEGATION_REQUEST_EVENT, { ...identity, ...request });
	});
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
