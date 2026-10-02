import { existsSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { DelegationThinking } from "./delegation.ts";

export type SubagentModelTarget =
  | string
  | {
      model: string;
      thinking?: DelegationThinking;
    };

export type SubagentModelMap = Record<string, SubagentModelTarget>;

export type SubagentModelConfig = Record<string, SubagentModelMap>;

export interface ResolveSubagentModelOptions {
  defaultModel?: string;
  defaultThinking?: DelegationThinking;
  cwd?: string;
}

export interface ResolvedSubagentModel {
  model?: string;
  thinking?: DelegationThinking;
}

const VALID_THINKING_LEVELS = new Set<DelegationThinking>([
  "off",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
]);

const SUBAGENT_ALIASES: Record<string, string[]> = {
  finder: ["finder", "find", "search"],
  find: ["finder", "find", "search"],
  oracle: ["oracle", "advisor", "review"],
  librarian: ["librarian"],
  task: ["task"],
  "read-thread": ["read-thread", "read_thread", "readthread"],
  read_thread: ["read-thread", "read_thread", "readthread"],
  view_media: ["view_media", "view-media", "viewmedia", "media"],
  "view-media": ["view_media", "view-media", "viewmedia", "media"],
  viewmedia: ["view_media", "view-media", "viewmedia", "media"],
};

function getModuleDir(): string {
  try {
    if (typeof import.meta?.url === "string") {
      return dirname(fileURLToPath(import.meta.url));
    }
  } catch {
    // fallback
  }
  return process.cwd();
}

let cachedConfig: {
  filePath: string;
  mtimeMs: number;
  data: SubagentModelConfig;
} | null = null;

export function clearSubagentModelCache(): void {
  cachedConfig = null;
}

export function findSubagentModelConfigFile(cwd?: string): string | null {
  const envPath = process.env.PI_SUBAGENT_MODELS_PATH || process.env.PI_SUBAGENT_MODELS_FILE;
  if (envPath && existsSync(envPath)) {
    return envPath;
  }

  const moduleDir = getModuleDir();
  const candidates: string[] = [];

  if (cwd) {
    candidates.push(join(cwd, ".pi", "subagent-models.json"));
    candidates.push(join(cwd, ".pi", "subagents.json"));
  }

  candidates.push(resolve(moduleDir, "../subagent-models.json"));
  candidates.push(resolve(moduleDir, "../subagents.json"));

  const userHome = homedir();
  candidates.push(join(userHome, ".pi", "agent", "subagent-models.json"));
  candidates.push(join(userHome, ".pi", "agent", "subagents.json"));

  for (const candidate of candidates) {
    try {
      if (existsSync(candidate)) {
        return candidate;
      }
    } catch {
      // ignore access issues
    }
  }

  return null;
}

function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/^.*?[./]/, "") // strip leading namespace or prefix e.g. "dthongvl."
    .replace(/[-_]/g, ""); // strip hyphens and underscores for comparison
}

function parseModelAndThinking(
  target: SubagentModelTarget,
  fallbackThinking?: DelegationThinking,
): { model: string; thinking?: DelegationThinking } {
  if (typeof target === "object" && target !== null && "model" in target) {
    const rawThinking = target.thinking;
    const thinking =
      typeof rawThinking === "string" && VALID_THINKING_LEVELS.has(rawThinking as DelegationThinking)
        ? (rawThinking as DelegationThinking)
        : fallbackThinking;
    return { model: target.model, thinking };
  }

  if (typeof target === "string") {
    const lastColon = target.lastIndexOf(":");
    if (lastColon !== -1) {
      const suffix = target.slice(lastColon + 1);
      if (VALID_THINKING_LEVELS.has(suffix as DelegationThinking)) {
        return {
          model: target.slice(0, lastColon),
          thinking: suffix as DelegationThinking,
        };
      }
    }
    return { model: target, thinking: fallbackThinking };
  }

  return { model: String(target), thinking: fallbackThinking };
}

export function loadSubagentModelConfig(cwd?: string): SubagentModelConfig | null {
  const filePath = findSubagentModelConfigFile(cwd);
  if (!filePath) return null;

  try {
    const stats = statSync(filePath);
    if (cachedConfig && cachedConfig.filePath === filePath && cachedConfig.mtimeMs === stats.mtimeMs) {
      return cachedConfig.data;
    }

    const content = readFileSync(filePath, "utf8");
    const rawJson = JSON.parse(content) as Record<string, unknown>;

    // Support nested configs like { "subagents": { ... } } or { "models": { ... } }
    let root = rawJson;
    for (const key of ["subagents", "models", "mappings"]) {
      const nested = rawJson[key];
      if (nested && typeof nested === "object" && !Array.isArray(nested)) {
        root = nested as Record<string, unknown>;
        break;
      }
    }

    const typedConfig: SubagentModelConfig = {};
    for (const [mainKey, subagents] of Object.entries(root)) {
      if (subagents && typeof subagents === "object" && !Array.isArray(subagents)) {
        typedConfig[mainKey] = subagents as SubagentModelMap;
      }
    }

    cachedConfig = {
      filePath,
      mtimeMs: stats.mtimeMs,
      data: typedConfig,
    };
    return typedConfig;
  } catch (error) {
    console.warn(`[subagent-model] Failed to load config from ${filePath}:`, error);
    return cachedConfig?.data ?? null;
  }
}

