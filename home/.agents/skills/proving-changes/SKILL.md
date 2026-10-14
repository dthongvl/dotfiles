---
name: proving-changes
description: "Proves that a fix or feature works end to end and breaks nothing: reproduces the failure on the unchanged code, reruns the same scenario with the change on the real stack, covers a matrix of cases and controls, and reports before and after evidence such as recordings, screenshots, logs, database state, and numbers. Use when the user asks for proof (\"irrefutable proof\", \"prove it\", \"show me it works\"), asks to test a change end to end, asks for before and after numbers or a demo video, or asks whether a change breaks anything."
---

# Proving changes

Proof is evidence that convinces a reviewer who will not read the code that the change does what was claimed and breaks nothing. The reviewer decides whether to ship from the proof alone, so build it for a skeptic: every claim needs an observation that would have come out differently if the claim were false.

Unit tests, type checks, and lint support proof but do not make it. A test that mocks the boundary where the bug lives passes whether or not the bug is fixed. Report them as checks, and never describe a change as verified or tested end to end on their strength alone.

Proof takes as long as it takes. Spend the time to run the real scenario instead of reasoning about why it would pass.

## Workflow

### 1. List the claims and the cases

Write down what must be true for the change to be correct, then the case that shows each claim. Include:

- **The reported scenario**, with the reporter's exact data and conditions: the same message, repository shape, platform, browser, text size, account state, or version.
- **Every surface the change reaches**, such as web, mobile, desktop app, interactive CLI, headless CLI, API, and SDK. Show each state the user can see, including loading, failure, and recovery.
- **A control case**: a nearby situation whose behavior must not change. It proves the change is targeted, for example that a menu item still appears when it should, rather than being deleted.
- **Adjacent features that share the changed code** and could regress.
- **The questions the reviewer will ask next**. Answer them in the proof instead of waiting for them:
  - Does it break anything else?
  - What is the performance cost, before and after?
  - Are resources such as watchers, sockets, sessions, and processes cleaned up?
  - Does it work on every platform the claim names?
  - Does it still work after a restart, a reload, or a reconnect?

When a request names only one of these, such as "show me it works", still cover the others that the change puts at risk.

Write the cases down before you change the code, and do not edit them afterwards to fit what the code does. If a case turns out to be wrong, say so in the report and explain why.

### 2. Reproduce on the unchanged code

Run the failing scenario on the code without the change and capture the failure. Use one script or procedure that you will rerun unchanged for the after run. Stash the change, check out the base commit, or build the old version.

Confirm which code each run executed:

- Restart servers, workers, and clients after switching code. Long-running processes keep serving the old code.
- Check a version string, build hash, log line, or file checksum that differs between the two builds.
- For a refactor or a new test harness, plant a deliberate behavior change and confirm the proof detects it. A harness that cannot detect a planted change proves nothing.

If the failure does not reproduce, an after run proves nothing. Change the environment until it reproduces, for example the same platform, the same timing, or production-shaped data. If it still does not reproduce, say so and lower the claim.

Feature work has no failure to reproduce. Capture the starting state instead, so the after state has something to be compared with.

### 3. Exercise the real path

Drive the change the way a user reaches it. Ranked from strongest to weakest:

1. The deployed product, or a staging copy, used through its real interface
2. The full local stack: real UI, server, background workers, clients, and the real external services or their staging or sandbox versions
3. One real component with its true neighbors, for example the real CLI against a real server
4. Integration tests through a public interface
5. Unit tests and mocks

Use the strongest level the environment allows, and name the level in the report. Calling an internal API, rendering an isolated component story, or injecting a mocked client skips code the user hits. If you must take such a shortcut, name what it skipped.

Production evidence is the strongest when the product allows it: read-only logs and metrics, probes without side effects, the change running in the shadow, or a feature flag enabled only for test accounts. Reading production is the default; changing or deploying to it needs the user's permission. Many products cannot be tested in production, such as installed software and systems that move money. Then get as close as the product allows, for example by replaying recorded traffic or shipping to a beta channel. See the Production section of [reference/techniques.md](reference/techniques.md).

