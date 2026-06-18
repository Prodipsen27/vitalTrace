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

// ── Transparent Retry Decorator for Rate Limits (429) ──
const originalCreate = githubClient.chat.completions.create.bind(githubClient.chat.completions);
githubClient.chat.completions.create = async function (body: any, options: any) {
  let attempts = 0;
  const maxAttempts = 5;
  const baseDelay = 2000;

  while (attempts < maxAttempts) {
    try {
      return await originalCreate(body, options);
    } catch (error: any) {
      attempts++;
      const isRateLimit =
        error.status === 429 ||
        (error.message && error.message.includes("429")) ||
        (error.message && error.message.includes("Rate limit")) ||
        JSON.stringify(error).includes("429");

      if (isRateLimit && attempts < maxAttempts) {
        const msg = error.message || (error.error && error.error.message) || JSON.stringify(error);
        console.warn(`[GitHubModels] 429 Rate Limit hit (attempt ${attempts}/${maxAttempts}): ${msg}`);
        
        let waitTimeMs = baseDelay;
        const match = msg.match(/wait (\d+) seconds/i);
        if (match && match[1]) {
          const seconds = parseInt(match[1], 10);
          waitTimeMs = (seconds + 1) * 1000;
        } else {
          waitTimeMs = baseDelay * Math.pow(2, attempts) + Math.random() * 1000;
        }

        console.log(`[GitHubModels] Backing off for ${waitTimeMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, waitTimeMs));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retry attempts reached for GitHub Models API");
} as any;

const originalEmbed = githubClient.embeddings.create.bind(githubClient.embeddings);
githubClient.embeddings.create = async function (body: any, options: any) {
  let attempts = 0;
  const maxAttempts = 5;
  const baseDelay = 2000;

  while (attempts < maxAttempts) {
    try {
      return await originalEmbed(body, options);
    } catch (error: any) {
      attempts++;
      const isRateLimit =
        error.status === 429 ||
        (error.message && error.message.includes("429")) ||
        (error.message && error.message.includes("Rate limit")) ||
        JSON.stringify(error).includes("429");

      if (isRateLimit && attempts < maxAttempts) {
        const msg = error.message || (error.error && error.error.message) || JSON.stringify(error);
        console.warn(`[GitHubModels] 429 Rate Limit hit on embeddings (attempt ${attempts}/${maxAttempts}): ${msg}`);

        let waitTimeMs = baseDelay;
        const match = msg.match(/wait (\d+) seconds/i);
        if (match && match[1]) {
          const seconds = parseInt(match[1], 10);
          waitTimeMs = (seconds + 1) * 1000;
        } else {
          waitTimeMs = baseDelay * Math.pow(2, attempts) + Math.random() * 1000;
        }

        console.log(`[GitHubModels] Backing off for ${waitTimeMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, waitTimeMs));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retry attempts reached for GitHub Models Embeddings API");
} as any;