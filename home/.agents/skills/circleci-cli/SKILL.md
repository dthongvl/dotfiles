---
name: circleci-cli
description: Operate and troubleshoot CircleCI using the CircleCI CLI. Use when users ask to authenticate CLI access, inspect pipeline/workflow/job status, retrieve failure reports, validate configuration locally, rerun pipelines/jobs, trigger pipelines, or gather actionable diagnostics from CLI outputs.
---

# CircleCI CLI

## Overview

Use this skill when the fastest path is CircleCI CLI-driven operations rather than editing config first. Prioritize safe, read-first diagnostics, then run targeted mutating commands only after confirming scope.

## Inputs To Gather

- Repository path and target branch
- CircleCI project slug (if needed)
- Whether objective is inspect, rerun, trigger, or validate
- Required token/auth state and org permissions

## Workflow

1. Verify CLI and auth state.
   - Confirm `circleci` is installed and version is available.
   - Confirm token/auth before issuing remote CircleCI commands.
2. Run read-only diagnostics first.
   - Inspect available pipeline/project/trigger state and capture concrete identifiers.
   - For a completed failed run, retrieve all condensed failure context in one call with `circleci run get --failure-report <run-id>`.
   - Use the report to identify the failing workflow, job, step, exit code, and relevant log excerpt before fetching full logs or rerunning.
3. Validate config locally when relevant.
   - Run config validation/processing commands before committing risky edits.
4. Run targeted mutation commands.
   - Rerun only required workflow/job scope.
   - Trigger pipelines with explicit parameters and branch context.
5. Report results and next action.
   - Provide exact command results, remaining blockers, and safest follow-up.

## Guardrails

- Prefer read-only commands before rerun/trigger/cancel operations.
- Confirm organization/project scope before mutating pipeline state.
- Never print raw secret values from environment variables or tokens.
- If permissions fail, report exact auth/scope gap and safest remediation.
- Respect installed CLI capabilities and avoid inventing commands.
- Do not use `circleci api`, `circleci workflow`, or other unavailable legacy commands unless `circleci help` confirms they exist.

## Failure Reports

Use failure reports as the default first-pass diagnosis for completed failed runs, especially when parallel jobs or multiple steps failed:

```bash
circleci run get --failure-report <run-id>
```

If the run ID is unknown, list failed runs and select the relevant UUID:

```bash
circleci run list --json --jq '.[] | select(.branch == "main" and (.outcome == "failed" or .current_outcome == "failed")) | .id'
```

Adjust the branch and outcome filter as needed. The report groups condensed output by workflow, job, and step and includes exit codes. Use `circleci run get <run-id>` when only one step failed, the run is not a completed failure, or the full uncut log is needed. If the report is empty, confirm status with `circleci run get <run-id>`.

Prerequisites:

- The installed CLI must expose `run get --failure-report`; verify with `circleci run get --help`.
- Authenticate with `circleci auth login` or `CIRCLE_TOKEN` and ensure the account can access the run.

## Installed CLI Compatibility

For newer `circleci` builds that expose domain subcommands (for example `pipeline`, `project`, `trigger`) but not `api`:

- Verify available commands first with `circleci help`.
- Use only discovered subcommands from help output.
- Prefer `circleci pipeline list|create|run` and `circleci trigger ...` for pipeline operations.
- Prefer `circleci run get --failure-report <run-id>` for condensed cloud failure logs when supported.
- For full cloud job logs, use `circleci run get <run-id>` interactively, the CircleCI app/UI, or connected CircleCI MCP tooling.

## Output Contract

Provide:

1. Commands run and purpose.
2. Key outputs (pipeline/workflow/job ids, status, failing step).
3. Actions taken (rerun/trigger/validate) and why.
4. Remaining blockers and next recommended CLI command.
