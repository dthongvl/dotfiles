import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { registerDelegatedTool } from "../lib/delegated-tool.ts";
import herdrSubagentExtension from "../vendor/pi-subagent/index.ts";

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
  herdrSubagentExtension(pi);
  registerDelegatedTool(pi, {
    name: "finder",
    label: "Finder",
    description,
    agent: "dthongvl.finder",
    backend: "herdr",
    defaultModel: "openai-codex/gpt-5.6-terra",
    defaultThinking: "low",
    timeoutMs: 10 * 60_000,
    parameters: Type.Object(
      {
        query: Type.String({
          description:
            "The search query describing what the agent should find. Be specific; include concrete artifacts, patterns, scope, and success criteria",
          minLength: 1,
        }),
        title: Type.Optional(Type.String({
          description: "Short job title for the pane label, e.g. JWT authentication. Omit the Finder prefix.",
          minLength: 1,
          maxLength: 55,
        })),
      },
      { additionalProperties: false },
    ),
    buildPrompt: (params) => ({
      prompt: params.query.trim(),
      runName: params.title?.trim() ? `Finder · ${params.title.trim()}` : "Finder",
    }),
  });
}
