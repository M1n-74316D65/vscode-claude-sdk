import { describe, expect, test } from "bun:test";
import { registerVscodeStub, LanguageModelDataPart, LanguageModelTextPart, LanguageModelToolResultPart } from "./vscode-stub";

registerVscodeStub();
const { toTurn } = await import("../src/convert");

const USER = 1;
const png = new Uint8Array([137, 80, 78, 71]);

describe("toTurn", () => {
  test("keeps png image as base64 image block", () => {
    const turn = toTurn({ role: USER, content: [new LanguageModelDataPart(png, "image/png")], name: undefined } as never);
    expect(turn.role).toBe("user");
    expect(turn.blocks).toEqual([{ type: "image", mediaType: "image/png", data: Buffer.from(png).toString("base64") }]);
  });

  test("unsupported image type becomes a text note, not an image block", () => {
    const turn = toTurn({ role: USER, content: [new LanguageModelDataPart(png, "image/bmp")], name: undefined } as never);
    expect(turn.blocks).toEqual([{ type: "text", text: "[unsupported image: image/bmp]" }]);
  });

  test("non-image attachment is noted, not dropped", () => {
    const turn = toTurn({ role: USER, content: [new LanguageModelDataPart(png, "application/pdf")], name: undefined } as never);
    expect(turn.blocks).toEqual([{ type: "text", text: "[unsupported attachment: application/pdf]" }]);
  });

  test("non-text tool result content is noted in the result text", () => {
    const turn = toTurn({
      role: 2,
      content: [new LanguageModelToolResultPart("c1", [new LanguageModelTextPart("18C "), new LanguageModelDataPart(png, "image/png")])],
      name: undefined,
    } as never);
    expect(turn.blocks).toEqual([{ type: "tool_result", callId: "c1", text: "18C [unsupported tool result content: object]" }]);
  });
});
