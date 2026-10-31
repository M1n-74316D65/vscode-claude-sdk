export type Block =
  | { type: "text"; text: string }
  | { type: "image"; mediaType: string; data: string } // base64 payload
  | { type: "tool_call"; callId: string; name: string; input: unknown }
  | { type: "tool_result"; callId: string; text: string };

export interface Turn {
  role: "user" | "assistant";
  blocks: Block[];
}

export interface RenderedTranscript {
  text: string;
  images: Extract<Block, { type: "image" }>[];
}

// Flattens history into one prompt. Images are referenced by number and returned separately.
export function renderTranscript(turns: readonly Turn[]): RenderedTranscript {
  const images: Extract<Block, { type: "image" }>[] = [];
  const text = turns
    .map((turn) => {
      const label = turn.role === "user" ? "User" : "Assistant";
      const lines = turn.blocks.map((b) => {
        switch (b.type) {
          case "text":
            return b.text;
          case "image":
            images.push(b);
            return `[image ${images.length}]`;
          case "tool_call":
            return `Assistant called tool ${b.name} (call ${b.callId}) with ${JSON.stringify(b.input)}`;
          case "tool_result":
            return `Tool result (call ${b.callId}): ${b.text}`;
        }
      });
      return `${label}: ${lines.join("\n")}`;
    })
    .join("\n\n");
  return { text, images };
}

// Rough estimate; the SDK exposes no tokenizer.
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Claude accepts only these image types; anything else makes the whole request fail.
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// Text stand-in for content the model cannot read, so it knows something was dropped.
export function unsupported(what: string): string {
  return `[unsupported ${what}]`;
}

export function imageBlock(mediaType: string, bytes: Uint8Array): Block {
  if (!SUPPORTED_IMAGE_TYPES.includes(mediaType)) {
    return { type: "text", text: unsupported(`image: ${mediaType}`) };
  }
  return { type: "image", mediaType, data: Buffer.from(bytes).toString("base64") };
}
