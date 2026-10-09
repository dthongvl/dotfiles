import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtemp, writeFile, readFile, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const runCli = promisify(execFile);

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const piRoot = process.env.PI_PACKAGE_ROOT;
if (!piRoot) throw new Error("Set PI_PACKAGE_ROOT to the installed pi-coding-agent package.");
const require = createRequire(join(piRoot, "package.json"));
const { createJiti } = require("jiti");
const jiti = createJiti(import.meta.url, { alias: {
  "@earendil-works/pi-coding-agent": join(piRoot, "dist/index.js"),
  "@earendil-works/pi-tui": require.resolve("@earendil-works/pi-tui"),
  typebox: require.resolve("typebox"),
} });
const extensions = Object.fromEntries(await Promise.all(
  ["finder", "librarian", "oracle"].map(async name => [name, (await jiti.import(join(root, `extensions/${name}.ts`))).default]),
));
const { waitForHerdrDelegation } = await jiti.import(join(root, "lib/herdr-delegation.ts"));

// Exercise the real tool, CLI adapter, quoting, files, and polling against a
// fake executable implementing Herdr's external JSON/exit-status protocol.
const fakeHerdr = `#!/usr/bin/env node
const fs = require('node:fs');
const {spawn} = require('node:child_process');
const path = require('node:path');
const args = process.argv.slice(2);
const stateFile = path.join(process.env.FAKE_ROOT, 'pane.json');
const send = result => console.log(JSON.stringify({result}));
const state = () => {try{return JSON.parse(fs.readFileSync(stateFile,'utf8'))}catch{return undefined}};
if (args[1] === 'layout') send({layout:{panes:[{pane_id:'test:parent',rect:{width:160,height:40}}]}});
else if (args[1] === 'split') {
 fs.writeFileSync(stateFile, JSON.stringify({pane_id:'test:child'}));
 send({pane:{pane_id:'test:child'}});
} else if (args[1] === 'rename') {
 fs.writeFileSync(stateFile, JSON.stringify({...state(),label:args[3]}));
 send({type:'ok'});
} else if (args[1] === 'run') {
 const child=spawn('sh',['-c',args[3]],{detached:true,stdio:'ignore'}); child.unref();
 fs.writeFileSync(stateFile, JSON.stringify({...state(),pid:child.pid}));
 // Real Herdr pane run returns no stdout on success.
 if (process.env.FAKE_MODE === 'lost-reply') {console.error(JSON.stringify({error:{code:'transport_error',message:'Lost run acknowledgement'}}));process.exitCode=1}
} else if (args[1] === 'get') {
 if(state()) send({pane:state()});
 else {console.error(JSON.stringify({error:{code:'pane_not_found',message:'pane not found'}}));process.exitCode=1}
} else if (args[1] === 'close') {
 if (process.env.FAKE_MODE === 'stop-failure') {console.error(JSON.stringify({error:{code:'transport_error',message:'Cannot close pane'}}));process.exitCode=1}
 else {const pane=state(); fs.rmSync(stateFile,{force:true});send({type:'ok'});if(pane?.pid)try{process.kill(-pane.pid,'SIGTERM')}catch{}}
} else throw new Error('Unexpected Herdr command '+args.join(' '));
`;
const fakePi = `#!/usr/bin/env node
(async()=>{
const fs=require('node:fs');const path=require('node:path');
const dir=process.env.PI_SUBAGENT_RUN_DIR;
const {default:bridge}=await import(process.env.FAKE_BRIDGE);
const handlers={};
bridge({on(event,handler){handlers[event]=handler},setSessionName(){},sendUserMessage(){throw new Error('Unexpected inbox message')}});
const ctx={isIdle:()=>true,shutdown(){handlers.session_shutdown({reason:'quit'});process.exit(0)},sessionManager:{getSessionId:()=> 'test-child-session',getSessionFile:()=>path.join(dir,'session.jsonl')}};
fs.writeFileSync(path.join(process.env.FAKE_ROOT,'launch.json'),JSON.stringify({args:process.argv.slice(2),child:process.env.PI_SUBAGENT_CHILD}));
const file=path.join(dir,'metadata.json');
process.on('SIGTERM',()=>{handlers.session_shutdown({reason:'quit'});process.exit(0)});
await handlers.session_start({},ctx);
await handlers.agent_start({},ctx);
if(process.env.FAKE_MODE === 'complete')setTimeout(()=>{
 const meta=JSON.parse(fs.readFileSync(file,'utf8'));
 fs.writeFileSync(meta.sessionFile,JSON.stringify({type:'message',id:'answer',parentId:null,message:{role:'assistant',stopReason:'stop',content:[{type:'text',text:'auth.ts validates the token'}],usage:{input:20,output:5,cacheRead:3,cacheWrite:0,totalTokens:28,cost:{input:0.1,output:0.2,cacheRead:0.01,cacheWrite:0,total:0.31}}}})+'\\n');
 handlers.agent_settled({},ctx);
},150);
setInterval(()=>{},1000);
})().catch(error=>{console.error(error);process.exit(1)});
`;

