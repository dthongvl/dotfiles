import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import {
  delegate,
  delegationUsage,
  installDelegationFailureAccounting,
  truncateToolOutput,
  type DelegationUpdate,
} from "../lib/delegation.ts";
import { resolveSubagentModel } from "../lib/subagent-model.ts";
import type { DelegationThinking } from "../lib/delegation.ts";

const TASK_AGENT = "dthongvl.task";
const RUN_TIMEOUT_MS = 30 * 60 * 1000;

const DESCRIPTION = `
Perform a task (a sub-task of the user's overall task) using a sub-agent.

Do the work yourself by default. Use Task only when delegation has a concrete benefit beyond the task being non-trivial.

**When to use the Task tool:**

- When two or more independently specifiable workstreams can run concurrently without editing the same files or depending on each other's results
- When one bounded unit is massive enough that its intermediate output would crowd the parent context, and you can review its result from a diff or concise evidence
- When the user explicitly asks you to delegate the work to an "agent" or "subagent"; merely working on agent-related features does not count

**When NOT to use the Task tool:**

- When the work is one coherent implementation that you can carry through yourself, even if it is complex, multi-step, cross-package, or touches many files
- When delegation would be a serial handoff with no meaningful parallelism or context-isolation benefit
- For routine review or verification of your own work; inspect the diff and run the checks yourself
- When you're reading a single file, performing an exact text search, or making one localized edit; use your direct tools instead
- When a specialist tool covers the job: finder for codebase search, librarian for code outside the workspace, oracle for a specific unresolved high-impact judgment
- When you're not sure what changes you want to make. Use all tools available to you to determine the changes to make

**How to use the Task tool:**

- You will not see the individual steps of the sub-agent's execution, and you can't communicate with it until it finishes, at which point you will receive a summary of its work
- Delegate a separately owned work unit, not the whole user request merely because you already wrote a plan for it. You remain responsible for integration and the final user-facing result
- Brief the agent like a smart colleague who just walked into the room: it has not seen this conversation. Explain the goal and why it matters, what you have already learned or ruled out, and where to look first. Terse command-style prompts produce shallow, generic work
- Write outcome-first prompts. Include the goal, scope, relevant context, files or evidence to inspect first, constraints and non-goals, validation to run, and the expected return shape
- Never delegate understanding. Don't write "based on your findings, fix it" — do the synthesis yourself and write prompts that prove you understood: include file paths, line numbers, and what specifically to change or check
- Tell the worker whether it is coding, verifying, or researching. Avoid asking one Task subagent to do all of those roles unless the task is small
- The worker's intermediate work is discarded; only its final message returns to you. If your deliverable needs evidence — exact quotes, numbers, URLs, file paths — require it explicitly in the expected output shape. A compact summary is not a substitute for the data you need
- Ask for compact but complete results, not transcripts: the outcome, the evidence you asked for, files changed or inspected, validation result, concerns or blockers, and next action
- Run multiple Task subagents concurrently only for independent work. Prefer parallel Tasks for verification or research that goes beyond search. Keep code-writing single-threaded unless write targets are clearly disjoint or isolated
- When the worker finishes, inspect its diff or evidence, run the relevant combined validation, and summarize the user-relevant result yourself
- When the agent is done, it will return a single message back to you. The result returned by the agent is not visible to the user. To show the user the result, you should send a text message back to the user with a concise summary of the result
`;

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
      const resolved = resolveSubagentModel("task", ctx.model, {
        defaultModel: modelName(ctx.model),
        defaultThinking: ctx.thinkingLevel as DelegationThinking | undefined,
        cwd: ctx.cwd,
      });
      let runId: string | undefined;
      let model = resolved.model;
      let thinking = resolved.thinking;

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
        turn.message = (
          update.recentOutputLines?.slice(-4).join("\n") ||
          update.recentOutput ||
          turn.message
        )?.slice(-4000);
        for (const [key, tool] of toolLedger)
          if (tool.status === "in-progress") toolLedger.delete(key);
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
          ...(thinking ? { thinking } : {}),
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
        if (tool.status === "in-progress")
          tool.status = response.status === "completed" ? "done" : "error";
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
