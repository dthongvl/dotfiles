---
name: herdr-subagent
description: "Control subagents created by the local Herdr backend: inspect their state, focus their panes, send follow-ups, wait for results, or stop them. Use for Herdr-backed run handles, not native Fleet runs."
---

# Herdr subagents

Run these commands only inside Herdr (`HERDR_ENV=1`).
The CLI is `node ~/.pi/agent/vendor/pi-subagent/subagent.ts`.

- `list`: list retained runs owned by the current session, when `PI_SESSION_ID` is set.
- `status HANDLE`: inspect state and find the pane ID.
- `send HANDLE 'message'`: prompt an idle child or steer a working child.
- `send HANDLE --follow-up 'message'`: queue a follow-up instead of steering.
- `wait HANDLE --timeout SECONDS`: wait for final text; timeout leaves the child running.
- `stop HANDLE`: close that child pane, retaining metadata and transcript.

Use `/herdr-subagent` in the parent Pi session to select and focus a child.
Do not use native Fleet, bg_wait, or supervisor controls for these handles.
A timeout or transport failure does not prove work stopped; inspect status
before starting a replacement. Nested Herdr subagents are disabled.

Spawning uses `spawn --provider PROVIDER --model MODEL --thinking LEVEL
--cwd DIRECTORY --prompt 'task'`. Add `--no-extensions` and explicit
`--extension PATH` entries for isolation, `--system-prompt TEXT` for a
specialist prompt, and `--tools NAMES` for an allowlist. MCP is disabled.
Without an allowlist, the child has Pi's normal default tools; bash can write
files, so including it is not a read-only sandbox.
