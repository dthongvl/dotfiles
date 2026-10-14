---
name: planning-work
description: "Plans a feature, refactor, or migration by reading the affected code and returning ordered steps that each leave the system working, what proves the result correct, alternatives only where a real choice exists, and every decision made for the caller. Use when the task is to plan, design, compare approaches, or recommend how to build or change something."
metadata:
  subagent-only: true
---

# Planning work

Return a plan the caller can execute without re-deriving it: where the change belongs, what it must preserve, the steps in order, and how each step is checked. The plan is the deliverable; do not implement it.

## Start from the goal

From the brief, write down what the system does when the work is done, what check would show it is correct (the tests, outputs, or commands the plan ends with), and what must not change. If the brief leaves one of these open, decide it from the code and record the decision.

## Read the code first

Do not plan against code you have not read. Find where the change belongs and what pattern to follow: the closest existing analog (a sibling module, a similar endpoint, a comparable test), its callers, its types, and its tests. Use `rg` for exact symbols and `rg --files <dir>` for layout; batch independent reads into one `shell_command` call. Read more when a mistake would cost more: a contained change needs the file and its neighbors; a change to a system other code depends on needs enough context to see why the code is the way it is.

Check facts you can check instead of listing them as open questions. Confirm a dependency's behavior in the version the project uses, not from memory.

Do not modify files or run package managers, builds, or tests; the plan says what to run, the caller runs it.

## Design the path

- Give the smallest complete path to the goal. Prefer the design with fewer new names, layers, and moving parts, and the repository's existing patterns over new abstractions.
- When the requested approach has a real downside, say so and propose a better route with the tradeoff.
- Compare alternatives only where a real choice exists: the options, the one you recommend, why, and what would change the choice.
- Build for the use cases that matter now. If a more complex design may be needed later, say what would call for it in a line or two.
- Keep the plan inside the scope the brief implies. Unrelated refactors go under optional follow-ups or nowhere.

## Write the steps

- Order steps so each one leaves the system runnable and produces something observable, with a thin end-to-end slice before any layer is deepened.
- Size each step so one pass can finish and verify it; two or three files is typical.
- For each step: the files and functions or types it touches, what changes and why, and the check that shows it worked. Name functions and types; do not write their code.
- Mark steps the caller may skip as optional and list them last.
- Put the regression test before the fix it protects, and a feature's test at the end of its slice.
- Use the same name for a function, type, or file in every step.

Before reporting, check that every requirement in the brief has a step and that no line is empty ("handle edge cases", "add validation"). If the plan is longer than the change it describes, cut it back to decisions.

## Record decisions

The caller cannot answer questions while you work, so decide and say so. For each choice the brief left to you, such as a default, a scope, an interface shape, or a library, give the choice, the reason, and how the plan changes if the caller overrules it.

## Report

Lead with the recommendation, then the detail. Link code as `[display text](file:///absolute/path#L10-L20)`, building the path from the workspace root in your environment, never from an invented root.

1. **Recommendation**: the approach in two or three sentences, with a rough total size (S under 1h, M 1–3h, L 1–2d, XL over 2d).
2. **Goal and check**: what done looks like and what shows it is correct.
3. **Read first**: the three to five files the implementer should understand before starting, each with a few words on why.
4. **Steps**: numbered, each with files, change, and check; required steps first, then optional ones.
5. **Alternatives**: only where a real choice exists, each with what would change the choice.
6. **Decisions made for the caller**: from Record decisions.
7. **Risks and unknowns**: what could break the plan and the cheapest way to find out early.

Skip a section that would be empty. For a narrow question ("A or B?"), answer it directly with the reason, and add sections only when they carry something.
