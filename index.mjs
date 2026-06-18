// index.mjs
import OpenAI from "openai";
import * as fs from "fs";

// Read .env.local manually for this test script
let token = process.env.GITHUB_TOKEN;
if (!token) {
  try {
    const envFile = fs.readFileSync(".env.local", "utf-8");
    token = envFile.match(/GITHUB_TOKEN=(.+)/)?.[1]?.trim().replace(/^["']|["']$/g, "");
  } catch (err) {
    console.error("Could not read .env.local file. Please check GITHUB_TOKEN environment variable.");
  }
}

if (!token) {
  console.error("GITHUB_TOKEN is required. Please set it in .env.local.");
  process.exit(1);
}

const client = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: token,
});

async function main() {
  console.log("Testing connection to GitHub Models (using gpt-4o)...");
  try {
    const response = await client.chat.completions.create({
      model: "DeepSeek-V3-0324",
      messages: [
        {
          role: "user",
          content: "Say: VitalTrace is ready. Nothing else.",
        },
      ],
      max_tokens: 20,
    });

    console.log("✅ GitHub Models connected successfully!");
    console.log("Response:", response.choices[0].message.content.trim());
  } catch (error) {
    console.error("❌ Connection failed:", error.message || error);
  }
}

main();
