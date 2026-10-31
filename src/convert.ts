import * as vscode from "vscode";
import { imageBlock, unsupported, type Block, type Turn } from "./transcript";

// Copilot message -> plain turn. Anything the model cannot read becomes a text note, never silently dropped.
export function toTurn(m: vscode.LanguageModelChatRequestMessage): Turn {
  const blocks: Block[] = [];
  for (const part of m.content) {
    if (part instanceof vscode.LanguageModelTextPart) {
      blocks.push({ type: "text", text: part.value });
    } else if (part instanceof vscode.LanguageModelDataPart) {
      blocks.push(
        part.mimeType.startsWith("image/")
          ? imageBlock(part.mimeType, part.data)
          : { type: "text", text: unsupported(`attachment: ${part.mimeType}`) },
      );
    } else if (part instanceof vscode.LanguageModelToolCallPart) {
      blocks.push({ type: "tool_call", callId: part.callId, name: part.name, input: part.input });
    } else if (part instanceof vscode.LanguageModelToolResultPart) {
      const text = part.content
        .map((c) => (c instanceof vscode.LanguageModelTextPart ? c.value : unsupported(`tool result content: ${typeof c}`)))
        .join("");
      blocks.push({ type: "tool_result", callId: part.callId, text });
    }
  }
  return {
    role: m.role === vscode.LanguageModelChatMessageRole.User ? "user" : "assistant",
    blocks,
  };
}