async function fixture(mode, run, name = "finder") {
  const dir = await mkdtemp(join(tmpdir(), "herdr-finder-test-"));
  const values = {
    PATH: `${dir}:${process.env.PATH}`, HERDR_ENV: "1", HERDR_PANE_ID: "test:parent",
    PI_CODING_AGENT_DIR: dir, PI_SUBAGENT_MODELS_PATH: join(dir, "models.json"), FAKE_ROOT: dir, FAKE_MODE: mode,
    FAKE_BRIDGE: join(root, "vendor/pi-subagent/index.ts"),
  };
  const previous = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  try {
    await writeFile(join(dir, "herdr"), fakeHerdr, { mode: 0o700 });
    await writeFile(join(dir, "pi"), fakePi, { mode: 0o700 });
    await writeFile(values.PI_SUBAGENT_MODELS_PATH, JSON.stringify({ default: { finder: "openai-codex/test-model:low" } }));
    Object.assign(process.env, values);
    const lifecycle = new EventEmitter();
    const events = new EventEmitter();
    let tool;
    extensions[name]({
      events,
      registerTool(value) { tool = value; }, registerCommand() {},
      on(event, handler) { lifecycle.on(event, handler); return () => lifecycle.off(event, handler); },
    });
    const ctx = {
      cwd: root, model: { provider: "test", id: "parent" }, thinkingLevel: "high",
      sessionManager: { getSessionId: () => "test-parent-session", getSessionFile: () => "parent.jsonl" },
    };
    const params = name === "oracle" ? { task: "Review token validation" }
      : name === "librarian" ? { query: "Explain routing", context: "External repository" }
      : { query: "Find auth's token validation; $(touch SHOULD_NOT_EXIST)" };
    const execute = (signal, onUpdate, title) => tool.execute(`${name}-test`, { ...params, ...(title === undefined ? {} : { title }) }, signal, onUpdate, ctx);
    await run({ dir, execute, lifecycle, ctx });
  } finally {
    // Clean up only the process group created by this fixture, including failed stops.
    try { const pane = JSON.parse(await readFile(join(dir, "pane.json"), "utf8")); if (pane.pid) process.kill(-pane.pid, "SIGTERM"); } catch {}
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    // Detached launchers may finish writing exit metadata just after SIGTERM.
    await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

test("Finder returns final text and usage after automatically closing its pane, preserving its profile and transcript", async () => {
  await fixture("complete", async ({ dir, execute }) => {
    const result = await execute();
    assert.equal(result.details.status, "done");
    assert.equal(result.content[0].text, "auth.ts validates the token");
    assert.equal(result.usage.cost.total, 0.31);
    assert.equal(result.details.paneId, "test:child");
    const launch = JSON.parse(await readFile(join(dir, "launch.json"), "utf8"));
    assert.equal(launch.child, "1");
    assert.ok(launch.args.includes("--no-context-files"));
    assert.ok(launch.args.includes("--no-mcp"));
    assert.match(launch.args[launch.args.indexOf("--system-prompt") + 1], /You are a fast, parallel code search agent/);
    assert.match(launch.args[launch.args.indexOf("--tools") + 1], /ffgrep/);
    assert.equal(launch.args[launch.args.indexOf("--model") + 1], "test-model");
    assert.equal(launch.args.at(-1), "Task:\nFind auth's token validation; $(touch SHOULD_NOT_EXIST)");
    await assert.rejects(readFile(join(dir, "pane.json"), "utf8"), { code: "ENOENT" });
    const metadata = JSON.parse(await readFile(join(result.details.runDir, "metadata.json"), "utf8"));
    assert.equal(metadata.parentSessionId, "test-parent-session");
    assert.equal(metadata.state, "completed");
    const waited = await runCli(process.execPath, [join(root, "vendor/pi-subagent/subagent.ts"), "wait", result.details.runId, "--timeout", "1"]);
    assert.match(waited.stdout, /auth.ts validates the token/);
  });
});

test("cancellation closes the exact child and retains its transcript; failed stops remain errors", async () => {
  for (const mode of ["busy", "stop-failure"]) await fixture(mode, async ({ dir, execute }) => {
    const controller = new AbortController();
    const result = await execute(controller.signal, update => {
      if (update.details.paneId) controller.abort();
    });
    assert.equal(result.details.status, mode === "busy" ? "cancelled" : "error");
    if (mode === "busy") {
      await assert.rejects(readFile(join(dir, "pane.json"), "utf8"), { code: "ENOENT" });
      assert.equal(await readFile(result.details.sessionFile, "utf8"), "");
    } else {
      assert.equal(result.isError, true);
      assert.match(result.content[0].text, /may still be active/);
      assert.equal(JSON.parse(await readFile(join(dir, "pane.json"), "utf8")).pane_id, "test:child");
    }
  });
});

test("a lost launch acknowledgement closes the owned pane without retrying or deleting evidence", async () => {
  await fixture("lost-reply", async ({ dir, execute }) => {
    const result = await execute();
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /Do not retry automatically/);
    await assert.rejects(readFile(join(dir, "pane.json"), "utf8"), { code: "ENOENT" });
    const { readdir } = await import("node:fs/promises");
    const handles = await readdir(join(dir, "herdr-subagents"));
    assert.equal(handles.length, 1);
    assert.equal(JSON.parse(await readFile(join(dir, "herdr-subagents", handles[0], "metadata.json"), "utf8")).state, "error");
  });
});

test("timeout stops a running child and retains the run for diagnosis", async () => {
  await fixture("busy", async ({ dir }) => {
    const result = await waitForHerdrDelegation({ on() { return () => {}; } }, {
      agent: "dthongvl.finder", task: "Find token validation", context: "fresh",
      cwd: root, model: "openai-codex/test-model", thinking: "low", timeoutMs: 300,
    });
    assert.equal(result.status, "timed_out");
    await assert.rejects(readFile(join(dir, "pane.json"), "utf8"), { code: "ENOENT" });
    assert.equal(JSON.parse(await readFile(join(result.details.runDir, "metadata.json"), "utf8")).state, "exited");
  });
});

test("pre-aborted calls and callers outside Herdr do not create panes", async () => {
  await fixture("complete", async ({ dir, execute }) => {
    const controller = new AbortController(); controller.abort();
    assert.equal((await execute(controller.signal)).details.status, "cancelled");
    process.env.HERDR_ENV = "0";
    const result = await execute();
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /Herdr-managed parent pane/);
    await assert.rejects(readFile(join(dir, "pane.json"), "utf8"), { code: "ENOENT" });
  });
});

