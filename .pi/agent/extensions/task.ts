import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import {
	delegate,
	delegationUsage,
	installDelegationFailureAccounting,
	truncateToolOutput,
	type DelegationUpdate,
} from "../lib/delegation.ts";

const CHILD_TOOLS = ["fffind", "ffgrep", "subagent", "read", "grep", "find", "ls", "bash", "edit", "write"] as const;

const TASK_AGENT = "dthongvl.task";
const RUN_TIMEOUT_MS = 30 * 60 * 1000;

const DESCRIPTION = `Perform a task (a sub-task of the user's overall task) using a sub-agent that has access to the following Pi tools: ${CHILD_TOOLS.join(", ")}.


When to use the Task tool:
- When you need to perform complex multi-step tasks
- When you need to run an operation that will produce a lot of output (tokens) that is not needed after the sub-agent's task completes
- When you are making changes across many layers of an application (frontend, backend, API layer, etc.), after you have first planned and spec'd out the changes so they can be implemented independently by multiple sub-agents
- When the user asks you to launch an "agent" or "subagent", because the user assumes that the agent will do a good job

When NOT to use the Task tool:
- When you are performing a single logical task, such as adding a new feature to a single part of an application.
- When you're reading a single file (use read), performing a text search (use grep), or editing a single file (use edit)
- When you're not sure what changes you want to make. Use all tools available to you to determine the changes to make.

How to use the Task tool:
- Run multiple sub-agents concurrently if the tasks may be performed independently (e.g., if they do not involve editing the same parts of the same file), by including multiple tool uses in a single assistant message.
- You will not see the individual steps of the sub-agent's execution, and you can't communicate with it until it finishes, at which point you will receive a summary of its work.
- Include all necessary context from the user's message and prior assistant steps, as well as a detailed plan for the task, in the task description. Be specific about what the sub-agent should return when finished to summarize its work.
- Tell the sub-agent how to verify its work if possible (e.g., by mentioning the relevant test commands to run).
- When the agent is done, it will return a single message back to you. The result returned by the agent is not visible to the user. To show the user the result, you should send a text message back to the user with a concise summary of the result.`;

type ToolProgress = {
	id: string;
	tool_name: string;
	status: "in-progress" | "done" | "error";
	input?: unknown;
};

type TurnProgress = {
	message?: string;
	tool_uses: ToolProgress[];
};

type TaskDetails = {
	status: "in-progress" | "done" | "error" | "cancelled";
	error?: { message: string };
	reason?: string;
	runId?: string;
	model?: string;
	progress: TurnProgress[];
};

function modelName(model: { provider: string; id: string } | undefined): string | undefined {
	return model ? `${model.provider}/${model.id}` : undefined;
}

function cancellationReason(progress: TurnProgress[]): string {
	const tools = progress.flatMap((turn) => turn.tool_uses);
	if (progress.length === 0) return "Task was cancelled before any work was done.";
	let reason = "Task was cancelled.";
	const completed = tools.filter((tool) => tool.status === "done");
	const active = tools.filter((tool) => tool.status === "in-progress");
	if (completed.length > 0)
		reason += `\n\n## Completed work\n${completed.map((tool) => `- ${tool.tool_name}`).join("\n")}`;
	if (active.length > 0)
		reason += `\n\n## In progress when cancelled\n${active.map((tool) => tool.tool_name).join(", ")}`;
	return reason;
}

