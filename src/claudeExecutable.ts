import { statSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

function isFile(p: string): boolean {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

// Returns the first `claude` binary found under a PATH directory, or undefined.
// Windows: only .exe is runnable here. An extensionless `claude` is the npm shell shim.
export function findOnPath(pathEnv: string | undefined, platform: NodeJS.Platform): string | undefined {
  const names = platform === "win32" ? ["claude.exe"] : ["claude"];
  for (const dir of (pathEnv ?? "").split(path.delimiter)) {
    if (!dir) continue;
    for (const name of names) {
      const candidate = path.join(dir, name);
      if (isFile(candidate)) return candidate;
    }
  }
  return undefined;
}

// Install locations used when PATH is stale (VS Code started before the install).
// Windows winget: WinGet\Links is the portable-command link dir; ~/.local/bin is the native installer target.
export function fallbackLocations(platform: NodeJS.Platform, env: { localAppData?: string; home: string }): string[] {
  if (platform === "win32") {
    return [
      ...(env.localAppData ? [path.join(env.localAppData, "Microsoft", "WinGet", "Links", "claude.exe")] : []),
      path.join(env.home, ".local", "bin", "claude.exe"),
    ];
  }
  return [path.join(env.home, ".local", "bin", "claude")];
}

// Explicit setting wins; then PATH; then known install locations.
export function resolveClaudeExecutable(
  configured: string,
  pathEnv: string | undefined,
  platform: NodeJS.Platform,
  env: { localAppData?: string; home?: string } = {},
): string {
  const explicit = configured.trim();
  if (explicit) return explicit;
  const found =
    findOnPath(pathEnv, platform) ??
    fallbackLocations(platform, { localAppData: env.localAppData, home: env.home ?? os.homedir() }).find(isFile);
  if (!found) {
    throw new Error(
      "Claude Code executable not found. Install Claude Code (winget install Anthropic.ClaudeCode on Windows) or set claudeAgentLm.claudeExecutablePath.",
    );
  }
  return found;
}
