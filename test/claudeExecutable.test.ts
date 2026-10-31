import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fallbackLocations, findOnPath, resolveClaudeExecutable } from "../src/claudeExecutable";

const dir = mkdtempSync(path.join(os.tmpdir(), "claude-path-"));
const bin = path.join(dir, "claude");
writeFileSync(bin, "");

const winDir = mkdtempSync(path.join(os.tmpdir(), "claude-win-"));
const shim = path.join(winDir, "claude"); // npm shell shim, not runnable on Windows
const exe = path.join(winDir, "claude.exe");
writeFileSync(shim, "");
writeFileSync(exe, "");

describe("findOnPath", () => {
  test("finds the binary in a PATH directory", () => {
    expect(findOnPath(`/nonexistent${path.delimiter}${dir}`, "darwin")).toBe(bin);
  });

  test("returns undefined when absent or PATH unset", () => {
    expect(findOnPath("/nonexistent", "darwin")).toBeUndefined();
    expect(findOnPath(undefined, "darwin")).toBeUndefined();
  });

  test("win32 picks claude.exe, not the extensionless shim", () => {
    expect(findOnPath(winDir, "win32")).toBe(exe);
  });
});

describe("fallbackLocations", () => {
  test("win32 lists WinGet Links and ~/.local/bin", () => {
    expect(fallbackLocations("win32", { localAppData: "C:\\L", home: "C:\\H" })).toEqual([
      path.join("C:\\L", "Microsoft", "WinGet", "Links", "claude.exe"),
      path.join("C:\\H", ".local", "bin", "claude.exe"),
    ]);
  });

  test("posix uses ~/.local/bin/claude", () => {
    expect(fallbackLocations("linux", { home: "/home/u" })).toEqual([path.join("/home/u", ".local", "bin", "claude")]);
  });
});

describe("resolveClaudeExecutable", () => {
  test("explicit setting wins over PATH", () => {
    expect(resolveClaudeExecutable("  /opt/x/claude  ", dir, "darwin")).toBe("/opt/x/claude");
  });

  test("falls back to PATH when setting empty", () => {
    expect(resolveClaudeExecutable("", dir, "darwin")).toBe(bin);
  });

  test("uses install location when PATH is stale", () => {
    const home = mkdtempSync(path.join(os.tmpdir(), "claude-home-"));
    mkdirSync(path.join(home, ".local", "bin"), { recursive: true });
    const local = path.join(home, ".local", "bin", "claude");
    writeFileSync(local, "");
    expect(resolveClaudeExecutable("", "/nonexistent", "darwin", { home })).toBe(local);
  });

  test("throws actionable error when nothing found", () => {
    const home = mkdtempSync(path.join(os.tmpdir(), "claude-empty-"));
    expect(() => resolveClaudeExecutable("", "/nonexistent", "darwin", { home })).toThrow("claudeAgentLm.claudeExecutablePath");
  });
});