export function resolveSubagentModel(
  subagentName: string,
  mainModel?: { provider?: string; id?: string; name?: string } | string,
  options: ResolveSubagentModelOptions = {},
): ResolvedSubagentModel {
  const config = loadSubagentModelConfig(options.cwd);
  if (!config) {
    return {
      model: options.defaultModel,
      thinking: options.defaultThinking,
    };
  }

  // Derive candidate lookup keys for the main model
  let provider: string | undefined;
  let modelId: string | undefined;

  if (typeof mainModel === "string") {
    const withoutThinking = mainModel.replace(/:([a-z]+)$/, "");
    const slashIndex = withoutThinking.indexOf("/");
    if (slashIndex !== -1) {
      provider = withoutThinking.slice(0, slashIndex);
      modelId = withoutThinking.slice(slashIndex + 1);
    } else {
      modelId = withoutThinking;
    }
  } else if (mainModel && typeof mainModel === "object") {
    provider = mainModel.provider;
    modelId = mainModel.id;
  }

  const modelCandidates: string[] = [];
  if (provider && modelId) {
    modelCandidates.push(`${provider}/${modelId}`);
  }
  if (modelId) {
    modelCandidates.push(modelId);
  }

  // Look for matching main agent model entry in config
  let matchedSubagentMap: SubagentModelMap | undefined;

  // 1. Direct or case-insensitive match on candidate keys
  for (const candidate of modelCandidates) {
    for (const [configKey, map] of Object.entries(config)) {
      if (configKey === candidate || configKey.toLowerCase() === candidate.toLowerCase()) {
        matchedSubagentMap = map;
        break;
      }
    }
    if (matchedSubagentMap) break;
  }

  const defaultSubagentMap = config["default"] || config["*"];

  // Look for matching subagent name
  const subagentKey = subagentName.toLowerCase().trim();
  const aliasList = SUBAGENT_ALIASES[subagentKey] || [subagentKey];
  const normalizedAliases = aliasList.map(normalizeKey);
  normalizedAliases.push(normalizeKey(subagentKey));

  function findTargetInMap(subagentMap: SubagentModelMap): SubagentModelTarget | undefined {
    // 1. Exact alias match
    for (const alias of aliasList) {
      for (const [key, target] of Object.entries(subagentMap)) {
        if (key === alias || key.toLowerCase() === alias.toLowerCase()) {
          return target;
        }
      }
    }

    // 2. Normalized match (strips namespace prefix like dthongvl., ignores _ and -)
    for (const [key, target] of Object.entries(subagentMap)) {
      const normKey = normalizeKey(key);
      if (normalizedAliases.includes(normKey)) {
        return target;
      }
    }
    return undefined;
  }

  let matchedTarget: SubagentModelTarget | undefined;

  // 1. Check in specific model map
  if (matchedSubagentMap) {
    matchedTarget = findTargetInMap(matchedSubagentMap);
  }

  // 2. Fall back to default/wildcard map if not customized for this model
  if (!matchedTarget && defaultSubagentMap && defaultSubagentMap !== matchedSubagentMap) {
    matchedTarget = findTargetInMap(defaultSubagentMap);
  }

  if (!matchedTarget) {
    return {
      model: options.defaultModel,
      thinking: options.defaultThinking,
    };
  }

  const parsed = parseModelAndThinking(matchedTarget, options.defaultThinking);
  return {
    model: parsed.model,
    thinking: parsed.thinking,
  };
}

export function findRegistryModel(
  modelRegistry: {
    find(provider: string, modelId: string): any;
    getAll(): any[];
  },
  modelStr: string,
  defaultProvider: string = "google",
): any | undefined {
  if (modelStr.includes("/")) {
    const [provider, ...rest] = modelStr.split("/");
    const id = rest.join("/");
    const found = modelRegistry.find(provider, id);
    if (found) return found;
  }
  const withDefault = modelRegistry.find(defaultProvider, modelStr);
  if (withDefault) return withDefault;

  const all = modelRegistry.getAll();
  return all.find((m: any) => m.id === modelStr || m.name === modelStr);
}
