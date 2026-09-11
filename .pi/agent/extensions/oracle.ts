import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  delegate,
  delegationUsage,
  installDelegationFailureAccounting,
  truncateToolOutput,
} from "../lib/delegation.ts";
import { resolveSubagentModel } from "../lib/subagent-model.ts";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";

const AGENT = "dthongvl.oracle";
const MODEL = "openai-codex/gpt-5.6-sol";
const THINKING = "xhigh";
const RUN_TIMEOUT_MS = 30 * 60 * 1000;

const description = `
Consult the oracle - a read-only expert advisor powered by a stronger reasoning model for user-requested reviews and unresolved, high-impact judgment calls.

It then details when to use it and how to write the task:

**Use when:**

- **When the user explicitly asks for the oracle**, use it for the requested task, including general or final code review. Preserve the requested scope; do not substitute another reviewer or require an unresolved question first.
- **Without an explicit request**, do your own review, planning, and debugging first. Consult the oracle only when that work leaves a specific question whose answer would materially change a high-impact decision:
  - Choosing between multiple plausible alternatives when the tradeoff remains unresolved
  - Checking a concrete suspected invariant violation or failure sequence that you could not settle
  - Debugging a difficult cross-file failure after direct investigation and focused attempts have not resolved it

**Without an explicit request, do NOT consult the oracle for:**

- Routine self-review, general reassurance, or a second pair of eyes
- Asking whether completed work is correct, safe to test, or ready to ship
- Broad requests to find anything you may have missed; identify and investigate a concrete concern yourself
- Work that is merely complex, cross-file, security-sensitive, or high impact without an unresolved question
- Codebase searches (use finder)
- Basic code modifications and when you need to execute code changes (do it yourself or use Task)

**How to write the task well:**

- For a user-requested review, state the requested diff or scope and the intended behavior
- For an unsolicited consultation, state the unresolved question, what you already checked, and why the answer changes the decision
- Keep it focused on the requested review, decision, invariant, or debugging question
- Include the necessary context directly in the task
- @-mention the most relevant files inline, for example \`@src/auth/index.ts\`
- If asking about current changes, say so explicitly; the oracle should inspect them with \`git diff\`
- State the decision or outcome you need, the intended behavior, and the constraints or product choices already settled
- For a code review, tell it the intended behavior so it can review intent first and implementation second
- For a follow-up review, name the prior finding and the exact change that should resolve it
- Tell the oracle what to ignore when scope creep would make the answer less useful
`;

function buildTask(task: string, parentThreadID?: string): string {
  const sections: string[] = [];
  sections.push(`Task: ${task.trim()}`);
  if (parentThreadID)
    sections.push(
      `Parent thread: ${parentThreadID}\nYou can use the read_thread tool with this ID to read the full conversation that invoked you if you need more context.`,
    );
  return sections.join("\n\n");
}

export default function (pi: ExtensionAPI) {
  const recordDelegationFailure = installDelegationFailureAccounting(pi, "oracle");
  pi.registerTool({
    name: "oracle",
    label: "Oracle",
    description,
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
    parameters: Type.Object(
      {
        task: Type.String({
          description:
            "The focused review/planning/analysis/debugging task — includes scope, intent, @-mentioned files, outcome needed, and what to ignore",
          minLength: 1,
        }),
      },
      { additionalProperties: false },
    ),

    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const parentThreadID = ctx.sessionManager.getSessionFile()
        ? ctx.sessionManager.getSessionId()
        : undefined;
      const { model, thinking } = resolveSubagentModel("oracle", ctx.model, {
        defaultModel: MODEL,
        defaultThinking: THINKING,
        cwd: ctx.cwd,
      });
      const response = await delegate(
        pi,
        {
          agent: AGENT,
          task: buildTask(params.task, parentThreadID),
          context: "fresh",
          cwd: ctx.cwd,
          model,
          thinking,
          timeoutMs: RUN_TIMEOUT_MS,
          artifacts: false,
          result: { kind: "text" },
        },
        {
          ownerRunId: ctx.sessionManager.getSessionId() || toolCallId,
          signal,
          onStarted: () =>
            onUpdate?.({
              content: [{ type: "text", text: "Oracle is consulting the codebase..." }],
              details: {
                status: "in-progress",
                model,
                thinking,
              },
            }),
          onUpdate: (update) =>
            onUpdate?.({
              content: [
                {
                  type: "text",
                  text: (
                    update.recentOutputLines?.slice(-4).join("\n") ||
                    update.recentOutput ||
                    "Oracle is consulting the codebase..."
                  ).slice(-4000),
                },
              ],
              details: {
                status: "in-progress",
                runId: update.runId,
                model: update.model ?? model,
                thinking,
              },
            }),
        },
      );
      if (response.status !== "completed" || response.result?.kind !== "text") {
        const failure = await truncateToolOutput(
          (response.result?.kind === "text" ? response.result.text : response.error) ??
          "No text result",
          "Oracle failure",
          "pi-oracle-",
        );

        recordDelegationFailure(toolCallId, response.usage, {
          status: "error",
          runId: response.runId,
          fullOutputPath: failure.fullOutputPath,
        });

        throw new Error(`Oracle failed (${response.status}): ${failure.text}`);
      }
      const output = await truncateToolOutput(response.result.text, "Oracle output", "pi-oracle-");
      return {
        content: [{ type: "text", text: output.text }],
        details: {
          status: "done",
          runId: response.runId,
          model: response.model ?? model,
          thinking,
          fullOutputPath: output.fullOutputPath,
        },
        usage: delegationUsage(response.usage),
      };
    },
  });
}
