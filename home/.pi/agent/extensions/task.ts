import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { registerDelegatedTool } from "../lib/delegated-tool.ts";

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

- The child runs in the background with progress in Fleet, while this tool waits and returns its final result. A supervisor request releases the wait so you can answer it
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

export default function (pi: ExtensionAPI) {
  registerDelegatedTool(pi, {
    name: "Task",
    label: "Task",
    statusLabels: {
      active: "Subagent working",
      complete: "Subagent finished",
      failed: "Subagent failed",
      cancelled: "Subagent cancelled",
      attention: "Subagent needs input",
    },
    description: DESCRIPTION,
    agent: "dthongvl.task",
    inheritParentModel: true,
    executionMode: "parallel",
    parameters: Type.Object({
      prompt: Type.String({
        description:
          "The task for the agent to perform. Be specific about what needs to done and include any relevant context.",
      }),
      description: Type.String({
        description:
          "A very short description of the task that can be displayed to the user.",
      }),
    }),
    buildPrompt: (params) => params.prompt.trim(),
  });
}
