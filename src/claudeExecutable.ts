import { statSync } from "node:fs";
import * as path from "node:path";

// Returns the first candidate under a PATH directory that is a regular file, or undefined.
export function findOnPath(
  name: string,
  pathEnv: string | undefined,
  platform: NodeJS.Platform,
): string | undefined {
  const exts = platform === "win32" ? ["", ".exe", ".cmd"] : [""];
  for (const dir of (pathEnv ?? "").split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      const candidate = path.join(dir, name + ext);
      try {
        if (statSync(candidate).isFile()) return candidate;
      } catch {
        // not present in this directory
      }
    }
  }
  return undefined;
}

// Explicit setting wins; otherwise search PATH for a Claude Code install.
export function resolveClaudeExecutable(
  configured: string,
  pathEnv: string | undefined,
  platform: NodeJS.Platform,
): string {
  const explicit = configured.trim();
  if (explicit) return explicit;
  const found = findOnPath("claude", pathEnv, platform);
  if (!found) {
    throw new Error(
      "Claude Code executable not found. Install Claude Code or set claudeAgentLm.claudeExecutablePath.",
    );
  }
  return found;
}
