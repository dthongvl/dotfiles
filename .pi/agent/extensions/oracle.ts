import { resolve } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
	delegate,
	delegationUsage,
	installDelegationFailureAccounting,
	truncateToolOutput,
} from "../lib/delegation.ts";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";

const AGENT = "dthongvl.oracle";
const MODEL = "openai-codex/gpt-5.6-sol";
const THINKING = "xhigh";
const RUN_TIMEOUT_MS = 30 * 60 * 1000;

const description = `Consult the oracle - an AI advisor powered by OpenAI Codex's GPT-5.6 Sol model with extra-high reasoning effort that can plan, review, and provide expert guidance.

The oracle has read-only access to relevant Pi tools for local code inspection, saved-thread reading, and web research.

Consult the oracle for:
- Code reviews and architecture feedback
- Difficult bugs in code paths spanning multiple files
- Planning complex implementations or refactors
- Complex technical questions requiring deep reasoning
- A second opinion when the current approach is uncertain

Do not consult the oracle for:
- Simple file reads or exact keyword searches
- Routine web lookups
- Basic code modifications or executing an already-agreed plan

Usage guidelines:
- Ask for a specific judgment, review, plan, or debugging analysis
- Include relevant context and what has already been tried
- Pass known relevant files so the oracle is instructed to read them first
- Treat the response as advisory and reconcile it with your own code reading before acting`;

function buildTask(task: string, context: string | undefined, files: string[], parentThreadID?: string): string {
	const sections: string[] = [];
	if (context?.trim()) sections.push(`Context: ${context.trim()}`);
	sections.push(`Task: ${task.trim()}`);
	if (files.length > 0) sections.push(`Relevant files:\n\n${files.map((file) => `- ${file}`).join("\n")}`);
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
		promptSnippet:
			"Consult a read-only GPT-5.6 Sol advisor for architecture, reviews, planning, and difficult debugging",
		promptGuidelines: [
			"Use oracle for architecture decisions, complex plans, difficult cross-file debugging, important code reviews, or a genuinely useful second opinion.",
			"Pass oracle a specific task, useful context, and every known relevant file; treat its result as advisory rather than delegating implementation ownership.",
			"Oracle automatically receives the invoking parent session ID. When a different prior Pi conversation matters, include its session ID or JSONL path and say exactly what oracle should extract with read_thread.",
		],
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
						"The task or question you want the oracle to help with. Be specific about the guidance, review, planning, or debugging judgment you need.",
					minLength: 1,
				}),
				context: Type.Optional(
					Type.String({
						description:
							"Optional context about the current situation, what you have tried, or background that would help the oracle provide better guidance.",
					}),
				),
				files: Type.Optional(
					Type.Array(Type.String(), {
						description:
							"Optional list of specific text or image file paths the oracle should examine. Relative paths are resolved from the current working directory and requested as the subagent's initial reads.",
					}),
				),
			},
			{ additionalProperties: false },
		),

		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const files = (params.files ?? []).map((file) => resolve(ctx.cwd, file.replace(/^@/, "")));
			const parentThreadID = ctx.sessionManager.getSessionFile() ? ctx.sessionManager.getSessionId() : undefined;
			const response = await delegate(
				pi,
				{
					agent: AGENT,
					task: buildTask(params.task, params.context, files, parentThreadID),
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
							content: [{ type: "text", text: "Oracle is consulting the codebase..." }],
							details: {
								status: "in-progress",
								model: MODEL,
								thinking: THINKING,
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
								model: update.model ?? MODEL,
								thinking: THINKING,
							},
						}),
				},
			);
			if (response.status !== "completed" || response.result?.kind !== "text") {
				const failure = await truncateToolOutput(
					(response.result?.kind === "text" ? response.result.text : response.error) ?? "No text result",
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
					model: response.model ?? MODEL,
					thinking: THINKING,
					files,
					fullOutputPath: output.fullOutputPath,
				},
				usage: delegationUsage(response.usage),
			};
		},
	});
}
