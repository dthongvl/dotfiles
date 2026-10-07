import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { delegate, type DelegationUpdate } from "./delegation.ts";

// Exercise the public delegate boundary with the disk/RPC contract supplied by
// pi-subagents; no child model or private helper exports are needed.
function rpcHarness(asyncDir: string, deferSpawn = false) {
	const listeners = new Map<string, Set<(data: unknown) => void>>();
	let pendingSpawn: string | undefined;
	const emit = (name: string, data: unknown) => {
		for (const listener of listeners.get(name) ?? []) listener(data);
	};
	const reply = (requestId: string, data: unknown) => emit(`subagents:rpc:v1:reply:${requestId}`, {
		version: 1, requestId, success: true, data,
	});
	const replySpawn = () => {
		assert.ok(pendingSpawn);
		reply(pendingSpawn, { details: { asyncId: "child", asyncDir } });
		pendingSpawn = undefined;
	};
	const pi = {
		events: {
			on(name: string, listener: (data: unknown) => void) {
				const handlers = listeners.get(name) ?? new Set();
				handlers.add(listener);
				listeners.set(name, handlers);
				return () => { handlers.delete(listener); };
			},
			emit(name: string, data: unknown) {
				if (name !== "subagents:rpc:v1:request") return emit(name, data);
				const request = data as { requestId: string; method: string };
				if (request.method === "spawn") {
					pendingSpawn = request.requestId;
					if (!deferSpawn) replySpawn();
				} else reply(request.requestId, {});
			},
		},
	} as unknown as ExtensionAPI;
	return { pi, emit, replySpawn, listeners };
}

for (const location of ["step", "run", "missing", "unreadable"] as const) {
	test(`delegation previews the latest three steps with ${location} session metadata`, async () => {
		const dir = await mkdtemp(join(tmpdir(), "delegation-preview-test-"));
		const asyncDir = join(dir, "async");
		const sessionFile = join(dir, "sessions", "child.jsonl");
		const { pi, emit } = rpcHarness(asyncDir);
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 3000);
		let preview: DelegationUpdate | undefined;
		try {
			await mkdir(asyncDir);
			const fullCommand = "rg -n 'progress' src/components/very-long-directory-name";
			const shortCommand = "rg -n 'progress' src/...";
			const hasTranscript = location === "step" || location === "run";
			if (hasTranscript) {
				await mkdir(join(dir, "sessions"));
				await writeFile(sessionFile, [
					JSON.stringify({ message: { role: "assistant", content: [
						{ type: "toolCall", id: "bash-1", name: "bash", arguments: { command: fullCommand } },
					] } }),
					JSON.stringify({ message: { role: "toolResult", toolCallId: "bash-1", timestamp: 100 } }),
					JSON.stringify({ message: { role: "assistant", content: [
						{ type: "toolCall", id: "write-1", name: "write", arguments: { path: "result.ts" } },
					] } }),
				].join("\n"));
			}
			await writeFile(join(asyncDir, "status.json"), JSON.stringify({
				...(location === "run" ? { sessionFile } : {}),
				steps: [{
					status: "running",
					...(location === "step" || location === "unreadable" ? { sessionFile } : {}),
					toolCount: 5,
					currentTool: "write",
					currentToolArgs: "result.ts",
					recentTools: [
						{ tool: "bash", args: "oldest", endMs: 10 },
						{ tool: "read", args: "old.ts", endMs: 20 },
						{ tool: "bash", args: shortCommand, endMs: 100 },
						{ tool: "write", args: "result.ts", endMs: 200 },
					],
				}],
			}));
			const response = await delegate(pi, {
				agent: "test", task: "preview", context: "fresh", cwd: dir,
				result: { kind: "text" },
			}, {
				ownerRunId: "parent",
				signal: controller.signal,
				onUpdate(update) {
					if (!update.recentOutputLines?.length) return;
					preview = update;
					emit("subagent:async-complete", {
						id: "child", state: "complete", success: true, summary: "finished",
					});
				},
			});
			assert.ok(preview, "status progress must not depend on a transcript at asyncDir/run-0/session.jsonl");
			assert.deepEqual(preview.recentOutputLines, [
				`bash: ${hasTranscript ? fullCommand : shortCommand}`,
				"write: result.ts",
				"write: result.ts",
			]);
			assert.equal(preview.currentTool, "write");
			assert.equal(preview.toolCount, 5);
			assert.equal(response.status, "completed");
		} finally {
			clearTimeout(timeout);
			controller.abort();
			await rm(dir, { recursive: true, force: true });
		}
	});
}

