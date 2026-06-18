import OpenAI from "openai";

// One client, used by all agents
// Model-agnostic — swap model name anywhere without changing this file
export const githubClient = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN!,
});

// Models available to us for free - mapped per-agent to bypass the 1req/60s rate limit on any single model
export const MODELS = {
  EXTRACTOR: "gpt-4o-mini",        // High limits, fast, excellent at structured data extraction
  ANALYZER: "DeepSeek-V3-0324",     // Detailed clinical reasoning and diagnostics
  PATTERN: "gpt-4o",               // Excellent tool-use capability for history trend mapping
  EMBED: "text-embedding-3-small",  // For RAG embeddings
} as const;