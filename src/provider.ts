import * as vscode from "vscode";
import { randomUUID } from "node:crypto";
import type { SDKUserMessage } from "@anthropic-ai/claude-agent-sdk" with { "resolution-mode": "import" };
import { LIMITS, MODELS } from "./models";
import { toTurn } from "./convert";
import { toShape } from "./schema";
import { estimateTokens, renderTranscript, type Turn } from "./transcript";

export interface ProviderSettings {
  claudePath: string;
  effort: string; // "" = model default
}

interface PendingToolCall {
  callId: string;
  name: string;
  input: unknown;
}

type Sdk = typeof import("@anthropic-ai/claude-agent-sdk", { with: { "resolution-mode": "import" } });

export class ClaudeAgentProvider implements vscode.LanguageModelChatProvider {
  private readonly changed = new vscode.EventEmitter<void>();
  // Fired to make Copilot call provideLanguageModelChatInformation again.
  readonly onDidChangeLanguageModelChatInformation = this.changed.event;

  constructor(
    private readonly workDir: string,
    private readonly log: vscode.LogOutputChannel,
    private readonly settings: () => ProviderSettings,
  ) {}

  refreshModels(): void {
    this.changed.fire();
  }

  dispose(): void {
    this.changed.dispose();
  }

  async provideLanguageModelChatInformation(): Promise<vscode.LanguageModelChatInformation[]> {
    return MODELS.map((m) => ({
      id: m.id,
      name: m.name,
      family: "claude",
      version: "5.5",
      tooltip: m.tooltip,
      detail: "Claude Agent SDK",
      maxInputTokens: LIMITS.maxInputTokens,
      maxOutputTokens: LIMITS.maxOutputTokens,
      capabilities: { toolCalling: true, imageInput: true },
    }));
  }

  async provideLanguageModelChatResponse(
    model: vscode.LanguageModelChatInformation,
    messages: readonly vscode.LanguageModelChatRequestMessage[],
    options: vscode.ProvideLanguageModelChatResponseOptions,
    progress: vscode.Progress<vscode.LanguageModelResponsePart>,
    token: vscode.CancellationToken,
  ): Promise<void> {
    const settings = this.settings();
    const prompt = buildPrompt(messages.map(toTurn));

    // ESM-only SDK: lazy import keeps extension activation cheap and works from CommonJS output.
    const sdk: Sdk = await import("@anthropic-ai/claude-agent-sdk");

    // Copilot tools become in-process MCP tools. Calling one ends the turn; Copilot runs it and sends the result back.
    const pending: PendingToolCall[] = [];
    const abortController = new AbortController();
    const copilotTools = options.tools ?? [];
    const sdkTools = toSdkTools(sdk, copilotTools, (call) => {
      pending.push(call);
      abortController.abort();
    });
    const requireTool = options.toolMode === vscode.LanguageModelChatToolMode.Required;

    const cancel = token.onCancellationRequested(() => abortController.abort());
    try {
      for await (const msg of sdk.query({
        prompt,
        options: {
          model: model.id,
          pathToClaudeCodeExecutable: settings.claudePath,
          cwd: this.workDir,
          tools: [], // no built-in Read/Bash/Edit; only Copilot tools below
          settingSources: [], // isolate from user and project settings files
          ...(settings.effort ? { effort: settings.effort as "low" } : {}),
          ...(requireTool ? { systemPrompt: "You must call one of the provided tools before answering." } : {}),
          ...(sdkTools.length > 0
            ? {
                mcpServers: { copilot: sdk.createSdkMcpServer({ name: "copilot", tools: sdkTools }) },
                allowedTools: copilotTools.map((t) => `mcp__copilot__${t.name}`),
                maxTurns: 2,
              }
            : { maxTurns: 1 }),
          includePartialMessages: true,
          abortController,
          env: { ...process.env }, // custom env replaces the subprocess env; keep PATH and any ANTHROPIC_API_KEY
        },
      })) {
        if (msg.type === "stream_event" && msg.event.type === "content_block_delta" && msg.event.delta.type === "text_delta") {
          progress.report(new vscode.LanguageModelTextPart(msg.event.delta.text));
        } else if (msg.type === "result" && (msg.subtype !== "success" || msg.is_error)) {
          throw new Error(`Claude Agent SDK turn failed: ${msg.subtype}`);
        }
      }
    } catch (err) {
      // Our own abort after a tool call is the normal end of that turn.
      const delegated = pending.length > 0 && abortController.signal.aborted;
      if (!delegated) {
        if (!token.isCancellationRequested) {
          this.log.error("Request failed", err instanceof Error ? err.name : "unknown");
        }
        throw err;
      }
    } finally {
      cancel.dispose();
    }

    for (const call of pending) {
      progress.report(new vscode.LanguageModelToolCallPart(call.callId, call.name, call.input as object));
    }
  }

  async provideTokenCount(
    _model: vscode.LanguageModelChatInformation,
    text: string | vscode.LanguageModelChatRequestMessage,
  ): Promise<number> {
    if (typeof text === "string") {
      return estimateTokens(text);
    }
    return estimateTokens(renderTranscript([toTurn(text)]).text);
  }
}

// Images go in a single streaming user message; plain text stays a string prompt.
export function buildPrompt(turns: readonly Turn[]): string | AsyncIterable<SDKUserMessage> {
  const { text, images } = renderTranscript(turns);
  if (images.length === 0) return text;
  return (async function* () {
    yield {
      type: "user",
      message: {
        role: "user",
        content: [
          { type: "text", text },
          ...images.map((i) => ({ type: "image", source: { type: "base64", media_type: i.mediaType, data: i.data } })),
        ],
      },
      parent_tool_use_id: null,
    } as SDKUserMessage;
  })();
}

function toSdkTools(
  sdk: Sdk,
  copilotTools: readonly vscode.LanguageModelChatTool[],
  onCall: (call: PendingToolCall) => void,
) {
  return copilotTools.map((t) =>
    sdk.tool(
      t.name,
      t.description,
      toShape((t.inputSchema ?? { type: "object", properties: {} }) as Parameters<typeof toShape>[0]),
      async (args) => {
        onCall({ callId: randomUUID(), name: t.name, input: args });
        return { content: [{ type: "text", text: "Delegated to host." }] };
      },
    ),
  );
}
