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

const AGENT = "dthongvl.librarian";
const MODEL = "openai-codex/gpt-5.6-sol";
const THINKING = "off";
const RUN_TIMEOUT_MS = 30 * 60 * 1000;

const description = `
The Librarian is a codebase-understanding subagent for repositories outside the local workspace.

It can read public GitHub repositories and connected private GitHub repositories.

**Use this when you need deep understanding of existing code across one or more repositories:**

- explaining architecture, flows, or subsystem design
- finding where a feature is implemented in an external codebase
- comparing patterns across repositories
- understanding how code evolved through commit history
- reading or diffing files in a remote repository
- reading a repository's GitHub issues: listing or filtering them, or reading one issue's description and comment thread
- describing a dependency or external system's internals when its authoritative source lives outside the workspace, even if a partial copy (vendored package, \`node_modules\`, or the client half of a client/server system) exists locally, since that copy is not the source of the layer you are describing

**Do not use this for:**

- local workspace reads or searches of first-party code you can fully read
- code modifications or implementations
- simple local lookups answerable with a direct local tool
- questions unrelated to understanding existing repositories

**Guidance:**

- name the repository or project when you know it
- ask a specific question or describe the feature or codepath you want understood
- include context about what you're trying to achieve or background information
- expect a thorough answer suitable for sharing
- return the answer in full rather than summarizing

**Examples:**

- "How does authentication work in the Kubernetes codebase?"
- "Explain the architecture of the React rendering system"
- "Compare how different web frameworks handle routing"
- "What changed in commit \`abc123\` in my private repository?"
- "Read the README from the main API repository"
- "What open issues mention the parser in my repository?"
`;

function buildTask(query: string, context?: string): string {
  if (!context?.trim()) return query.trim();
  return `Context: ${context.trim()}\n\nQuery: ${query.trim()}`;
}

export default function (pi: ExtensionAPI) {
  const recordDelegationFailure = installDelegationFailureAccounting(pi, "librarian");
  pi.registerTool({
    name: "librarian",
    label: "Librarian",
    description,
    renderCall(args, theme, context) {
      let output = theme.fg("toolTitle", theme.bold("Librarian"));
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
      return new Text(theme.fg("success", "Librarian has completed"), 0, 0);
    },
    parameters: Type.Object(
      {
        query: Type.String({
          description:
            "Your question about the codebase. Be specific about what you want understood or explored",
          minLength: 1,
        }),
        context: Type.Optional(
          Type.String({
            description: "Background on what you're trying to achieve",
          }),
        ),
      },
      { additionalProperties: false },
    ),

    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const query = params.query.trim();
      if (!query) throw new Error("Librarian query must not be empty.");
      const { model, thinking } = resolveSubagentModel("librarian", ctx.model, {
        defaultModel: MODEL,
        defaultThinking: THINKING,
        cwd: ctx.cwd,
      });

      const response = await delegate(
        pi,
        {
          agent: AGENT,
          task: buildTask(query, params.context),
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
              content: [
                {
                  type: "text",
                  text: "Librarian is researching remote repositories...",
                },
              ],
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
                    "Librarian is researching remote repositories..."
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
          "Librarian failure",
          "pi-librarian-",
        );

        recordDelegationFailure(toolCallId, response.usage, {
          status: "error",
          runId: response.runId,
          fullOutputPath: failure.fullOutputPath,
        });

        throw new Error(`Librarian failed (${response.status}): ${failure.text}`);
      }
      const output = await truncateToolOutput(
        response.result.text,
        "Librarian output",
        "pi-librarian-",
      );
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
