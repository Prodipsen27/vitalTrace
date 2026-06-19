import OpenAI from "openai";

// 1. Initialize Clients for each Provider
export const githubClient = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN!,
});

export const geminiClient = new OpenAI({
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey: process.env.GOOGLE_API_KEY!,
});

export const groqClient = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY || "dummy", // Fallback to prevent startup crashes if key is empty initially
});

export const nvidiaClient = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY || "dummy",
});

// 2. Define Model Constants
export const MODELS = {
  EXTRACTOR: "nvidia/nemotron-3-ultra-550b-a55b", // Nvidia
  ANALYZER: "llama-3.3-70b-specdec",                   // Groq
  PATTERN: "gpt-4o",                                   // GitHub Models
  EMBED: "text-embedding-3-small",                     // GitHub Models (Embeddings)
} as const;

// 3. Helper to wrap a client's chat.completions.create with transparent 429 retry logic
function decorateChatClient(client: OpenAI, providerName: string) {
  const originalCreate = client.chat.completions.create.bind(client.chat.completions);
  client.chat.completions.create = async function (body: any, options: any) {
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
          console.warn(`[${providerName}] 429 Rate Limit hit (attempt ${attempts}/${maxAttempts}): ${msg}`);
          
          let waitTimeMs = baseDelay;
          const match = msg.match(/wait (\d+) seconds/i);
          if (match && match[1]) {
            const seconds = parseInt(match[1], 10);
            waitTimeMs = (seconds + 1) * 1000;
          } else {
            waitTimeMs = baseDelay * Math.pow(2, attempts) + Math.random() * 1000;
          }

          console.log(`[${providerName}] Backing off for ${waitTimeMs / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, waitTimeMs));
          continue;
        }
        throw error;
      }
    }
    throw new Error(`Max retry attempts reached for ${providerName} API`);
  } as any;
}

// Decorate the chat clients
decorateChatClient(githubClient, "GitHubModels");
decorateChatClient(geminiClient, "Gemini");
decorateChatClient(groqClient, "Groq");
decorateChatClient(nvidiaClient, "Nvidia");

// 4. Decorate embeddings client (specifically for githubClient)
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
