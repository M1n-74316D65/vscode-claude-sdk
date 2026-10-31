// Pinned IDs. Verified with `claude --model <id>`. claude-fable-5-1 is left out: it needs usage credits.
export const MODELS = [
  {
    id: "claude-opus-5-5",
    name: "Claude Opus 5.5 (Agent SDK)",
    tooltip: "Long-running agentic coding and knowledge work. Default effort: medium.",
  },
  {
    id: "claude-sonnet-5-5",
    name: "Claude Sonnet 5.5 (Agent SDK)",
    tooltip: "Best balance of speed and intelligence. Default effort: high.",
  },
  {
    id: "claude-haiku-5-5",
    name: "Claude Haiku 5.5 (Agent SDK)",
    tooltip: "Fastest; high-volume, latency-sensitive tasks. Default effort: medium.",
  },
] as const;

// Official limits for all current models (platform.claude.com models overview).
export const LIMITS = { maxInputTokens: 1_000_000, maxOutputTokens: 128_000 } as const;
