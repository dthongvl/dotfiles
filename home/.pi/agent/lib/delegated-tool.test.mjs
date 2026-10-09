import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir, homedir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import { test, after } from "node:test";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";

// Personal extensions resolve Pi modules through the harness, not a root package.json.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(homedir(), ".pi/agent/npm/package.json"));
const { createJiti } = require("jiti");
// Run with PI_PACKAGE_ROOT pointing at the installed pi-coding-agent package.
const piRoot = process.env.PI_PACKAGE_ROOT;
if (!piRoot)
  throw new Error(
    "Set PI_PACKAGE_ROOT to the installed @earendil-works/pi-coding-agent package directory.",
  );
const piRequire = createRequire(join(piRoot, "package.json"));
const jiti = createJiti(import.meta.url, {
  alias: {
    "@earendil-works/pi-coding-agent": join(piRoot, "dist/index.js"),
    "@earendil-works/pi-tui": piRequire.resolve("@earendil-works/pi-tui"),
    typebox: piRequire.resolve("typebox"),
  },
});
const { registerDelegatedTool } = await jiti.import(
  join(root, "lib/delegated-tool.ts"),
);
const { Type } = await jiti.import(piRequire.resolve("typebox"));
const { ToolExecutionComponent } = await jiti.import(
  join(piRoot, "dist/modes/interactive/components/tool-execution.js"),
);
const { initTheme } = await jiti.import(
  join(piRoot, "dist/modes/interactive/theme/theme.js"),
);
initTheme("dark");
const { KeybindingsManager } = await jiti.import(join(piRoot, "dist/core/keybindings.js"));
const { setKeybindings } = await jiti.import(piRequire.resolve("@earendil-works/pi-tui"));

const configDir = await mkdtemp(join(tmpdir(), "delegated-tool-config-"));
const previousConfigPath = process.env.PI_SUBAGENT_MODELS_PATH;
process.env.PI_SUBAGENT_MODELS_PATH = join(configDir, "models.json");
await writeFile(
  process.env.PI_SUBAGENT_MODELS_PATH,
  JSON.stringify({
    "openai-codex/gpt-6.1-sol": { finder: "openai-codex/gpt-5.6-terra:low" },
    default: { librarian: "google/research-model:medium" },
  }),
);
after(async () => {
  if (previousConfigPath === undefined)
    delete process.env.PI_SUBAGENT_MODELS_PATH;
  else process.env.PI_SUBAGENT_MODELS_PATH = previousConfigPath;
  await rm(configDir, { recursive: true, force: true });
});

const REQUEST = "prompt-template:subagent:request";
const RPC_REQUEST = "subagents:rpc:v1:request";
const RPC_REPLY = "subagents:rpc:v1:reply:";
const STARTED = "prompt-template:subagent:started";
const UPDATE = "prompt-template:subagent:update";
const RESPONSE = "prompt-template:subagent:response";
const CANCEL = "prompt-template:subagent:cancel";
const billed = { input: 10, output: 5, cacheRead: 3, cacheWrite: 2, cost: 0.4 };

function harness(onRequest, options = {}) {
  const events = new EventEmitter();
  const lifecycle = new EventEmitter();
  const updates = [];
  let tool;
  const pi = {
    events: {
      emit: (...args) => events.emit(...args),
      on(name, handler) {
        events.on(name, handler);
        return () => events.off(name, handler);
      },
    },
    on(name, handler) {
      lifecycle.on(name, handler);
      return () => lifecycle.off(name, handler);
    },
    registerTool(value) {
      tool = value;
    },
  };
  events.on(REQUEST, (request) => onRequest(request, events));
  events.on(RPC_REQUEST, (request) => onRequest(request, events));
  registerDelegatedTool(pi, {
    name: "finder",
    label: "Finder",
    statusLabels: {
      active: "Finder searching",
      complete: "Finder searched",
      failed: "Finder search failed",
      cancelled: "Finder search cancelled",
      attention: "Finder needs input",
    },
    description: "Search",
    agent: "dthongvl.finder",
    parameters: Type.Object({ query: Type.String() }),
    buildPrompt: ({ query }) => query,
    async: false,
    ...options,
  });
  const ctx = {
    cwd: root,
    model: { provider: "openai-codex", id: "gpt-6.1-sol" },
    thinkingLevel: "high",
    sessionManager: { getSessionId: () => "parent" },
  };
  return {
    tool,
    events,
    lifecycle,
    updates,
    execute: (params = { query: "find auth" }, signal) =>
      tool.execute(
        "call-1",
        params,
        signal,
        (update) => updates.push(update),
        ctx,
      ),
  };
}

