import assert from "node:assert/strict";
import { constants } from "node:fs";
import { mkdtemp, open, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { Context, Model, SimpleStreamOptions } from "@earendil-works/pi-ai";
import { stream, streamSimple, type GoogleOptions } from "@earendil-works/pi-ai/api/google-generative-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import registerViewMedia from "../extensions/view-media.ts";
import { clearSubagentModelCache } from "./subagent-model.ts";

test("view_media translates configured thinking into the Gemini request", async () => {
  const dir = await mkdtemp(join(tmpdir(), "view-media-thinking-"));
  const configPath = join(dir, "subagent-models.json");
  const mediaPath = join(dir, "sample.png");
  const previousConfig = process.env.PI_SUBAGENT_MODELS_PATH;
  const model: Model<"google-generative-ai"> = {
    provider: "google",
    id: "gemini-3.8-flash",
    name: "Gemini Flash",
    api: "google-generative-ai",
    baseUrl: "https://generativelanguage.googleapis.com",
    reasoning: true,
    thinkingLevelMap: { off: "off", minimal: "minimal", low: "low", medium: "medium", high: "high" },
    input: ["text", "image"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 1_000_000,
    maxTokens: 65_535,
  };
  let tool: Parameters<ExtensionAPI["registerTool"]>[0] | undefined;
  registerViewMedia({ registerTool(value) { tool = value; } } as ExtensionAPI);
  assert.ok(tool);

  try {
    process.env.PI_SUBAGENT_MODELS_PATH = configPath;
    await writeFile(mediaPath, Buffer.from("89504e470d0a1a0a", "hex"));
    for (const level of ["off", "minimal", "low", "medium", "high"] as const) {
      for (const target of [`google/gemini-3.8-flash:${level}`, { model: "google/gemini-3.8-flash", thinking: level }]) {
        await writeFile(configPath, JSON.stringify({ default: { view_media: target } }));
        clearSubagentModelCache();
        let thinkingConfig: unknown;
        const inspect = (options?: GoogleOptions | SimpleStreamOptions) => ({
          ...options,
          apiKey: "test-key",
          onPayload(payload: unknown) {
            thinkingConfig = (payload as { config: { thinkingConfig?: unknown } }).config.thinkingConfig;
            // Stop at the serialized provider request; never make a network call.
            throw new Error("Request captured");
          },
        });
        const transcript = (context: Context) => ({ messages: context.messages });
        const ctx = {
          cwd: dir,
          isProjectTrusted: () => true,
          modelRegistry: {
            find: () => model,
            complete: (_model: unknown, context: Context, options?: GoogleOptions) =>
              stream(model, transcript(context), inspect(options)).result(),
            streamSimple: (_model: unknown, context: Context, options?: SimpleStreamOptions) =>
              streamSimple(model, transcript(context), inspect(options)),
          },
        } as unknown as ExtensionContext;
        await assert.rejects(
          tool.execute("test-call", { path: mediaPath, objective: "Describe the image" }, undefined, undefined, ctx),
          /Request captured/,
        );
        assert.deepEqual(
          thinkingConfig,
          level === "off" ? { thinkingBudget: 0 } : { includeThoughts: true, thinkingLevel: level.toUpperCase() },
          `thinking=${level}, target=${JSON.stringify(target)}`,
        );
      }
    }
  } finally {
    if (previousConfig === undefined) delete process.env.PI_SUBAGENT_MODELS_PATH;
    else process.env.PI_SUBAGENT_MODELS_PATH = previousConfig;
    clearSubagentModelCache();
    await rm(dir, { recursive: true, force: true });
  }
});

test("view_media rejects FIFOs without waiting for a writer", { skip: process.platform === "win32" }, async () => {
  const dir = await mkdtemp(join(tmpdir(), "view-media-fifo-"));
  const path = join(dir, "pipe");
  execFileSync("mkfifo", [path]);
  let tool: Parameters<ExtensionAPI["registerTool"]>[0] | undefined;
  registerViewMedia({ registerTool(value) { tool = value; } } as ExtensionAPI);
  assert.ok(tool);
  const ctx = { cwd: dir, isProjectTrusted: () => true } as ExtensionContext;
  const pending = tool.execute("fifo", { path, objective: "Describe" }, undefined, undefined, ctx);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      assert.rejects(pending, /Path is not a file/),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("FIFO open blocked")), 1000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    // Release a blocking open on the old implementation so a failed regression can exit.
    const writer = await open(path, constants.O_RDWR | constants.O_NONBLOCK);
    await pending.catch(() => {});
    await writer.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("view_media detects media brands and rejects binary text for files and URLs", async () => {
  const dir = await mkdtemp(join(tmpdir(), "view-media-mime-"));
  const ftyp = (major: string, compatible: string) => {
    const data = Buffer.alloc(24);
    data.writeUInt32BE(24);
    data.write(`ftyp${major}`, 4, "ascii");
    data.write(compatible, 16, "ascii");
    return data;
  };
  const cases = [
    { name: "utf16", data: Buffer.from("fffe48006900", "hex") },
    { name: "archive.docx", data: Buffer.from("504b030400000000", "hex") },
    { name: "invalid-utf8", data: Buffer.from([0xc3, 0x28]) },
    { name: "heic-major", data: ftyp("heic", "mif1"), mime: "image/heic" },
    { name: "heic-compatible", data: ftyp("mif1", "heic"), mime: "image/heic" },
    { name: "heif", data: ftyp("mif1", "    "), mime: "image/heif" },
    { name: "avif", data: ftyp("avif", "mif1"), mime: "image/avif" },
    { name: "mp4", data: ftyp("isom", "mp42"), mime: "video/mp4" },
    { name: "m4a", data: ftyp("M4A ", "isom"), mime: "audio/mp4" },
    { name: "mp3", data: Buffer.from("fffb9064", "hex"), mime: "audio/mpeg" },
    { name: "id3", data: Buffer.from("ID3"), mime: "audio/mpeg" },
    { name: "unicode.txt", data: Buffer.from("Hello, 世界!\n"), text: "Hello, 世界!" },
    { name: "empty.txt", data: Buffer.alloc(0), text: "```txt\n\n```" },
    { name: "truncated.txt", data: Buffer.from("a".repeat(99_999) + "世"), text: "[Text input truncated]" },
  ];
  let servedData = Buffer.alloc(0);
  const server = createServer((_request, response) => {
    response.setHeader("Content-Type", "application/octet-stream");
    response.end(servedData);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  let tool: Parameters<ExtensionAPI["registerTool"]>[0] | undefined;
  registerViewMedia({ registerTool(value) { tool = value; } } as ExtensionAPI);
  assert.ok(tool);
  let captured: Context | undefined;
  const captureError = new Error("Media request captured");
  const ctx = {
    cwd: dir,
    isProjectTrusted: () => true,
    modelRegistry: {
      find: () => ({ provider: "google", id: "gemini-3.8-flash" }),
      streamSimple: (_model: unknown, context: Context) => {
        captured = context;
        throw captureError;
      },
    },
  } as unknown as ExtensionContext;
  try {
    for (const fixture of cases) {
      const localPath = join(dir, fixture.name);
      await writeFile(localPath, fixture.data);
      servedData = fixture.data;
      for (const path of [localPath, `http://127.0.0.1:${address.port}/${fixture.name}`]) {
        captured = undefined;
        const pending = tool.execute("mime", { path, objective: "Describe" }, undefined, undefined, ctx);
        if (!fixture.mime && fixture.text === undefined) {
          await assert.rejects(pending, /Unsupported binary or non-UTF-8 media/, path);
          assert.equal(captured, undefined, "binary data must not reach the model");
        } else {
          await assert.rejects(pending, (error) => error === captureError, path);
          const message = captured?.messages[0];
          assert.ok(message?.role === "user" && Array.isArray(message.content));
          if (fixture.mime) {
            const media = message.content.find((part) => part.type === "image");
            assert.equal(media?.mimeType, fixture.mime, path);
            assert.equal(media?.data, fixture.data.toString("base64"), path);
          } else {
            const text = message.content.find((part) => part.type === "text");
            assert.ok(fixture.text !== undefined);
            assert.ok(text?.text.includes(fixture.text), path);
            assert.ok(!text?.text.includes("\ufffd"), "truncation must not corrupt UTF-8");
          }
        }
      }
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(dir, { recursive: true, force: true });
  }
});
