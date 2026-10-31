import { describe, expect, test } from "bun:test";
import { registerVscodeStub } from "./vscode-stub";

registerVscodeStub();
const { buildPrompt } = await import("../src/provider");

describe("buildPrompt", () => {
  test("text-only history stays a string prompt", () => {
    const prompt = buildPrompt([{ role: "user", blocks: [{ type: "text", text: "hi" }] }]);
    expect(prompt).toBe("User: hi");
  });

  test("images switch to one streaming user message with image source", async () => {
    const prompt = buildPrompt([
      { role: "user", blocks: [{ type: "image", mediaType: "image/png", data: "AAAA" }, { type: "text", text: "what is it" }] },
    ]);
    expect(typeof prompt).not.toBe("string");
    const messages = [];
    for await (const m of prompt as AsyncIterable<unknown>) messages.push(m);
    expect(messages).toEqual([
      {
        type: "user",
        message: {
          role: "user",
          content: [
            { type: "text", text: "User: [image 1]\nwhat is it" },
            { type: "image", source: { type: "base64", media_type: "image/png", data: "AAAA" } },
          ],
        },
        parent_tool_use_id: null,
      },
    ]);
  });
});
