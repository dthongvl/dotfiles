import type { Static, TSchema } from "typebox";
import type {
  ExtensionAPI,
  ExtensionToolContext,
  ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import {
  delegate,
  delegationUsage,
  truncateToolOutput,
  type DelegationThinking,
  type DelegationUpdate,
} from "./delegation.ts";
import { resolveSubagentModel } from "./subagent-model.ts";
import { waitForAsyncDelegation, SubagentRpcError } from "./subagent-rpc.ts";

export type DelegatedToolDetails = {
  status: "in-progress" | "attention" | "done" | "error" | "cancelled";
  asyncId?: string;
  asyncDir?: string;
  terminalStatus?: string;
  runId?: string;
  model?: string;
  thinking?: DelegationThinking;
  progress?: DelegationUpdate[];
  fullOutputPath?: string;
  [key: string]: unknown;
};

// Direct text is needed by read_thread inside children to avoid recursive delegation.
export type PreparedDelegation =
  | {
      prompt: string;
      details?: Record<string, unknown>;
    }
  | {
      directText: string;
      details?: Record<string, unknown>;
    };

type DelegatedToolOptions<T extends TSchema> = Pick<
  ToolDefinition<T>,
  "name" | "label" | "description" | "parameters" | "executionMode"
> & {
  agent: string;
  modelKey?: string;
  defaultModel?: string;
  defaultThinking?: DelegationThinking;
  inheritParentModel?: boolean;
  timeoutMs?: number;
  /** Run in the native background executor while awaiting completion; false uses foreground execution. */
  async?: boolean;
  callSummary?: (params: Static<T>) => string;
  buildPrompt: (
    params: Static<T>,
    ctx: ExtensionToolContext,
    signal?: AbortSignal,
  ) => string | PreparedDelegation | Promise<string | PreparedDelegation>;
};

function cancellationText(update?: DelegationUpdate): string {
  let text =
    "Delegation was cancelled. Tool previews do not establish which changes completed.";
  if (update?.recentTools?.length)
    text += `\n\n## Recent tool activity (partial snapshot)\n${update.recentTools.map((tool) => `- ${tool.tool}`).join("\n")}`;
  if (update?.currentTool)
    text += `\n\nLast observed active tool: ${update.currentTool}`;
  return text;
}

export function registerDelegatedTool<T extends TSchema>(
  pi: ExtensionAPI,
  options: DelegatedToolOptions<T>,
): void {
  const prefix = `pi-${options.name.toLowerCase().replace(/_/g, "-")}-`;
  pi.registerTool<T, DelegatedToolDetails>({
    name: options.name,
    label: options.label,
    description:
      options.async === false
        ? options.description
        : `${options.description}\n\nExecution: Runs a background subagent visible in Fleet, but this tool waits for completion and returns its final result. If the child needs supervisor input, the tool releases its wait so you can answer the request; that is not completion. Inside a child, read_thread returns the saved conversation directly.`,
    parameters: options.parameters,
    executionMode: options.executionMode,
    renderCall(args, theme, context) {
      let text = theme.fg("toolTitle", theme.bold(options.label));
      if (context.executionStarted && context.isPartial)
        text += ` ${theme.fg("dim", "(running)")}`;
      const summary = options.callSummary?.(args)?.trim();
      if (summary) text += `\n${theme.fg("muted", summary)}`;
      if (context.expanded) {
        const input = Object.entries(args as Record<string, unknown>)
          .map(
            ([key, value]) =>
              `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`,
          )
          .join("\n");
        text += `\n${theme.fg("muted", "Input:")}\n${theme.fg("toolOutput", input)}`;
      }
      return new Text(text, 0, 0);
    },
    renderResult(result, { expanded, isPartial }, theme, context) {
      const output = result.content
        .filter((item) => item.type === "text")
        .map((item) => item.text)
        .join("\n");
      const failed = context.isError || result.isError;
      if (isPartial || failed || expanded)
        return new Text(
          theme.fg(failed ? "error" : "toolOutput", output),
          0,
          0,
        );
      const status = result.details?.status;
      const summary =
        status === "attention"
          ? `${options.label} needs supervisor input — child still active`
          : `${options.label} ${status === "cancelled" ? "was cancelled" : "has completed"}`;
      return new Text(
        theme.fg(
          status === "cancelled" || status === "attention"
            ? "muted"
            : "success",
          summary,
        ),
        0,
        0,
      );
    },
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      let details: DelegatedToolDetails = { status: "in-progress" };
      let usage: ReturnType<typeof delegationUsage>;
      const publish = (text: string) =>
        onUpdate?.({
          content: [{ type: "text", text }],
          details: { ...details },
        });
      try {
        signal?.throwIfAborted();
        publish(`Preparing ${options.label}...`);
        const built = await options.buildPrompt(params, ctx, signal);
        const prepared = typeof built === "string" ? { prompt: built } : built;
        details = { ...prepared.details, status: "in-progress" };
        if (signal?.aborted) {
          return {
            content: [{ type: "text", text: cancellationText() }],
            details: {
              ...details,
              status: "cancelled",
              terminalStatus: "cancelled",
            },
          };
        }
        if ("directText" in prepared) {
          const output = await truncateToolOutput(
            prepared.directText,
            `${options.label} output`,
            prefix,
          );
          return {
            content: [{ type: "text", text: output.text }],
            details: {
              ...details,
              status: "done",
              fullOutputPath: output.fullOutputPath,
            },
          };
        }
        const prompt = prepared.prompt.trim();
        if (!prompt)
          throw new Error(`${options.label} prompt must not be empty.`);
        const parentModel = ctx.model
          ? `${ctx.model.provider}/${ctx.model.id}`
          : undefined;
        const resolved = resolveSubagentModel(
          options.modelKey ?? options.name,
          ctx.model,
          {
            cwd: ctx.cwd,
            defaultModel: options.inheritParentModel
              ? parentModel
              : options.defaultModel,
            defaultThinking: options.inheritParentModel
              ? (ctx.thinkingLevel as DelegationThinking)
              : options.defaultThinking,
          },
        );
        details = { ...details, ...resolved };
        if (options.async !== false) {
          publish(`Launching ${options.label} in background...`);
          const result = await waitForAsyncDelegation(
            pi,
            {
              agent: options.agent,
              task: prompt,
              context: "fresh",
              cwd: ctx.cwd,
              ...(resolved.model ? { model: resolved.model } : {}),
              ...(resolved.thinking ? { thinking: resolved.thinking } : {}),
              timeoutMs: options.timeoutMs ?? 30 * 60_000,
              artifacts: false,
            },
            {
              signal,
              onLaunched: (runId, nativeDetails) => {
                details = { ...nativeDetails, ...details, runId };
                publish(
                  `Waiting for ${options.label} (${runId}) — progress in Fleet...`,
                );
              },
            },
          );
          details = {
            ...result.details,
            ...details,
            runId: result.runId,
            terminalStatus: result.status,
          };
          if (
            result.status !== "completed" &&
            result.status !== "cancelled" &&
            result.status !== "attention"
          ) {
            throw new Error(
              `${options.label} failed (${result.status}): ${result.text}`,
            );
          }
          const output = await truncateToolOutput(
            result.text,
            `${options.label} output`,
            prefix,
          );
          return {
            content: [{ type: "text", text: output.text }],
            details: {
              ...details,
              status:
                result.status === "cancelled"
                  ? "cancelled"
                  : result.status === "attention"
                    ? "attention"
                    : "done",
              fullOutputPath: output.fullOutputPath,
            },
            // pi-subagents owns async child usage and completion delivery.
          };
        }
        const response = await delegate(
          pi,
          {
            agent: options.agent,
            task: prompt,
            context: "fresh",
            cwd: ctx.cwd,
            ...(resolved.model ? { model: resolved.model } : {}),
            ...(resolved.thinking ? { thinking: resolved.thinking } : {}),
            timeoutMs: options.timeoutMs ?? 30 * 60_000,
            artifacts: false,
            result: { kind: "text" },
          },
          {
            ownerRunId: ctx.sessionManager.getSessionId() || toolCallId,
            nodeId: `${options.name}-${toolCallId}`,
            signal,
            onStarted: () => publish(`Running ${options.label}...`),
            onUpdate: (update) => {
              details = {
                ...details,
                runId: update.runId ?? details.runId,
                model: update.model ?? details.model,
                progress: [update],
              };
              publish(
                (
                  update.recentOutput ||
                  update.recentOutputLines?.slice(-4).join("\n") ||
                  `Running ${options.label}...`
                ).slice(-4000),
              );
            },
          },
        );
        usage = delegationUsage(response.usage);
        details = {
          ...details,
          runId: response.runId ?? details.runId,
          model: response.model ?? details.model,
          terminalStatus: response.status,
        };
        if (response.status === "cancelled") {
          const output = await truncateToolOutput(
            [cancellationText(details.progress?.at(-1)), response.error]
              .filter(Boolean)
              .join("\n\n"),
            `${options.label} cancellation`,
            prefix,
          );
          return {
            content: [{ type: "text", text: output.text }],
            details: {
              ...details,
              status: "cancelled",
              fullOutputPath: output.fullOutputPath,
            },
            usage,
          };
        }
        if (
          response.status !== "completed" ||
          response.result?.kind !== "text"
        ) {
          throw new Error(
            `${options.label} failed (${response.status}): ${(response.result?.kind === "text" ? response.result.text : response.error) ?? "No text result"}`,
          );
        }
        const output = await truncateToolOutput(
          response.result.text,
          `${options.label} output`,
          prefix,
        );
        return {
          content: [{ type: "text", text: output.text }],
          details: {
            ...details,
            status: "done",
            fullOutputPath: output.fullOutputPath,
          },
          usage,
        };
      } catch (error) {
        const cancelled =
          signal?.aborted && !(error instanceof SubagentRpcError);
        if (error instanceof SubagentRpcError) {
          details = {
            ...details,
            rpcRequestId: error.requestId,
            errorCode: error.code,
            launchOutcome: error.launchOutcome,
            runId: error.runId ?? details.runId,
          };
        }
        const message = error instanceof Error ? error.message : String(error);
        const output = await truncateToolOutput(
          cancelled
            ? `${cancellationText(details.progress?.at(-1))}\n\n${message}`
            : message,
          `${options.label} failure`,
          prefix,
        );
        return {
          isError: !cancelled,
          content: [{ type: "text", text: output.text }],
          details: {
            ...details,
            status: cancelled ? "cancelled" : "error",
            fullOutputPath: output.fullOutputPath,
          },
          usage,
        };
      }
    },
  });
}