function reply(events, request, response) {
  const { requestId, ownerRunId, nodeId } = request;
  events.emit(RESPONSE, {
    requestId,
    ownerRunId,
    nodeId,
    runId: "child",
    ...response,
  });
}

function rpcReply(events, request, reply) {
  events.emit(`${RPC_REPLY}${request.requestId}`, {
    version: 1,
    requestId: request.requestId,
    ...reply,
  });
}

function complete(events, runId, text, extra = {}) {
  events.emit("subagent:async-complete", {
    id: runId,
    runId,
    state: "complete",
    success: true,
    results: [{ status: "completed", output: text }],
    ...extra,
  });
}

function assertClean(h) {
  for (const event of [
    "subagent:async-complete",
    "pi-intercom:detach-request",
    "subagent:control-event",
  ])
    assert.equal(h.events.listenerCount(event), 0);
  assert.equal(
    h.events.eventNames().filter((name) => String(name).startsWith(RPC_REPLY))
      .length,
    0,
  );
  for (const name of [STARTED, UPDATE, RESPONSE])
    assert.equal(h.events.listenerCount(name), 0);
  assert.equal(h.lifecycle.listenerCount("session_shutdown"), 0);
}

test("config-selected delegation returns billed output and consistent progress", async () => {
  const h = harness((request, events) => {
    assert.equal(request.model, "openai-codex/gpt-5.6-terra");
    assert.equal(request.thinking, "low");
    assert.equal(request.task, "find auth");
    assert.equal(request.agent, "dthongvl.finder");
    events.emit(STARTED, request);
    events.emit(UPDATE, {
      ...request,
      runId: "child",
      recentOutput: "Searching",
    });
    reply(events, request, {
      status: "completed",
      result: { kind: "text", text: "auth.ts" },
      usage: billed,
    });
  });
  const result = await h.execute();
  assert.equal(result.content[0].text, "auth.ts");
  assert.equal(result.details.status, "done");
  assert.equal(result.details.runId, "child");
  assert.equal(result.usage.totalTokens, 20);
  assert.equal(result.usage.cost.total, 0.4);
  assert.ok(h.updates.some((update) => update.content[0].text === "Searching"));
  assertClean(h);
});

for (const status of ["failed", "timed_out", "invalid_request"]) {
  test(`${status} produces an error result without losing billed usage`, async () => {
    const h = harness((request, events) =>
      reply(events, request, {
        status,
        error: "backend failure",
        usage: billed,
      }),
    );
    const result = await h.execute();
    assert.equal(result.isError, true);
    assert.equal(result.details.status, "error");
    assert.equal(result.details.terminalStatus, status);
    assert.match(result.content[0].text, /backend failure/);
    assert.equal(result.usage.cost.total, 0.4);
    assertClean(h);
  });
}

test("abort forwards cancellation and retains authoritative terminal usage", async () => {
  const controller = new AbortController();
  const h = harness((request, events) => {
    events.emit(STARTED, request);
    events.emit(UPDATE, {
      ...request,
      recentTools: [{ tool: "edit" }],
      currentTool: "bash",
    });
    events.once(CANCEL, () =>
      reply(events, request, { status: "cancelled", usage: billed }),
    );
    controller.abort();
  });
  const result = await h.execute(undefined, controller.signal);
  assert.equal(result.details.status, "cancelled");
  assert.notEqual(result.isError, true);
  assert.match(
    result.content[0].text,
    /do not establish which changes completed/,
  );
  assert.match(result.content[0].text, /edit/);
  assert.equal(result.usage.cost.total, 0.4);
  assertClean(h);
});

