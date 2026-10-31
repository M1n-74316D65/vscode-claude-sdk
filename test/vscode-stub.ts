// Minimal stand-in for the vscode module. Tests register it with mock.module before importing src.
import { mock } from "bun:test";

export class LanguageModelTextPart {
  constructor(public value: string) {}
}
export class LanguageModelDataPart {
  constructor(public data: Uint8Array, public mimeType: string) {}
}
export class LanguageModelToolCallPart {
  constructor(public callId: string, public name: string, public input: object) {}
}
export class LanguageModelToolResultPart {
  constructor(public callId: string, public content: unknown[]) {}
}

export function registerVscodeStub(): void {
  mock.module("vscode", () => ({
    LanguageModelTextPart,
    LanguageModelDataPart,
    LanguageModelToolCallPart,
    LanguageModelToolResultPart,
    LanguageModelChatMessageRole: { User: 1, Assistant: 2 },
    LanguageModelChatToolMode: { Auto: 1, Required: 2 },
    EventEmitter: class {
      event = () => ({ dispose() {} });
      fire() {}
      dispose() {}
    },
  }));
}