When the change adds a branch, such as a new platform, provider, environment, or error path, run that branch. A passing neighbor does not prove it: Linux runs do not cover new macOS code, and the fallback renderer does not cover the new inline one. If the branch cannot run here, report it as unproven.

When a dependency is out of reach, build a stand-in for that one part and keep the rest of the path real. See [reference/techniques.md](reference/techniques.md).

For packaged software, test the artifact that ships: the built container, bundle, binary, or installed package. A file missing from the package breaks production while every source-tree test passes.

### 4. Apply the change and rerun the same scenario

Rerun the identical procedure on the changed code. Change nothing else between the runs: not the data, not the timing, not the injected delays, not the viewport. When a bug is too fast to see, slow it down the same way in both runs and show that the slowdown took effect in each.

Run the whole matrix from step 1, not only the reported case.

When the outcome varies between runs, as with a feature that calls a language model, run each case many times on both sides and report pass rates instead of a single result.

### 5. Collect independent evidence

Gather more than one kind of evidence per claim, so that each kind covers the others' blind spots:

- **Visual**: screenshots of each state, a recording when hover, clicks, focus, motion, or timing matter, side-by-side before and after images, and frame strips for fast transitions.
- **State**: DOM and accessibility facts, database rows, files and git state on disk, API responses, and process lists.
- **Logs**: timestamped server, client, and worker lines that show the code path taken, correlated across components.
- **Numbers**: counts, latencies, and sizes. For performance, report medians over repeated runs with the same input, and say what was measured and where.

A picture alone can mislead. Back each screenshot with a state fact that confirms what it shows, for example an attribute value, a row count, or a log line. When a tooltip or hover state cannot be captured, cite the underlying attribute instead.

Make demo fixtures realistic. A fixture that prints placeholder labels proves the plumbing, not that users see useful output.

### 6. Check every run before trusting it

Inspect each artifact against the claim it supports, the way a reviewer would. Look at the frames and read the numbers. Discard a run, rerun it, and report the discarded run when any of these happened:

- A process still ran old code.
- State carried over from the before run, such as a selection, cache, or open dialog.
- The capture landed during an animation, a scroll, or a retry timer.
- A setup step failed silently, such as a missing flag, a wrong account, or a disconnected client.
- An error appeared that the claim did not predict.

Treat unexplained differences between runs as findings. Run both sides enough times to tell flakiness that exists on the base from flakiness the change introduced.

### 7. Account for the whole diff

For every removed line, changed comment, touched shared file, configuration edit, and secret, either show that it is required or remove it. A refactor needs evidence that behavior is identical, not only that tests pass.

Read the diff of every test file. Look for deleted, skipped, or loosened assertions, expected values changed to match the new output, and code that special-cases test inputs. Each one needs a reason in the report. When a subagent made changes, check its claims against the diff, not its report.

Afterwards, delete what the proof created in shared systems: test accounts, organizations, sandboxes, branches, and rows in staging services.

## Proof techniques

When the real path is blocked, build the missing piece instead of falling back to a unit test. When a few hand-checked cases are not enough, use a stronger technique. [reference/techniques.md](reference/techniques.md) covers:

- Reaching a blocked path:
  - Fakes of external services, and checking a fake against the real service
  - Forcing failures and timing: hangs, crashes, dropped requests, and fake clocks
  - Recreating environments, second machines, mixed versions, and production-shaped data
- Using production: read-only evidence, side-effect-free probes, shadow runs, and flags, and what to do when production is out of reach
- Strengthening the proof:
  - Oracles and differential testing: comparing against a reference over many generated inputs
  - Invariants checked under injected faults, with replayable seeds
  - Pass rates for nondeterministic behavior
  - Simulated and adversarial users driven by agents
  - Observing state the user cannot see: processes, resources, network traffic, and terminal output

To prove a change to agent instructions, such as a system prompt, AGENTS.md, a skill, or a tool description, follow [reference/agent-instructions.md](reference/agent-instructions.md).

## When validation tooling is missing

