import type { TSchema } from "typebox";
import { keyText, type ToolDefinition } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";

export type ToolStatusLabels = {
  active: string;
  complete: string;
  failed: string;
  cancelled: string;
  attention?: string;
};

type StatusRenderState = {
  header?: Text;
};

function formatInput(args: unknown): string {
  return Object.entries(args as Record<string, unknown>)
    .map(([key, value]) =>
      `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`,
    )
    .join("\n");
}

/** Keep status in the heading; reserve inputs and output for the expanded view. */
export function statusToolRenderers<T extends TSchema, D extends { status?: string }>(
  labels: ToolStatusLabels,
): Pick<ToolDefinition<T, D, StatusRenderState>, "renderCall" | "renderResult"> {
  return {
    renderCall(args, theme, context) {
      const header = new Text("", 0, 0);
      let text = theme.fg("toolTitle", theme.bold(labels.active));
      if (!context.expanded)
        text += theme.fg("dim", ` (${keyText("app.tools.expand")} to expand)`);
      if (context.expanded) {
        const input = formatInput(args);
        text += `\n${theme.fg("muted", "Input:")}\n${theme.fg("toolOutput", input)}`;
      }
      header.setText(text);
      context.state.header = header;
      return header;
    },
    renderResult(result, { expanded, isPartial }, theme, context) {
      const status = result.details?.status;
      const failed = context.isError || result.isError || status === "error";
      const label = isPartial
        ? labels.active
        : failed
          ? labels.failed
          : status === "cancelled"
            ? labels.cancelled
            : status === "attention"
              ? (labels.attention ?? labels.active)
              : labels.complete;
      let text = theme.fg("toolTitle", theme.bold(label));
      if (!expanded)
        text += theme.fg("dim", ` (${keyText("app.tools.expand")} to expand)`);
      if (expanded) {
        const input = formatInput(context.args);
        text += `\n${theme.fg("muted", "Input:")}\n${theme.fg("toolOutput", input)}`;
      }
      // Pi renders call before result. Updating that same Text changes the heading
      // immediately, including the first render of a restored terminal result.
      context.state.header?.setText(text);
      const output = expanded
        ? result.content
            .filter((item) => item.type === "text")
            .map((item) => item.text)
            .join("\n")
        : "";
      return new Text(theme.fg(failed ? "error" : "toolOutput", output), 0, 0);
    },
  };
}