test("preparation failures and empty prompts never spawn a child", async () => {
  for (const buildPrompt of [
    () => "   ",
    async () => {
      throw new Error("missing session");
    },
  ]) {
    let requested = false;
    const h = harness(
      () => {
        requested = true;
      },
      { buildPrompt },
    );
    const result = await h.execute();
    assert.equal(requested, false);
    assert.equal(result.isError, true);
    assert.equal(result.details.status, "error");
  }
});

test("Read Thread reads directly inside children and launches async otherwise", async () => {
  const dir = await mkdtemp(join(tmpdir(), "read-thread-test-"));
  try {
    const path = join(dir, "session.jsonl");
    await writeFile(
      path,
      [
        {
          type: "session",
          version: 3,
          id: "saved-thread",
          timestamp: new Date().toISOString(),
          cwd: root,
        },
        {
          type: "message",
          id: "entry-1",
          parentId: null,
          timestamp: new Date().toISOString(),
          message: {
            role: "user",
            content: [
              {
                type: "text",
                text: "The release decision was to keep the existing API.",
              },
            ],
            timestamp: Date.now(),
          },
        },
      ]
        .map((entry) => JSON.stringify(entry))
        .join("\n") + "\n",
    );
    const { registerReadThread } = await jiti.import(
      join(root, "extensions/read-thread.ts"),
    );
    let tool;
    const childExtension = (await jiti.import(join(root, "lib/read-thread-child.ts"))).default;
    childExtension({
      registerTool(value) {
        tool = value;
      },
    });
    const result = await tool.execute(
      "read-call",
      { threadID: path, goal: "What was decided?" },
      undefined,
      undefined,
      { cwd: root },
    );
    assert.equal(result.details.status, "done");
    assert.equal(result.details.mode, "direct-child-read");
    assert.match(result.content[0].text, /keep the existing API/);
    assert.match(result.content[0].text, /untrusted quoted data/);

    const events = new EventEmitter();
    registerReadThread({
      registerTool(value) {
        tool = value;
      },
      on() {
        return () => {};
      },
      events: {
        emit: (...args) => events.emit(...args),
        on(event, handler) {
          events.on(event, handler);
          return () => events.off(event, handler);
        },
      },
    });
    events.on(RPC_REQUEST, (request) => {
      assert.equal(request.params.agent, "dthongvl.read-thread");
      assert.equal(request.params.async, true);
      assert.match(request.params.task, /keep the existing API/);
      assert.match(request.params.task, /What was decided/);
      complete(events, "thread-extraction", "Keep the existing API.");
      rpcReply(events, request, {
        success: true,
        data: {
          text: "Thread extraction launched",
          details: { asyncId: "thread-extraction" },
        },
      });
    });
    const launched = await tool.execute(
      "read-async",
      { threadID: path, goal: "What was decided?" },
      undefined,
      undefined,
      { cwd: root },
    );
    assert.equal(launched.details.status, "done");
    assert.equal(launched.content[0].text, "Keep the existing API.");
    assert.equal(launched.details.threadID, "saved-thread");
    assert.equal(launched.details.sessionPath, path);
    assert.equal(launched.details.runId, "thread-extraction");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("default config and parent fallback resolve centrally", async () => {
  for (const [options, model, thinking] of [
    [{ modelKey: "librarian" }, "google/research-model", "medium"],
    [
      { modelKey: "unmapped", inheritParentModel: true },
      "openai-codex/gpt-6.1-sol",
      "high",
    ],
  ]) {
    const h = harness((request, events) => {
      assert.equal(request.model, model);
      assert.equal(request.thinking, thinking);
      reply(events, request, {
        status: "completed",
        result: { kind: "text", text: "done" },
      });
    }, options);
    assert.equal((await h.execute()).details.status, "done");
    assertClean(h);
  }
});

test("oversized output retains a readable full-output artifact", async () => {
  const fullText = "a useful finding\n".repeat(2100);
  const h = harness((request, events) =>
    reply(events, request, {
      status: "completed",
      result: { kind: "text", text: fullText },
    }),
  );
  const result = await h.execute();
  const path = result.details.fullOutputPath;
  assert.ok(path);
  try {
    assert.match(result.content[0].text, /truncated/);
    assert.equal(await readFile(path, "utf8"), fullText);
  } finally {
    await rm(dirname(path), { recursive: true, force: true });
  }
  assertClean(h);
});

test("Task builds its prompt through the native shared runner", async () => {
  for (const [name, params, expected] of [
    [
      "task",
      { prompt: "implement routing", description: "Routing" },
      "implement routing",
    ],
  ]) {
    const extension = (await jiti.import(join(root, `extensions/${name}.ts`)))
      .default;
    const events = new EventEmitter();
    let tool;
    extension({
      registerTool(value) {
        tool = value;
      },
      events: {
        emit: (...args) => events.emit(...args),
        on(event, handler) {
          events.on(event, handler);
          return () => events.off(event, handler);
        },
      },
      on() {
        return () => {};
      },
    });
    events.on(RPC_REQUEST, (request) => {
      assert.equal(request.method, "spawn");
      assert.equal(request.params.task, expected);
      assert.equal(request.params.async, true);
      complete(events, "native-run", "Final result");
      rpcReply(events, request, {
        success: true,
        data: {
          text: "Native launch receipt",
          details: {
            asyncId: "native-run",
            runId: "native-run",
            asyncDir: "/tmp/native-run",
            mode: "single",
            results: [],
          },
        },
      });
    });
    const ctx = {
      cwd: root,
      model: { provider: "openai-codex", id: "gpt-6.1-sol" },
      thinkingLevel: "high",
      sessionManager: {
        getSessionFile: () => "parent.jsonl",
        getSessionId: () => "parent",
      },
    };
    assert.equal(
      (await tool.execute(`call-${name}`, params, undefined, undefined, ctx))
        .details.status,
      "done",
    );
  }
});

test("already-aborted calls do not prepare prompts or launch children", async () => {
  const controller = new AbortController();
  controller.abort();
  const h = harness(() => assert.fail("must not delegate"), {
    buildPrompt: () => assert.fail("must not prepare"),
  });
  const result = await h.execute(undefined, controller.signal);
  assert.equal(result.details.status, "cancelled");
  assert.notEqual(result.isError, true);
  assertClean(h);
});

test("tool rows update the heading, show the configured expansion hint, and retain expanded detail", () => {
  setKeybindings(new KeybindingsManager({ "app.tools.expand": "ctrl+0" }));
  const h = harness(() => {});
  const row = () => new ToolExecutionComponent(
    "finder", "call-1", { query: "find auth" }, {}, h.tool,
    { requestRender() {} }, root,
  );
  const visible = (component) => stripVTControlCharacters(component.render(120).join("\n"))
    .split("\n").map((line) => line.trim()).filter(Boolean);
  const component = row();
  component.markExecutionStarted();
  assert.deepEqual(visible(component), ["Finder searching (ctrl+0 to expand)"]);
  for (const [status, isPartial, isError, label] of [
    ["in-progress", true, false, "Finder searching"],
    ["done", false, false, "Finder searched"],
    ["attention", false, false, "Finder needs input"],
    ["cancelled", false, false, "Finder search cancelled"],
    ["error", false, false, "Finder search failed"],
    [undefined, false, true, "Finder search failed"],
  ]) {
    const result = {
      content: [{ type: "text", text: "Result or diagnostic" }],
      details: { status },
      isError,
    };
    component.setExpanded(false);
    component.updateResult(result, isPartial);
    assert.deepEqual(visible(component), [`${label} (ctrl+0 to expand)`]);
    component.setExpanded(true);
    assert.deepEqual(visible(component), [label, "Input:", "query: find auth", "Result or diagnostic"]);
    // Restored rows receive a final result without a preceding progress update.
    const restored = row();
    restored.updateResult(result, isPartial);
    assert.deepEqual(visible(restored), [`${label} (ctrl+0 to expand)`]);
  }
});

test(
  "native background tool waits for its own final result instead of the launch receipt",
  { timeout: 2000 },
  async () => {
    const h = harness(
      (request, events) => {
        assert.equal(request.method, "spawn");
        assert.equal(request.params.async, true);
        assert.equal(request.params.agent, "dthongvl.finder");
        assert.equal(request.params.model, "openai-codex/gpt-5.6-terra");
        assert.equal(request.params.thinking, "low");
        assert.equal(request.params.context, "fresh");
        assert.deepEqual(request.params.intercomBridge, { mode: "off" });
        rpcReply(events, request, {
          success: true,
          data: {
            text: "Launch receipt, not the answer",
            details: {
              asyncId: "child-run",
              runId: "child-run",
              asyncDir: "/tmp/child-run",
              mode: "single",
              results: [],
              launchContractDigest: "native-digest",
            },
          },
        });
      },
      { async: undefined },
    );
    let finished = false;
    const pending = h.execute().then((result) => {
      finished = true;
      return result;
    });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(finished, false);
    assert.ok(h.updates.some((update) => update.details.runId === "child-run"));
    complete(h.events, "unrelated-run", "Wrong result");
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(finished, false);
    complete(h.events, "child-run", "auth.ts contains authentication");
    const result = await pending;
    assert.equal(result.details.status, "done");
    assert.equal(result.details.asyncId, "child-run");
    assert.equal(result.details.launchContractDigest, "native-digest");
    assert.equal(result.content[0].text, "auth.ts contains authentication");
    assert.equal(result.usage, undefined);
    assert.match(h.tool.description, /waits for completion/);
    assertClean(h);
  },
);

test("RPC launch rejection is an error rather than a successful launch", async () => {
  const h = harness(
    (request, events) =>
      rpcReply(events, request, {
        success: false,
        error: { code: "execution_failed", message: "Agent unavailable" },
      }),
    { async: true },
  );
  const result = await h.execute();
  assert.equal(result.isError, true);
  assert.equal(result.details.status, "error");
  assert.equal(result.details.launchOutcome, "rejected");
  assert.match(result.content[0].text, /Agent unavailable/);
  assertClean(h);
});

test("abort during async launch retains the reply and stops only that run", async () => {
  const controller = new AbortController();
  const h = harness(
    (request, events) => {
      if (request.method === "spawn") {
        controller.abort();
        rpcReply(events, request, {
          success: true,
          data: { text: "Launched", details: { asyncId: "cancel-this-run" } },
        });
      } else {
        assert.equal(request.method, "stop");
        assert.equal(request.params.id, "cancel-this-run");
        rpcReply(events, request, {
          success: true,
          data: { text: "Run stop accepted" },
        });
      }
    },
    { async: true },
  );
  const result = await h.execute(undefined, controller.signal);
  assert.equal(result.details.status, "cancelled");
  assert.equal(result.details.runId, "cancel-this-run");
  assertClean(h);
});

test("failed async cancellation exposes the active run instead of claiming it stopped", async () => {
  const controller = new AbortController();
  const h = harness(
    (request, events) => {
      if (request.method === "spawn") {
        controller.abort();
        rpcReply(events, request, {
          success: true,
          data: { text: "Launched", details: { asyncId: "still-active" } },
        });
      } else
        rpcReply(events, request, {
          success: false,
          error: { code: "invalid_state", message: "Cannot stop" },
        });
    },
    { async: true },
  );
  const result = await h.execute(undefined, controller.signal);
  assert.equal(result.isError, true);
  assert.equal(result.details.status, "error");
  assert.equal(result.details.runId, "still-active");
  assert.equal(result.details.launchOutcome, "unknown");
  assert.match(result.content[0].text, /do not launch a replacement/);
  assertClean(h);
});

test("lost RPC reply reports an unknown outcome and never retries the spawn", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let dispatched;
  let requests = 0;
  const sent = new Promise((resolve) => {
    dispatched = resolve;
  });
  const h = harness(
    () => {
      requests++;
      dispatched();
    },
    { async: true },
  );
  const pending = h.execute();
  await sent;
  t.mock.timers.tick(60_000);
  const result = await pending;
  assert.equal(requests, 1);
  assert.equal(result.isError, true);
  assert.equal(result.details.launchOutcome, "unknown");
  assert.ok(result.details.rpcRequestId);
  assert.match(result.content[0].text, /do not retry automatically/);
  assertClean(h);
});

test("background failures and paused attempts do not become successful results", async () => {
  for (const [event, status] of [
    [
      { state: "failed", success: false, error: "Compilation failed" },
      "failed",
    ],
    [{ state: "failed", success: false, timedOut: true }, "timed_out"],
    [{ state: "paused", success: false, interrupted: true }, "interrupted"],
  ]) {
    const h = harness(
      (request, events) => {
        complete(events, "bad-run", "Partial work", event);
        rpcReply(events, request, {
          success: true,
          data: { text: "Launched", details: { asyncId: "bad-run" } },
        });
      },
      { async: true },
    );
    const result = await h.execute();
    assert.equal(result.isError, true);
    assert.equal(result.details.terminalStatus, status);
    assertClean(h);
  }
});

test("blocking supervisor input releases the wait without claiming completion", async () => {
  const h = harness(
    (request, events) => {
      events.emit("pi-intercom:detach-request", {
        runId: "needs-input",
        requestId: "supervisor-1",
        childIndex: 0,
      });
      rpcReply(events, request, {
        success: true,
        data: { text: "Launched", details: { asyncId: "needs-input" } },
      });
    },
    { async: true },
  );
  const result = await h.execute();
  assert.equal(result.details.status, "attention");
  assert.equal(result.details.supervisorRequestId, "supervisor-1");
  assert.match(result.content[0].text, /child has not completed/);
  assertClean(h);
});

test(
  "cancelling while awaiting completion stops the exact background child",
  { timeout: 2000 },
  async () => {
    const controller = new AbortController();
    let stopped;
    const h = harness(
      (request, events) => {
        if (request.method === "spawn")
          rpcReply(events, request, {
            success: true,
            data: { text: "Launched", details: { asyncId: "waiting-run" } },
          });
        else {
          stopped = request.params.id;
          rpcReply(events, request, {
            success: true,
            data: { text: "Stopped" },
          });
        }
      },
      { async: true },
    );
    const pending = h.execute(undefined, controller.signal);
    await new Promise((resolve) => setImmediate(resolve));
    controller.abort();
    const result = await pending;
    assert.equal(stopped, "waiting-run");
    assert.equal(result.details.status, "cancelled");
    assertClean(h);
  },
);

test("a missing completion event eventually stops the known child and cleans up", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let stopped;
  const h = harness(
    (request, events) => {
      if (request.method === "spawn")
        rpcReply(events, request, {
          success: true,
          data: { text: "Launched", details: { asyncId: "stalled-run" } },
        });
      else {
        stopped = request.params.id;
        rpcReply(events, request, {
          success: true,
          data: { text: "Stop accepted" },
        });
      }
    },
    { async: true, timeoutMs: 1 },
  );
  const pending = h.execute();
  await new Promise((resolve) => setImmediate(resolve));
  t.mock.timers.tick(60_001);
  const result = await pending;
  assert.equal(stopped, "stalled-run");
  assert.equal(result.isError, true);
  assert.equal(result.details.terminalStatus, "timed_out");
  assertClean(h);
});

test("an available final-output artifact replaces a truncated completion preview", async () => {
  const dir = await mkdtemp(join(tmpdir(), "async-final-output-"));
  try {
    const outputPath = join(dir, "answer.md");
    await writeFile(outputPath, "The full final answer.");
    const h = harness(
      (request, events) => {
        complete(events, "artifact-run", "preview", {
          results: [
            {
              status: "completed",
              output: "preview",
              truncated: true,
              artifactPaths: { outputPath },
            },
          ],
        });
        rpcReply(events, request, {
          success: true,
          data: { text: "Launched", details: { asyncId: "artifact-run" } },
        });
      },
      { async: true },
    );
    const result = await h.execute();
    assert.equal(result.details.status, "done");
    assert.equal(result.content[0].text, "The full final answer.");
    assertClean(h);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
