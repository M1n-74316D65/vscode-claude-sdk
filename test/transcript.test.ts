import { describe, expect, test } from "bun:test";
import { estimateTokens, renderTranscript } from "../src/transcript";

describe("renderTranscript", () => {
  test("labels turns and keeps order", () => {
    const { text, images } = renderTranscript([
      { role: "user", blocks: [{ type: "text", text: "hi" }] },
      { role: "assistant", blocks: [{ type: "text", text: "hello" }] },
    ]);
    expect(text).toBe("User: hi\n\nAssistant: hello");
    expect(images).toEqual([]);
  });

  test("renders tool call and result with call id", () => {
    const { text } = renderTranscript([
      { role: "assistant", blocks: [{ type: "tool_call", callId: "c1", name: "read", input: { path: "a" } }] },
      { role: "user", blocks: [{ type: "tool_result", callId: "c1", text: "ok" }] },
    ]);
    expect(text).toBe('Assistant: Assistant called tool read (call c1) with {"path":"a"}\n\nUser: Tool result (call c1): ok');
  });

  test("images are numbered and returned separately", () => {
    const { text, images } = renderTranscript([
      { role: "user", blocks: [{ type: "image", mediaType: "image/png", data: "AAA" }, { type: "text", text: "what is it" }] },
    ]);
    expect(text).toBe("User: [image 1]\nwhat is it");
    expect(images).toEqual([{ type: "image", mediaType: "image/png", data: "AAA" }]);
  });
});

describe("estimateTokens", () => {
  test("rounds up at four chars per token", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("abcde")).toBe(2);
  });
});
