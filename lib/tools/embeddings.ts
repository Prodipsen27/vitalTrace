import { geminiClient, MODELS } from "@/lib/github-models";

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await geminiClient.embeddings.create({
    model: MODELS.EMBED,
    input: text,
    dimensions: 1536,
  } as any);
  return response.data[0].embedding;
} 