If the proof needs setup the repository lacks, build it as reusable tooling instead of one-off test code, so that the next proof can run on demand. For example:

- A dev server whose logs from every component are easy to read and search
- One command that starts the app and its dependencies end to end
- A seeded test account with a signed-in browser session
- A local fake of an external service
- Fixtures and seed commands that recreate common repository, data, and edge-case states
- A headless command-line entry point to the core logic, so that agents can drive it without a UI
- Screen state encoded in the URL, so that a link reproduces exactly what a user saw
- A development mode that writes outbound email, SMS messages, and one-time codes to the logs
- A command that copies real data one way into isolated state for testing
- Read-only, scoped production access to logs, metrics, and traces, and safe probes such as rolled-back transactions

Put it where the repository keeps similar tooling, such as its scripts, setup files, or agent guidance, and name it in the report so that the user can decide whether to keep it. Do not commit one-off proof scripts or extra tests only to leave a record of the proof. The report and its artifacts are the record.

## Evidence by kind of change

- **Visual or layout bug**: Before and after screenshots of the same state; measured positions or sizes; every affected size, theme, and input method
- **Interaction or flow**: A recording of the real flow with a real moving pointer that also passes over neighboring elements; state facts after each step; the state after a reload
- **Race, crash, or timing bug**: Failure reproduced with the timing forced; logs showing the bad interleaving before and its absence after; a test that fails when the fix is reverted
- **Distributed or backend behavior**: Timestamped logs across components; database and API state before and after; the failure and recovery paths
- **Performance**: Median before and after over repeated runs with the same input; profiles showing where the time went
- **Refactor**: Identical recorded behavior before and after across a matrix of inputs; a planted change that the comparison detects
- **Security or access**: The denied case denied and the allowed case allowed, against the real identity provider or its staging version; no collateral revocations
- **Nondeterministic feature, such as one that calls a model**: Pass rates over repeated runs of each case, before and after
- **Agent instructions (prompts, AGENTS.md, skills, tool descriptions)**: Pass rates of fresh agents on realistic requests, old text against new, with a negative control; see [reference/agent-instructions.md](reference/agent-instructions.md)
- **Delivery ("is it live?")**: The deployed version contains the commit; production logs or metrics show the new path running

## Reporting the proof

Lead with one sentence that states what was proven and at what level, for example "Verified end to end on the local stack with a real runner; not yet deployed." Then:

- One list item per case, with its before, after, and expected results. Use lists, not tables, which are hard to read.
- Screenshots and recordings embedded inline, each labeled with the state it shows.
- The decisive facts: log lines, state values, and numbers.
- What went wrong during the proof and how you resolved it, including invalid runs and corrected claims.
- What is not proven, and why, for example an untested platform, production timing, or a skipped surface.
- Where the artifacts and repro scripts are, so that a reviewer can rerun the proof.

Build the report from commands you actually ran and the output they captured. Never retype output or edit it by hand. Keep one script that reruns the decisive cases, so that the reviewer can check that the report still matches reality.

Keep the claim no larger than the evidence. When a gap remains, call the proof strong rather than irrefutable and name the gap. When asked whether you are sure, give your actual confidence and what would raise it. An honest "no, and here is what I did not test" is more useful than an overclaim.

Distinguish fixed from not yet exercised. Silence in production logs means the case did not occur unless you show that it occurred and was handled.

## Common ways proof fails

- The end-to-end test called an internal API, so it passed while the user-facing UI never sent the new value.
- A unit test mocked the dependency whose real behavior was the bug, so the fix silently did nothing in production.
- The before run used a stale server process, so its log contradicted the code under test.
- The bug reproduced only in one runtime, such as a native app web view, so passing runs in another browser proved nothing.
- The fix removed intentional code. It looked like the culprit, and only a question about the removed comment revealed that it was not.
- A packaging step omitted a new file, so the deployed service would have crashed at startup.
- A demo showed placeholder output, so it proved streaming but not the feature.
- The proof ran the existing Linux path while the new code handled macOS, so the new branch never executed.
- An existing test's expected value was changed to match the new output, so the suite passed while the change broke the behavior it guarded.
