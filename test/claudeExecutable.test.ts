import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { findOnPath, resolveClaudeExecutable } from "../src/claudeExecutable";

const dir = mkdtempSync(path.join(os.tmpdir(), "claude-path-"));
const bin = path.join(dir, "claude");
writeFileSync(bin, "");

describe("findOnPath", () => {
  test("finds the binary in a PATH directory", () => {
    expect(findOnPath("claude", `/nonexistent${path.delimiter}${dir}`, "darwin")).toBe(bin);
  });

  test("returns undefined when absent or PATH unset", () => {
    expect(findOnPath("claude", "/nonexistent", "darwin")).toBeUndefined();
    expect(findOnPath("claude", undefined, "darwin")).toBeUndefined();
  });
});

describe("resolveClaudeExecutable", () => {
  test("explicit setting wins over PATH", () => {
    expect(resolveClaudeExecutable("  /opt/x/claude  ", dir, "darwin")).toBe("/opt/x/claude");
  });

  test("falls back to PATH when setting empty", () => {
    expect(resolveClaudeExecutable("", dir, "darwin")).toBe(bin);
  });

  test("throws actionable error when nothing found", () => {
    expect(() => resolveClaudeExecutable("", "/nonexistent", "darwin")).toThrow(
      "claudeAgentLm.claudeExecutablePath",
    );
  });
});
