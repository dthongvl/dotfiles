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

const AGENT = "dthongvl.finder";
const MODEL = "openai-codex/gpt-5.6-terra";
const THINKING = "low";
const RUN_TIMEOUT_MS = 10 * 60 * 1000;

const description = `
Intelligently search your codebase: Use it for complex, multi-step search tasks where you need to find code based on functionality or concepts rather than exact matches. Anytime you want to chain multiple code searches you should use this tool.

It then lists when to use and not use it:

**WHEN TO USE THIS TOOL:**

- You must locate code by behavior or concept
- You need to run multiple searches in sequence
- You must correlate or look for connection between several areas of the codebase
- You must filter broad terms ("config", "logger", "cache") by context
- You need answers to questions such as "Where do we validate JWT authentication headers?" or "Which module handles file-watcher retry logic"

**WHEN NOT TO USE THIS TOOL:**

- When you know the exact file path — use \`bash\` with \`cat\` or \`sed - n\`
- When looking for specific symbols or exact strings — use \`bash\` with \`rg\`
- When you need to create or modify files, or run non-inspection commands

**USAGE GUIDELINES:**

1. Use one Finder call for one cohesive discovery question. Use multiple calls only for distinct, independent questions that are already necessary; do not invent overlapping searches to create parallel work.
2. Formulate your query as a precise engineering request. ✓ "Find every place we build an HTTP error response." ✗ "error handling search"
3. Name concrete artifacts, patterns, or APIs to narrow scope (e.g., "Express middleware", "fs.watch debounce").
4. State explicit success criteria so the agent knows when to stop (e.g., "Return file paths and line numbers for all JWT verification calls").
5. Never issue vague or exploratory commands — be definitive and goal-oriented.
6. Avoid broad root-level filename scans when you can scope to a directory. ✓ "Find watchdog-related files under core and server/src." ✗ "Find files named watchdog anywhere."
7. Prefer scoped \`rg\` searches before falling back to repo-wide filename scans.
`;

export default function (pi: ExtensionAPI) {
  const recordDelegationFailure = installDelegationFailureAccounting(pi, "finder");
  pi.registerTool({
    name: "finder",
    label: "Finder",
    description,
    renderCall(args, theme, context) {
      let output = theme.fg("toolTitle", theme.bold("Finder"));
      if (context.executionStarted && context.isPartial)
        output += ` ${theme.fg("dim", "(running)")}`;
      if (context.expanded) {
        const prompt = args.query?.trim() || "...";
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
      return new Text(theme.fg("success", "Finder has completed"), 0, 0);
    },
    parameters: Type.Object(
      {
        query: Type.String({
          description:
            "The search query describing what the agent should find. Be specific; include concrete artifacts, patterns, scope, and success criteria",
          minLength: 1,
        }),
      },
      { additionalProperties: false },
    ),

    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const query = params.query.trim();
      if (!query) throw new Error("Finder query must not be empty.");
      const { model, thinking } = resolveSubagentModel("finder", ctx.model, {
        defaultModel: MODEL,
        defaultThinking: THINKING,
        cwd: ctx.cwd,
      });

      const response = await delegate(
        pi,
        {
          agent: AGENT,
          task: query,
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
              content: [{ type: "text", text: "Searching codebase..." }],
              details: {
                status: "in-progress",
                model,
                thinking,
                query,
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
                    "Searching codebase..."
                  ).slice(-4000),
                },
              ],
              details: {
                status: "in-progress",
                runId: update.runId,
                model: update.model ?? model,
                thinking,
                query,
              },
            }),
        },
      );
      if (response.status !== "completed" || response.result?.kind !== "text") {
        const failure = await truncateToolOutput(
          (response.result?.kind === "text" ? response.result.text : response.error) ??
          "No text result",
          "Finder failure",
          "pi-finder-",
        );

        recordDelegationFailure(toolCallId, response.usage, {
          status: "error",
          runId: response.runId,
          fullOutputPath: failure.fullOutputPath,
        });

        throw new Error(`Finder failed (${response.status}): ${failure.text}`);
      }
      const output = await truncateToolOutput(response.result.text, "Finder output", "pi-finder-");
      return {
        content: [{ type: "text", text: output.text }],
        details: {
          status: "done",
          runId: response.runId,
          model: response.model ?? model,
          thinking,
          query,
          fullOutputPath: output.fullOutputPath,
        },
        usage: delegationUsage(response.usage),
      };
    },
  });
}