export default function taskExtension(pi: ExtensionAPI): void {
	const recordDelegationFailure = installDelegationFailureAccounting(pi, "Task");
	pi.registerTool({
		name: "Task",
		label: "Task",
		description: DESCRIPTION,
		parameters: Type.Object({
			prompt: Type.String({
				description:
					"The task for the agent to perform. Be specific about what needs to done and include any relevant context.",
			}),
			description: Type.String({
				description: "A very short description of the task that can be displayed to the user.",
			}),
		}),
		executionMode: "parallel",

		async execute(toolCallId, params, signal, onUpdate, ctx) {
			if (!params.prompt || typeof params.prompt !== "string") {
				throw new Error("The Task tool requires a 'prompt' argument (string)");
			}

			const progress: TurnProgress[] = [];
			const toolLedger = new Map<string, ToolProgress>();
			let runId: string | undefined;
			let model = modelName(ctx.model);

			const publish = () =>
				onUpdate?.({
					content: [
						{
							type: "text",
							text: progress.at(-1)?.message || `Running ${params.description}…`,
						},
					],
					details: {
						status: "in-progress",
						progress,
						runId,
						model,
					} satisfies TaskDetails,
				});
			const handleUpdate = (update: DelegationUpdate) => {
				runId = update.runId ?? runId;
				model = update.model ?? model;
				const turn = progress[0] ?? { tool_uses: [] };
				if (progress.length === 0) progress.push(turn);
				turn.message = (update.recentOutputLines?.slice(-4).join("\n") || update.recentOutput || turn.message)?.slice(
					-4000,
				);
				for (const [key, tool] of toolLedger) if (tool.status === "in-progress") toolLedger.delete(key);
				const recentTools = (update.recentTools ?? []).slice(-40);
				const completedCount = Math.max(
					recentTools.length,
					(update.toolCount ?? recentTools.length) - (update.currentTool ? 1 : 0),
				);
				const firstRecentIndex = Math.max(0, completedCount - recentTools.length);
				for (const [index, tool] of recentTools.entries()) {
					const id = `${runId ?? toolCallId}:tool:${firstRecentIndex + index}`;
					toolLedger.set(id, {
						id,
						tool_name: tool.tool,
						status: "done",
						input: tool.args.slice(0, 1000),
					});
				}
				if (update.currentTool) {
					const id = `${runId ?? toolCallId}:active:${update.toolCount ?? completedCount}`;
					toolLedger.set(id, {
						id,
						tool_name: update.currentTool,
						status: "in-progress",
						input: update.currentToolArgs?.slice(0, 1000),
					});
				}
				while (toolLedger.size > 50) toolLedger.delete(toolLedger.keys().next().value!);
				turn.tool_uses = [...toolLedger.values()];
				publish();
			};
			const response = await delegate(
				pi,
				{
					agent: TASK_AGENT,
					task: params.prompt,
					context: "fresh",
					cwd: ctx.cwd,
					...(model ? { model } : {}),
					...(ctx.thinkingLevel ? { thinking: ctx.thinkingLevel } : {}),
					timeoutMs: RUN_TIMEOUT_MS,
					artifacts: false,
					result: { kind: "text" },
				},
				{
					ownerRunId: ctx.sessionManager.getSessionId() || toolCallId,
					nodeId: `task-${toolCallId}`,
					signal,
					onStarted: publish,
					onUpdate: handleUpdate,
				},
			);

			runId = response.runId ?? runId;
			model = response.model ?? model;
			for (const tool of progress.flatMap((turn) => turn.tool_uses)) {
				if (tool.status === "in-progress") tool.status = response.status === "completed" ? "done" : "error";
			}

			if (response.status === "completed" && response.result?.kind === "text") {
				const output = await truncateToolOutput(response.result.text, "Task output", "pi-task-");
				return {
					content: [{ type: "text", text: output.text }],
					details: {
						status: "done",
						progress,
						runId,
						model,
						fullOutputPath: output.fullOutputPath,
					} as TaskDetails & { fullOutputPath?: string },
					usage: delegationUsage(response.usage),
				};
			}
			if (response.status === "cancelled") {
				const reason = cancellationReason(progress);
				return {
					content: [{ type: "text", text: reason }],
					details: {
						status: "cancelled",
						reason,
						progress,
						runId,
						model,
					} satisfies TaskDetails,
					usage: delegationUsage(response.usage),
				};
			}

			const failure = await truncateToolOutput(
				(response.result?.kind === "text" ? response.result.text : response.error) ||
					`Subagent ended with status: ${response.status}`,
				"Task failure",
				"pi-task-",
			);
			recordDelegationFailure(toolCallId, response.usage, {
				status: "error",
				runId,
				fullOutputPath: failure.fullOutputPath,
			});
			throw new Error(`Subagent error: ${failure.text}`);
		},
	});
}
