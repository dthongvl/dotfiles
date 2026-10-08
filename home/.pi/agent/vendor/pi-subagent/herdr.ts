import { spawnSync } from "node:child_process";

type HerdrResult = {
  pane?: { pane_id: string };
  layout?: { panes: Array<{ pane_id: string; rect: { width: number; height: number } }> };
};

/** Herdr is scoped by the caller's inherited socket/session environment. */
export function herdr(args: string[]): HerdrResult {
  if (process.env.HERDR_ENV !== "1" || !process.env.HERDR_PANE_ID)
    throw new Error("Herdr subagents require a Herdr-managed parent pane.");
  const result = spawnSync("herdr", args, { encoding: "utf8", timeout: 10_000 });
  let response: { result?: HerdrResult; error?: { code?: string; message?: string } } | undefined;
  try { response = JSON.parse(result.stdout || result.stderr); } catch { /* Report transport errors below. */ }
  if (result.error || result.status !== 0 || response?.error) {
    const error = new Error(response?.error?.message || result.error?.message || result.stderr.trim() || "Herdr command failed");
    Object.assign(error, { code: response?.error?.code });
    throw error;
  }
  // pane run acknowledges successful delivery with exit status only.
  if (!result.stdout.trim() && args[0] === "pane" && args[1] === "run") return {};
  if (!response?.result) throw new Error("Herdr returned no result.");
  return response.result;
}

export function paneExists(paneId?: string): boolean {
  if (!paneId) return false;
  try {
    return herdr(["pane", "get", paneId]).pane?.pane_id === paneId;
  } catch (error) {
    if ((error as { code?: string }).code === "pane_not_found") return false;
    // A disconnected server is not proof that the child has exited.
    throw error;
  }
}

export function closePane(paneId?: string): void {
  if (!paneId) return;
  try { herdr(["pane", "close", paneId]); }
  catch (error) {
    if ((error as { code?: string }).code !== "pane_not_found") throw error;
  }
}

export function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}
