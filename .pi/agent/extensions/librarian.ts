import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
	delegate,
	delegationUsage,
	installDelegationFailureAccounting,
	truncateToolOutput,
} from "../lib/delegation.ts";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";

const AGENT = "dthongvl.librarian";
const MODEL = "openai-codex/gpt-5.6-sol";
const THINKING = "off";
const RUN_TIMEOUT_MS = 30 * 60 * 1000;

const description = `The Librarian is a codebase-understanding subagent for remote repositories outside the local workspace.

It uses reusable local checkouts to inspect GitHub and GitLab repositories that are public or accessible through the user's existing Git credentials.

Use this when you need deep understanding of existing code across one or more repositories:
- explaining architecture, flows, or subsystem design
- finding where a feature is implemented in an external codebase
- comparing patterns across repositories
- understanding how code evolved through commit history
- reading or diffing files in a remote repository

Do not use this for:
- local workspace reads or searches
- code modifications or implementations
- simple local lookups when a direct local tool is enough
- questions unrelated to understanding existing repositories

Guidance:
- name the repository or project when you know it
- ask a specific question or describe the feature or codepath you want understood
- include context about what you are trying to achieve
- expect a thorough answer suitable for sharing
- return the answer in full rather than summarizing it`;

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
		promptSnippet: "Research and explain code in remote GitHub or GitLab repositories using reusable local checkouts",
		promptGuidelines: [
			"Use librarian for deep understanding of remote repositories, including architecture, implementation flows, cross-repository comparisons, and commit history.",
			"Do not use librarian for the current local workspace, code modifications, simple lookups, or unrelated questions.",
			"Give librarian a specific repository-focused query and relevant background context; return its answer in full.",
		],
		renderCall(args, theme, context) {
			let output = theme.fg("toolTitle", theme.bold("Librarian"));
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
					description: "Your question about the codebase. Be specific about what you want to understand or explore.",
					minLength: 1,
				}),
				context: Type.Optional(
					Type.String({
						description: "Optional context about what you're trying to achieve or background information.",
					}),
				),
			},
			{ additionalProperties: false },
		),

		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const query = params.query.trim();
			if (!query) throw new Error("Librarian query must not be empty.");

			const response = await delegate(
				pi,
				{
					agent: AGENT,
					task: buildTask(query, params.context),
					context: "fresh",
					cwd: ctx.cwd,
					model: MODEL,
					thinking: THINKING,
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
								model: MODEL,
								thinking: THINKING,
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
								model: update.model ?? MODEL,
								thinking: THINKING,
								query,
							},
						}),
				},
			);
			if (response.status !== "completed" || response.result?.kind !== "text") {
				const failure = await truncateToolOutput(
					(response.result?.kind === "text" ? response.result.text : response.error) ?? "No text result",
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
			const output = await truncateToolOutput(response.result.text, "Librarian output", "pi-librarian-");
			return {
				content: [{ type: "text", text: output.text }],
				details: {
					status: "done",
					runId: response.runId,
					model: response.model ?? MODEL,
					thinking: THINKING,
					query,
					fullOutputPath: output.fullOutputPath,
				},
				usage: delegationUsage(response.usage),
			};
		},
	});
}
