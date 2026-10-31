import { describe, expect, test } from "bun:test";
import { feedbackUrl } from "../src/feedback";

const info = { extensionVersion: "0.1.0", vscodeVersion: "1.104.0", platform: "darwin", arch: "arm64" };

describe("feedbackUrl", () => {
  test("bug url prefixes title and carries metadata only", () => {
    const url = new URL(feedbackUrl("https://example.com/issues", "bug", info));
    expect(url.searchParams.get("title")).toBe("[Bug] ");
    const body = url.searchParams.get("body") ?? "";
    expect(body).toContain("- Extension: 0.1.0");
    expect(body).toContain("- Platform: darwin arm64");
    expect(body).not.toContain("/Users/");
  });

  test("feature url uses feature prefix", () => {
    const url = new URL(feedbackUrl("https://example.com/issues", "feature", info));
    expect(url.searchParams.get("title")).toBe("[Feature] ");
  });
});
