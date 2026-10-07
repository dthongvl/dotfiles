import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { delegate, type DelegationUpdate } from "./delegation.ts";

// Exercise the public delegate boundary with the disk/RPC contract supplied by
// pi-subagents; no child model or private helper exports are needed.
for (const location of ["step", "run", "missing", "unreadable"] as const) {
	test(`delegation previews the latest three steps with ${location} session metadata`, async () => {
		const dir = await mkdtemp(join(tmpdir(), "delegation-preview-test-"));
		const asyncDir = join(dir, "async");
		const sessionFile = join(dir, "sessions", "child.jsonl");
		const listeners = new Map<string, Set<(data: unknown) => void>>();
		const emit = (name: string, data: unknown) => {
			for (const listener of listeners.get(name) ?? []) listener(data);
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
					emit(`subagents:rpc:v1:reply:${request.requestId}`, {
						version: 1,
						requestId: request.requestId,
						success: true,
						data: request.method === "spawn" ? { details: { asyncId: "child", asyncDir } } : {},
					});
				},
			},
		} as unknown as ExtensionAPI;
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