test("keep-pane retains settled runs for inspection, rename, and parent resume", async () => {
  await fixture("complete", async ({ dir, lifecycle, ctx }) => {
    const spawned = await runCli(process.execPath, [join(root, "vendor/pi-subagent/subagent.ts"), "spawn", "--name", "Finder · JWT authentication", "--keep-pane", "--provider", "test", "--model", "test", "--prompt", "Find auth"], { env: { ...process.env, PI_SESSION_ID: "test-parent-session" } });
    const handle = spawned.stdout.match(/\(([a-z0-9]+)\)/)[1];
    const result = { details: { runId: handle, runDir: join(dir, "herdr-subagents", handle) } };
    await runCli(process.execPath, [join(root, "vendor/pi-subagent/subagent.ts"), "wait", handle, "--timeout", "10"]);
    const pane = async () => JSON.parse(await readFile(join(dir, "pane.json"), "utf8"));
    assert.equal((await pane()).label, "Finder · JWT authentication");
    const renamed = "Finder · Refresh tokens";
    await runCli(process.execPath, [join(root, "vendor/pi-subagent/subagent.ts"), "rename", result.details.runId, renamed]);
    assert.equal((await pane()).label, renamed);
    for (const handler of lifecycle.listeners("session_shutdown")) await handler({ reason: "quit" }, ctx);
    await assert.rejects(readFile(join(dir, "pane.json"), "utf8"), { code: "ENOENT" });
    for (const handler of lifecycle.listeners("session_start")) await handler({}, ctx);
    assert.equal((await pane()).label, renamed);
    assert.equal(JSON.parse(await readFile(join(result.details.runDir, "metadata.json"), "utf8")).name, renamed);
    // Let the resumed fake process start so fixture cleanup can stop it.
    await new Promise(resolve => setTimeout(resolve, 100));
  });
});

