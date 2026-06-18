import { githubClient, MODELS } from "@/lib/github-models";

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await githubClient.embeddings.create({
    model: MODELS.EMBED,
    input: text,
  });
  return response.data[0].embedding;
} 