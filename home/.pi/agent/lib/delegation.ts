export { resolveSubagentModel, type ResolvedSubagentModel, type ResolveSubagentModelOptions } from "./subagent-model.ts";
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
import type {
	SubagentDelegationRequest,
	SubagentDelegationResponse,
	SubagentDelegationStarted,
	SubagentDelegationTerminalResponse,
	SubagentDelegationThinking,
	SubagentDelegationUpdate,
	SubagentDelegationUsage,
} from "pi-subagents/delegation";

// Public event contract from pi-subagents/delegation. Personal extensions are
// not Node dependents of separately installed Pi packages, so keep imports
// type-only and use the documented event names at runtime.
const REQUEST_EVENT = "prompt-template:subagent:request";
const STARTED_EVENT = "prompt-template:subagent:started";
const UPDATE_EVENT = "prompt-template:subagent:update";
const RESPONSE_EVENT = "prompt-template:subagent:response";
const CANCEL_EVENT = "prompt-template:subagent:cancel";
const START_TIMEOUT_MS = 15_000;
const TERMINAL_GRACE_MS = 30_000;

export type DelegationThinking = SubagentDelegationThinking;
export type DelegationIdentity = SubagentDelegationStarted;
export type DelegationRequest = SubagentDelegationRequest;
export type DelegationIntercomBridge = NonNullable<DelegationRequest["intercomBridge"]>;
export type DelegationUpdate = SubagentDelegationUpdate;
export type DelegationUsage = SubagentDelegationUsage;
// This adapter always supplies a valid identity, including on invalid_request.
export type DelegationResponse = Omit<SubagentDelegationTerminalResponse, "status"> & {
	status: SubagentDelegationResponse["status"];
};

// A blocking wrapper cannot answer contact_supervisor while awaiting its child.
const DEFAULT_INTERCOM_BRIDGE: DelegationIntercomBridge = { mode: "off" };

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

/** Await one package-owned foreground leaf, without detached-run polling. */
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

	return new Promise<DelegationResponse>((resolve, reject) => {
		let settled = false;
		let started = false;
		let cancelling = false;
		let runId: string | undefined;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const unsubscribers: Array<() => void> = [];
		const matches = (value: unknown): value is DelegationIdentity => {
			if (!value || typeof value !== "object") return false;
			const payload = value as Partial<DelegationIdentity>;
			return payload.requestId === identity.requestId &&
				payload.ownerRunId === identity.ownerRunId && payload.nodeId === identity.nodeId;
		};
		const cleanup = () => {
			if (timer) clearTimeout(timer);
			for (const unsubscribe of unsubscribers) unsubscribe();
			options.signal?.removeEventListener("abort", abort);
		};
		const finish = (response: DelegationResponse) => {
			if (settled) return;
			settled = true;
			cleanup();
			resolve(response);
		};
		const fail = (error: unknown) => {
			if (settled) return;
			settled = true;
			cleanup();
			pi.events.emit(CANCEL_EVENT, identity);
			reject(error);
		};
		const armTimeout = (ms: number, status: "cancelled" | "timed_out", error: string) => {
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => {
				// Cancel first: the package may synchronously provide a terminal reply.
				pi.events.emit(CANCEL_EVENT, identity);
				finish({ ...identity, runId, status, error });
			}, ms);
		};
		const abort = () => {
			if (settled || cancelling) return;
			cancelling = true;
			// Retain response listeners so authoritative cancellation usage is kept.
			armTimeout(TERMINAL_GRACE_MS, "cancelled", "Delegation cancelled; no terminal response received.");
			pi.events.emit(CANCEL_EVENT, identity);
		};

		try {
			unsubscribers.push(pi.events.on(STARTED_EVENT, (payload) => {
				if (!matches(payload) || settled || started) return;
				started = true;
				if (!cancelling) armTimeout(
					Math.min((request.timeoutMs ?? 30 * 60_000) + TERMINAL_GRACE_MS, 2_147_483_647),
					"timed_out", "Delegation timed out; no terminal response received.",
				);
				try { options.onStarted?.(); } catch (error) { fail(error); }
			}));
			unsubscribers.push(pi.events.on(UPDATE_EVENT, (payload) => {
				if (!matches(payload) || settled) return;
				const update = payload as DelegationUpdate;
				runId = update.runId ?? runId;
				if (!cancelling) {
					try { options.onUpdate?.(update); } catch (error) { fail(error); }
				}
			}));
			unsubscribers.push(pi.events.on(RESPONSE_EVENT, (payload) => {
				if (!matches(payload) || settled) return;
				finish({ ...(payload as SubagentDelegationResponse), ...identity });
			}));
			unsubscribers.push(pi.on("session_shutdown", () => {
				pi.events.emit(CANCEL_EVENT, identity);
				finish({ ...identity, runId, status: "cancelled", error: "Delegation owner shut down." });
			}));
			options.signal?.addEventListener("abort", abort, { once: true });
			armTimeout(START_TIMEOUT_MS, "timed_out", "pi-subagents delegation did not start. Check that pi-subagents is loaded in this session.");
			const ownedRequest: DelegationRequest = {
				...request,
				...identity,
				artifacts: request.artifacts ?? false,
				intercomBridge: request.intercomBridge ?? DEFAULT_INTERCOM_BRIDGE,
			};
			pi.events.emit(REQUEST_EVENT, ownedRequest);
			if (options.signal?.aborted) abort();
		} catch (error) {
			fail(error);
		}
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
