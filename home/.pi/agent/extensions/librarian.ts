import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { registerDelegatedTool } from "../lib/delegated-tool.ts";

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

export default function (pi: ExtensionAPI) {
  registerDelegatedTool(pi, {
    name: "librarian",
    label: "Librarian",
    description,
    agent: "dthongvl.librarian",
    defaultModel: "openai-codex/gpt-5.6-sol",
    defaultThinking: "off",
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
    buildPrompt(params) {
      if (!params.query.trim())
        throw new Error("Librarian query must not be empty.");
      return params.context?.trim()
        ? `Context: ${params.context.trim()}\n\nQuery: ${params.query.trim()}`
        : params.query.trim();
    },
  });
}
