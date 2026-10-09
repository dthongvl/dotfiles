import { existsSync, readFileSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { closePane, herdr, paneExists } from "./herdr.ts";
import {
	effectiveRunState,
	inboxDir,
	launchRun,
	listRuns,
	readMetadata,
	runDisplayName,
	type InboxMessage,
	updateMetadata,
	waitForRunShutdown,
} from "./shared.ts";


function isInboxMessage(value: unknown): value is InboxMessage {
	if (typeof value !== "object" || value === null) return false;
	const message = value as Record<string, unknown>;
	return typeof message.message === "string" && (message.delivery === "auto" || message.delivery === "followUp");
}

export default function subagentExtension(pi: ExtensionAPI) {
	const runDir = process.env.PI_SUBAGENT_RUN_DIR;
	if (!runDir) {
		pi.registerCommand("herdr-subagent", {
			description: "Focus a Herdr subagent pane spawned by this session",
			handler: async (_args, ctx) => {
				const runs = listRuns(ctx.sessionManager.getSessionId()).filter((run) => paneExists(run.paneId));
				const labels = runs.map((run) => `${runDisplayName(run)} — ${effectiveRunState(run)}`);
				if (!runs.length) { ctx.ui.notify("No active Herdr subagents", "info"); return; }
				const selected = await ctx.ui.select("Herdr subagents", labels);
				const run = runs[labels.indexOf(selected ?? "")];
				if (run?.paneId) herdr(["agent", "focus", run.paneId]);
			},
		});
		pi.on("session_start", (_event, ctx) => {
			for (const run of listRuns(ctx.sessionManager.getSessionId())) {
				if (!run.suspended || paneExists(run.paneId) || !existsSync(run.sessionFile)) continue;
				const starting = updateMetadata(run.runDir, { state: "starting", error: undefined }) ?? run;
				try { launchRun({ ...starting, parentPaneId: process.env.HERDR_PANE_ID }); }
				catch (error) { updateMetadata(run.runDir, { state: "error", error: String(error) }); }
			}
		});
		pi.on("session_shutdown", async (event, ctx) => {
			if (event.reason === "reload") return;
			for (const run of listRuns(ctx.sessionManager.getSessionId())) {
				if (!paneExists(run.paneId)) continue;
				updateMetadata(run.runDir, { suspended: true });
				closePane(run.paneId);
				await waitForRunShutdown(run.runDir);
			}
		});
		return;
	}

	// Retained panes must not generate idle cache-warming requests.
	pi.on("cache_warming_decision", () => ({ action: "stop" }));
	let currentContext: ExtensionContext | undefined;
	let timer: ReturnType<typeof setInterval> | undefined;
	let processing = false;
	let sessionName: string | undefined;

	const syncSessionName = (): void => {
		const metadata = readMetadata(runDir);
		if (!metadata) return;
		const next = `subagent ${metadata.name ?? metadata.handle}`;
		if (next === sessionName) return;
		pi.setSessionName(next);
		sessionName = next;
	};

	const processInbox = async (): Promise<void> => {
		if (processing || !currentContext) return;
		syncSessionName();
		const queueDir = inboxDir(runDir);
		if (!existsSync(queueDir)) return;
		processing = true;
		try {
			for (const name of readdirSync(queueDir)
				.filter((entry) => entry.endsWith(".json"))
				.sort()) {
				const path = join(queueDir, name);
				let payload: InboxMessage;
				try {
					const value: unknown = JSON.parse(readFileSync(path, "utf8"));
					if (!isInboxMessage(value)) throw new Error("Invalid inbox message");
					payload = value;
				} catch (error) {
					unlinkSync(path);
					updateMetadata(runDir, {
						state: "error",
						error: error instanceof Error ? error.message : String(error),
					});
					continue;
				}

				updateMetadata(runDir, { state: "busy", error: undefined });
				try {
					if (currentContext.isIdle()) {
						pi.sendUserMessage(payload.message);
					} else {
						pi.sendUserMessage(payload.message, {
							deliverAs: payload.delivery === "followUp" ? "followUp" : "steer",
						});
					}
					unlinkSync(path);
				} catch (error) {
					updateMetadata(runDir, {
						state: currentContext.isIdle() ? "idle" : "busy",
						error: error instanceof Error ? error.message : String(error),
					});
					return;
				}
			}
		} finally {
			processing = false;
		}
	};

	pi.on("session_start", (_event, ctx) => {
		currentContext = ctx;
		const metadata = readMetadata(runDir);
		if (!metadata) return;
		updateMetadata(runDir, {
			childSessionId: ctx.sessionManager.getSessionId(),
			sessionFile: ctx.sessionManager.getSessionFile() ?? metadata.sessionFile,
			state: ctx.isIdle() ? "idle" : "busy",
			suspended: undefined,
			error: undefined,
		});
		syncSessionName();
		if (!timer) {
			timer = setInterval(() => void processInbox(), 250);
			timer.unref();
		}
		void processInbox();
	});

	pi.on("agent_start", (_event, ctx) => {
		currentContext = ctx;
		updateMetadata(runDir, { state: "busy", hasStarted: true, error: undefined });
	});

	pi.on("agent_settled", (_event, ctx) => {
		currentContext = ctx;
		if (!ctx.isIdle()) return;
		const metadata = updateMetadata(runDir, { state: "idle" });
		if (!metadata?.hasStarted || metadata.keepPane) return;
		const queueDir = inboxDir(runDir);
		if (existsSync(queueDir) && readdirSync(queueDir).some((name) => name.endsWith(".json"))) return;
		// Shut down cleanly before the launcher closes the pane; waiters retain the result.
		updateMetadata(runDir, { state: "completed", suspended: false });
		ctx.shutdown();
	});

	pi.on("session_shutdown", (event) => {
		currentContext = undefined;
		if (timer) {
			clearInterval(timer);
			timer = undefined;
		}
		if (event.reason === "quit" && readMetadata(runDir)?.state !== "completed")
			updateMetadata(runDir, { state: "exited" });
	});
}
