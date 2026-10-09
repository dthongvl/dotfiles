import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { registerDelegatedTool } from "../lib/delegated-tool.ts";

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

export default function (pi: ExtensionAPI) {
  registerDelegatedTool(pi, {
    name: "oracle",
    label: "Oracle",
    statusLabels: {
      active: "Consulting the oracle",
      complete: "Oracle has spoken",
      failed: "The oracle did not speak",
      cancelled: "Oracle consultation cancelled",
      attention: "Oracle needs input",
    },
    description,
    agent: "dthongvl.oracle",
    backend: "herdr",
    timeoutMs: 30 * 60_000,
    defaultModel: "openai-codex/gpt-5.6-sol",
    defaultThinking: "xhigh",
    parameters: Type.Object(
      {
        task: Type.String({
          description:
            "The focused review/planning/analysis/debugging task — includes scope, intent, @-mentioned files, outcome needed, and what to ignore",
          minLength: 1,
        }),
        title: Type.Optional(Type.String({
          description: "Short job title for the pane label, e.g. Authentication review. Omit the Oracle prefix.",
          minLength: 1,
          maxLength: 55,
        })),
      },
      { additionalProperties: false },
    ),
    buildPrompt(params, ctx) {
      if (!params.task.trim())
        throw new Error("Oracle task must not be empty.");
      const parentThreadID = ctx.sessionManager.getSessionFile()
        ? ctx.sessionManager.getSessionId()
        : undefined;
      const prompt = [
        `Task: ${params.task.trim()}`,
        parentThreadID
          ? `Parent thread: ${parentThreadID}\nYou can use the read_thread tool with this ID to read the full conversation that invoked you if you need more context.`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");
      return {
        prompt,
        runName: params.title?.trim() ? `Oracle · ${params.title.trim()}` : "Oracle",
      };
    },
  });
}
