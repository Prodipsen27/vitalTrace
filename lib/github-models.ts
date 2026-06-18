import OpenAI from "openai";

// One client, used by all agents
// Model-agnostic — swap model name anywhere without changing this file
export const githubClient = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN!,
});

// Models available to us for free
export const MODELS = {
  SMART: "DeepSeek-V3-0324",              // Best quality — use for agents
  FAST: "gpt-4o-mini",          // Faster + cheaper — use for simple tasks
  EMBED: "text-embedding-3-small", // For RAG embeddings
} as const;