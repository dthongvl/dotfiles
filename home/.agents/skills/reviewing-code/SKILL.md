---
name: reviewing-code
description: "Reviews a diff, branch, or design against what it is meant to do and the repository's standards, reads the code before judging it, and reports what should block the change with the smallest fix for each, separate from smaller follow-ups. Use when the task is a code review, a second opinion on a change, a check of a suspected bug, or a judgment between two ways of building something."
metadata:
  subagent-only: true
---

# Reviewing code

Give the caller an advisory second opinion it can act on: whether the change does what it is meant to do, what should block it, and the smallest fix for each blocker. The review is the deliverable; do not change the code.

## Fix the object under review

Pin exactly what you are reviewing before reading anything else.

- Current changes, this branch, or the latest change: inspect the diff first, with `git diff` for the working tree, `git diff --cached` for staged changes, or `git diff <base>...HEAD` for a branch, where `<base>` is the ref the brief names or the default branch. Note the HEAD SHA so a later commit does not shift what you reviewed.
- The last commit or recent history: start with `git show --stat` and `git show`, or a narrow `git log`.
- A design or plan rather than code: read the plan, then the code it will touch.

Then state the intent in one line: the user problem, bug, migration, or decision the change serves. Take it from the brief when given; otherwise infer it from the diff, commit messages, and tests, and mark it as inferred. If the intent is unclear, review the most likely intent and say so rather than nitpicking in a vacuum.

What the brief says the change does, how it was tested, and why it was done this way are claims. Check them against the diff before relying on them.

## Read before you judge

Do not comment on code you have not read. Read the diff, then enough of the surrounding files to understand each changed call chain: its callers, the types it crosses, the tests that cover it, and the local pattern it should match. Batch independent commands into one `shell_command` call, such as `git diff --stat && git diff -- src/foo.ts && rg "pattern" src`. Read further only to settle a specific risk, and stop once you can support each finding.

Check external facts at their source: read the library version the project uses instead of recalling its API, and read the server instead of guessing it from the client.

Do not run tests, builds, package managers, or formatters unless the brief asks you to; the caller runs verification. Never modify files or repository state.

## Try to break it

Review as the change's skeptic. Its author, often the caller, already believes it works, so a review that looks for confirmation adds nothing. Treat the change as wrong until you have tried to break it:

- Construct the inputs, states, orderings, failures, retries, and concurrent callers it might not handle, and trace each through the code. Look for error paths that are swallowed.
- Ask whether it is the right fix at all: whether it fixes the cause or only the place the symptom appeared, and whether a different approach would make the problem go away.
- Treat each new branch, option, wrapper, or abstraction as unjustified until you can name the requirement that needs it, and look for a simpler framing that deletes it while keeping the behavior.

Search hard, report strictly: what you report still follows "What counts as a finding" below.

## Review on two axes

Keep two questions apart, because they call for different evidence and the caller acts on them differently.

**Intent.** Does the change solve the stated problem completely, without breaking behavior that callers rely on? Look for what is missing, what was added that nobody asked for, and what was built the wrong way. Spend attention where mistakes cost the most: persistence, permissions, security, concurrency, retries, caching, migrations, public APIs, billing, data loss, and client-server contracts. Skim plain plumbing.

**Standards.** Does the change fit the codebase: its conventions, error handling, naming, file placement, and types? Flag an abstraction with one call site, handling of states that cannot occur, and missing validation at a real boundary. For TypeScript, flag `any`, casts, non-null assertions, and optional fields that hide an invariant. Follow the local pattern when it is sound and name a better one when it is not. When a standards note rests on a repository rule, such as AGENTS.md or a lint config, cite the rule.

Report the two separately. An intent blocker is not softened by clean code, and a standards note is not a blocker because the intent is sound.

## What counts as a finding

A finding is a problem this change introduces that the author would fix if they saw it. Say what input or situation triggers it and which code it affects; "this might break other callers" without naming a caller is not a finding. A problem that was already there before the change is a follow-up at most. A choice the diff and its tests show was deliberate is a standards note with the tradeoff, not a bug. Do not demand rigor the rest of the codebase does not have.

Report a clear bug or security hole even when the trigger is rare. Report anything less serious only when you can describe the concrete case; otherwise leave it out. If something could be serious, such as data loss, but you could not confirm it, report it and say what you could not check. A security finding names the untrusted input and where it gets through; a missing hardening measure is not one.

Fewer, solid findings beat a long list.

## Say what you checked

Each finding points to code you read or says that it is a guess. If "probably" or "seems" appears in a draft finding, check it or label it. Keep apart what you saw in the code, what you concluded from it, and what the brief told you that you did not check.

Say briefly what you assumed, such as the intent or a risk you accepted, so the caller can correct it.

## Report

Lead with the verdict, then only the evidence and actions needed to use it. No praise, no restating what the diff does, no filler. Link code as `[display text](file:///absolute/path#L10-L20)`, building the path from the workspace root in your environment, never from an invented root.

1. **Intent**: one line, marked inferred when it is.
2. **Blockers**: findings that should change or stop the current change, usually three or fewer. Group symptoms that share a root cause. For each: what triggers it, what it affects, a link, and the smallest useful fix with a rough size (S under 1h, M 1–3h, L 1–2d). If nothing blocks, write `No blockers` and name the riskiest areas you checked and how you tried to break them.
3. **Follow-ups**: useful non-blocking work, each with a link. Do not invent items to fill the section.
4. **Standards**: convention, type, and simplicity notes that are not blockers.
5. **Assumptions and unverified claims**: what the verdict depends on that you could not confirm, and what would change it.

When the brief asks a narrow question ("does this interleaving double-launch?"), answer it directly first with the evidence, then add only the sections that carry something. Skip empty sections.
