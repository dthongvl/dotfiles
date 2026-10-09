import type { Static, TSchema } from "typebox";
import type {
  ExtensionAPI,
  ExtensionToolContext,
  ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import { statusToolRenderers, type ToolStatusLabels } from "./status-tool-renderer.ts";
import {
  delegate,
  delegationUsage,
  truncateToolOutput,
  type DelegationThinking,
  type DelegationUpdate,
} from "./delegation.ts";
import { resolveSubagentModel } from "./subagent-model.ts";
import { waitForAsyncDelegation, SubagentRpcError } from "./subagent-rpc.ts";
import { registerHerdrBackend, waitForHerdrDelegation } from "./herdr-delegation.ts";

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
      runName?: string;
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
  backend?: "native" | "herdr";
  modelKey?: string;
  defaultModel?: string;
  defaultThinking?: DelegationThinking;
  inheritParentModel?: boolean;
  timeoutMs?: number;
  /** Run in the native background executor while awaiting completion; false uses foreground execution. */
  async?: boolean;
  statusLabels: ToolStatusLabels;
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
  if (options.backend === "herdr") registerHerdrBackend(pi);
  pi.registerTool<T, DelegatedToolDetails>({
    name: options.name,
    label: options.label,
    description:
      options.backend === "herdr"
        ? `${options.description}\n\nExecution: Runs ${options.label} in a background Herdr pane and waits for its final result. Requires a Herdr-managed parent pane. Cancellation closes the child pane but retains its transcript. Fleet and native supervisor tools do not manage these runs.`
        : options.async === false
        ? options.description
        : `${options.description}\n\nExecution: Runs a background subagent visible in Fleet, but this tool waits for completion and returns its final result. If the child needs supervisor input, the tool releases its wait so you can answer the request; that is not completion. Inside a child, read_thread returns the saved conversation directly.`,
    parameters: options.parameters,
    executionMode: options.executionMode,
    ...statusToolRenderers<T, DelegatedToolDetails>(options.statusLabels),
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
        if (options.backend === "herdr") {
          publish(`Launching ${options.label} in a Herdr pane...`);
          const result = await waitForHerdrDelegation(pi, {
            agent: options.agent,
            task: prompt,
            context: "fresh",
            cwd: ctx.cwd,
            ...resolved,
            timeoutMs: options.timeoutMs,
            artifacts: false,
          }, {
            signal,
            parentSessionId: ctx.sessionManager.getSessionId(),
            parentSessionFile: ctx.sessionManager.getSessionFile(),
            name: prepared.runName,
            onLaunched: (runId, nativeDetails) => {
              details = { ...details, ...nativeDetails, runId };
              publish(`Waiting for ${options.label} in Herdr pane ${nativeDetails.paneId}...`);
            },
          });
          const output = await truncateToolOutput(result.text, `${options.label} output`, prefix);
          return {
            content: [{ type: "text", text: output.text }],
            details: {
              ...details, ...result.details, runId: result.runId,
              terminalStatus: result.status,
              status: result.status === "completed" ? "done" : result.status === "cancelled" ? "cancelled" : "error",
              fullOutputPath: output.fullOutputPath,
            },
            isError: result.status !== "completed" && result.status !== "cancelled",
            usage: result.usage,
          };
        }
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
