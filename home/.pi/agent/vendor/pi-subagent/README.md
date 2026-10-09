# Local Herdr subagent backend

Vendored from https://github.com/badlogic/pi-subagent at
`4fc1fe5178d1a2b474794a5ee39e7295844e9d3c` (2026-10-08).
The original README is preserved in `UPSTREAM_README.md`.
This is a local fork, not an installed npm dependency.

## Local changes

- Replace tmux with Herdr sibling panes, preserving caller cwd and focus.
- Track `paneId` and `parentPaneId` instead of a tmux session name.
- Label panes with the run name; restore labels on resume and update them on rename.
- Store runs separately under `~/.pi/agent/herdr-subagents/`.
- Export `spawnSubagent()` for the custom-tool adapter.
- Add repeatable `--extension` and `--system-prompt` spawn options.
- Always load the child bridge explicitly and disable MCP.
- Capture stderr and process exit status for startup diagnostics.
- Stop closes only the owned pane and retains metadata/transcripts.
- `/herdr-subagent` selects and focuses a child in Herdr.
- Parent shutdown suspends children; parent resume relaunches retained sessions idle.
- Suppress idle cache warming in children, not in the parent.
- Do not auto-execute a project-local `pi-test.sh`.

## Herdr specialists

Finder, Librarian, and Oracle use the Herdr backend through
`lib/delegated-tool.ts` and `lib/herdr-delegation.ts`.
Profiles live in `herdr-agents/`, outside the native pi-subagents `agents/`
discovery directory. The adapter reads each profile, retains model overrides from
`subagent-models.json`, and explicitly loads its child extensions and Herdr's
Pi integration. Skills remain enabled. Finder has a 10-minute timeout;
Librarian and Oracle have 30-minute timeouts.
Cursor models additionally load the installed `pi-cursor-sdk` provider.
Oracle loads `lib/read-thread-child.ts` to read saved threads directly without
launching a nested extraction agent.
The specialists retain their existing tools, including bash: read-only behavior
is a prompt convention, not an OS sandbox.

Task and standalone read_thread remain on `npm:pi-subagents`. Task searches
directly instead of delegating to the removed native Finder profile.
No global package/settings replacement is required.
Nested children spawned by this backend remain unsupported.
Fleet, bg_wait, and native supervisor tools do not manage these runs.

Run `/reload` after installing/changing these files. Invoke a specialist normally;
it opens a no-focus sibling pane and the tool waits for the final response.
Completed panes close automatically; metadata and transcripts remain available
to the calling tool and `wait`. CLI `spawn --keep-pane` keeps a pane open for inspection
and follow-ups. Unfinished runs still suspend and resume with the parent.
Finder accepts an optional short `title`, producing a pane label such as
`Finder · JWT authentication`; omitted titles fall back to `Finder`.
Run directories are retained until manually removed.

## CLI

From inside Herdr (`HERDR_ENV=1`):

```sh
node ~/.pi/agent/vendor/pi-subagent/subagent.ts list
node ~/.pi/agent/vendor/pi-subagent/subagent.ts status HANDLE
node ~/.pi/agent/vendor/pi-subagent/subagent.ts send HANDLE 'Follow-up question'
node ~/.pi/agent/vendor/pi-subagent/subagent.ts wait HANDLE --timeout 120
node ~/.pi/agent/vendor/pi-subagent/subagent.ts stop HANDLE
```

No command controls the focused session from outside a Herdr-managed pane.
A launch/stop transport error is not evidence the child never ran: inspect the
reported pane/run directory before retrying. `stop` retains the transcript.

## Validation

```sh
PI_PACKAGE_ROOT="$HOME/.pi/agent/install/releases/1.1.0/node_modules/@earendil-works/pi-coding-agent" \
  node --test ~/.pi/agent/lib/herdr-delegation.test.mjs ~/.pi/agent/lib/delegated-tool.test.mjs
```

The Herdr tests use fake protocol executables and never control real panes.
A live smoke test additionally exercised the actual Finder tool with the
configured Cursor model in Herdr and returned file/line links successfully.