test("delegation reports startup, model waits, tools, and elapsed time without stale activity", async () => {
	const dir = await mkdtemp(join(tmpdir(), "delegation-phases-test-"));
	const { pi, emit, replySpawn, listeners } = rpcHarness(dir, true);
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 6000);
	let spawnReplyTimer: ReturnType<typeof setTimeout> | undefined;
	const updates: DelegationUpdate[] = [];
	let writes = Promise.resolve();
	let toolStarted = false;
	let toolFinished = false;
	let finished = false;
	const writeStatus = (step: Record<string, unknown>) => writeFile(join(dir, "status.json"), JSON.stringify({
		steps: [{ status: "running", sessionFile: join(dir, "unavailable.jsonl"), ...step }],
	}));
	try {
		await writeStatus({});
		spawnReplyTimer = setTimeout(replySpawn, 1100);
		const response = await delegate(pi, {
			agent: "test", task: "progress", context: "fresh", cwd: dir,
			result: { kind: "text" },
		}, {
			ownerRunId: "parent", signal: controller.signal,
			onUpdate(update) {
				if (updates.length === 0) {
					assert.equal(update.phase, "starting", "report startup before awaiting RPC");
					assert.equal(update.runId, undefined);
				}
				updates.push(update);
				if (update.phase === "waiting-for-model" && (update.durationMs ?? 0) >= 2000 && !toolStarted) {
					toolStarted = true;
					writes = writes.then(() => writeStatus({ currentTool: "read", currentToolArgs: "result.ts", toolCount: 1 }));
				} else if (update.phase === "executing-tools" && !toolFinished) {
					toolFinished = true;
					writes = writes.then(() => writeStatus({ toolCount: 1, recentTools: [{ tool: "read", args: "result.ts" }] }));
				} else if (update.phase === "waiting-for-model" && toolFinished && !finished) {
					finished = true;
					emit("subagent:async-complete", { id: "child", state: "complete", success: true, summary: "finished" });
				}
			},
		});
		await writes;
		assert.equal(response.status, "completed");
		assert.equal(updates[0].phase, "starting");
		assert.equal(updates[0].runId, undefined, "startup must be visible before the spawn reply");
		assert.ok(updates.some((update) => update.phase === "starting" && /[1-9]\d*s elapsed/.test(update.recentOutput ?? "")));
		const waiting = updates.find((update) => update.phase === "waiting-for-model");
		assert.ok(waiting?.recentOutput?.startsWith("Waiting for model"));
		assert.deepEqual(waiting.recentOutputLines, [], "model waits must publish before any tool history exists");
		assert.ok(updates.filter((update) => update.phase === "waiting-for-model" && !update.toolCount).length >= 2,
			"the heartbeat must keep model waits visible even when status does not change");
		const executing = updates.find((update) => update.phase === "executing-tools");
		assert.ok(executing?.recentOutput?.startsWith("Executing tools"));
		assert.ok(executing.recentOutput.includes("read: result.ts"));
		assert.equal(executing.currentTool, "read");
		assert.equal(updates.at(-1)?.phase, "waiting-for-model");
		assert.equal(updates.at(-1)?.currentTool, undefined, "a completed tool must not stay marked active");
		assert.ok([...listeners.values()].every((handlers) => handlers.size === 0));
		const count = updates.length;
		await new Promise((resolve) => setTimeout(resolve, 1100));
		assert.equal(updates.length, count, "completion must stop the heartbeat and polling");
	} finally {
		clearTimeout(timeout);
		if (spawnReplyTimer) clearTimeout(spawnReplyTimer);
		controller.abort();
		await writes;
		await rm(dir, { recursive: true, force: true });
	}
});
