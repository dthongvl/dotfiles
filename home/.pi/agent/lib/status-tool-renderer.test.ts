import assert from "node:assert/strict";
import { test } from "node:test";
import { Type } from "typebox";
import type { Theme, ToolRenderContext } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { statusToolRenderers } from "./status-tool-renderer.ts";

test("status headings use the host's configured expand shortcut for calls and results", () => {
  const schema = Type.Object({ path: Type.String() });
  const renderers = statusToolRenderers<typeof schema, { status: string }>({
    active: "Viewing media",
    complete: "Media viewed",
    failed: "Media viewing failed",
    cancelled: "Media viewing cancelled",
  });
  const theme = {
    fg: (_color: string, text: string) => text,
    bold: (text: string) => text,
  } as Theme;
  const context = {
    args: { path: "/tmp/example.png" },
    state: {},
    expanded: false,
    keyText(keybinding) {
      assert.equal(keybinding, "app.tools.expand");
      return "ctrl+y";
    },
  } as ToolRenderContext<{ header?: Text }, { path: string }>;

  const heading = renderers.renderCall!(context.args, theme, context);
  assert.equal(heading.render(100).join("\n").trimEnd(), "Viewing media (ctrl+y to expand)");

  renderers.renderResult!(
    { content: [{ type: "text", text: "Analysis" }], details: { status: "done" } },
    { expanded: false, isPartial: false },
    theme,
    context,
  );
  assert.equal(heading.render(100).join("\n").trimEnd(), "Media viewed (ctrl+y to expand)");

  context.expanded = true;
  const expanded = renderers.renderCall!(context.args, theme, context).render(100).join("\n");
  assert.ok(expanded.includes("path: /tmp/example.png"));
  assert.ok(!expanded.includes("to expand"));
});