test("Librarian and Oracle return Herdr results with their own profiles and caller context", async () => {
  for (const name of ["librarian", "oracle"]) {
    await fixture("complete", async ({ dir, execute }) => {
      const result = await execute();
      assert.equal(result.details.status, "done");
      assert.equal(result.details.backend, "herdr");
      assert.equal(result.content[0].text, "auth.ts validates the token");
      assert.equal(result.usage.cost.total, 0.31);
      const { args } = JSON.parse(await readFile(join(dir, "launch.json"), "utf8"));
      const metadata = JSON.parse(await readFile(join(result.details.runDir, "metadata.json"), "utf8"));
      assert.equal(metadata.name, name === "oracle" ? "Oracle" : "Librarian");
      assert.equal(args[args.indexOf("--model") + 1], "gpt-5.6-sol");
      assert.equal(args[args.indexOf("--thinking") + 1], name === "oracle" ? "xhigh" : "off");
      assert.ok(!args.includes("--no-skills"));
      assert.ok(args.some(arg => arg.endsWith("webfox/dist/pi.js")));
      if (name === "oracle") {
        assert.match(args[args.indexOf("--system-prompt") + 1], /You are the Oracle/);
        const childReader = args.find(arg => arg.endsWith("/lib/read-thread-child.ts"));
        assert.ok(childReader);
        assert.equal(await realpath(childReader), join(root, "lib/read-thread-child.ts"));
        assert.match(args[args.indexOf("--tools") + 1], /read_thread/);
        assert.match(args.at(-1), /Task: Review token validation\n\nParent thread: test-parent-session/);
      } else {
        assert.match(args[args.indexOf("--system-prompt") + 1], /You are the Librarian/);
        assert.equal(args.at(-1), "Task:\nContext: External repository\n\nQuery: Explain routing");
      }
      await assert.rejects(readFile(join(dir, "pane.json"), "utf8"), { code: "ENOENT" });
    }, name);
  }
});

test("specialists share one Herdr pane selector and parent lifecycle", () => {
  const lifecycle = new EventEmitter();
  const commands = [];
  const events = new EventEmitter();
  const pi = {
    events,
    registerTool() {},
    registerCommand(name) { commands.push(name); },
    on(event, handler) { lifecycle.on(event, handler); return () => lifecycle.off(event, handler); },
  };
  for (const extension of Object.values(extensions)) extension({ ...pi });
  assert.deepEqual(commands, ["herdr-subagent"]);
  assert.equal(lifecycle.listenerCount("session_start"), 1);
  assert.equal(lifecycle.listenerCount("session_shutdown"), 1);
});
