import OpenAI from 'openai';
import * as fs from 'fs';

// ── 1. Read Environment Variables from .env.local ──
let githubToken = process.env.GITHUB_TOKEN;
let googleApiKey = process.env.GOOGLE_API_KEY;
let groqApiKey = process.env.GROQ_API_KEY;
let nvidiaApiKey = process.env.NVIDIA_API_KEY;

try {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  if (!githubToken) githubToken = envContent.match(/GITHUB_TOKEN=(.+)/)?.[1]?.trim().replace(/^["']|["']$/g, '');
  if (!googleApiKey) googleApiKey = envContent.match(/GOOGLE_API_KEY=(.+)/)?.[1]?.trim().replace(/^["']|["']$/g, '');
  if (!groqApiKey) groqApiKey = envContent.match(/GROQ_API_KEY=(.+)/)?.[1]?.trim().replace(/^["']|["']$/g, '');
  if (!nvidiaApiKey) nvidiaApiKey = envContent.match(/NVIDIA_API_KEY=(.+)/)?.[1]?.trim().replace(/^["']|["']$/g, '');
} catch (err) {
  console.warn("Could not read .env.local file directly. Will fallback to process.env variables.");
}

// ── 2. Configure Clients ──
const clients = {
  github: new OpenAI({
    baseURL: 'https://models.inference.ai.azure.com',
    apiKey: githubToken || '',
  }),
  gemini: new OpenAI({
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    apiKey: googleApiKey || '',
  }),
  groq: new OpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: groqApiKey || '',
  }),
  nvidia: new OpenAI({
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKey: nvidiaApiKey || '',
  }),
};

// ── 3. Test Runner ──
async function runTests() {
  console.log("🚀 Starting Multi-LLM Connectivity Diagnostics...\n");

  // --- Test 1: GitHub Models ---
  try {
    console.log("📡 Testing GitHub Models (gpt-4o)...");
    const res = await clients.github.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Say: 'GitHub Models connected!' Briefly." }],
      max_tokens: 30,
    });
    console.log(`✅ GitHub Models: ${res.choices[0].message.content.trim()}\n`);
  } catch (err) {
    console.error(`❌ GitHub Models failed: ${err.message || err}\n`);
  }

  // --- Test 2: Gemini Chat ---
  try {
    console.log("📡 Testing Gemini Chat (models/gemini-2.5-flash)...");
    const res = await clients.gemini.chat.completions.create({
      model: "models/gemini-2.5-flash",
      messages: [{ role: "user", content: "Say: 'Gemini Chat connected!' Briefly." }],
      max_tokens: 30,
    });
    console.log(`✅ Gemini Chat: ${res.choices[0].message.content.trim()}\n`);
  } catch (err) {
    console.error(`❌ Gemini Chat failed: ${err.message || err}\n`);
  }

  // --- Test 3: Gemini Embeddings ---
  try {
    console.log("📡 Testing Gemini Embeddings (models/gemini-embedding-2 with 1536 dims)...");
    const res = await clients.gemini.embeddings.create({
      model: "models/gemini-embedding-2",
      input: "test biomarker string embedding",
      dimensions: 1536,
    });
    console.log(`✅ Gemini Embeddings: Success (Dimensions: ${res.data[0].embedding.length})\n`);
  } catch (err) {
    console.error(`❌ Gemini Embeddings failed: ${err.message || err}\n`);
  }

  // --- Test 4: Groq ---
  try {
    console.log("📡 Testing Groq (llama-3.3-70b-versatile)...");
    const res = await clients.groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "Say: 'Groq connected!' Briefly." }],
      max_tokens: 30,
    });
    console.log(`✅ Groq: ${res.choices[0].message.content.trim()}\n`);
  } catch (err) {
    console.error(`❌ Groq failed: ${err.message || err}\n`);
  }

  // --- Test 5: Nvidia ---
  try {
    console.log("📡 Testing Nvidia (nvidia/nemotron-3-ultra-550b-a55b)...");
    const res = await clients.nvidia.chat.completions.create({
      model: "nvidia/nemotron-3-ultra-550b-a55b",
      messages: [{ role: "user", content: "Say: 'Nvidia reasoning connected!' Briefly." }],
      temperature: 1,
      top_p: 0.95,
      max_tokens: 100,
      reasoning_budget: 1024,
      chat_template_kwargs: { enable_thinking: true },
    });
    console.log(`✅ Nvidia: ${res.choices[0].message.content.trim()}\n`);
  } catch (err) {
    console.error(`❌ Nvidia failed: ${err.message || err}\n`);
  }

  console.log("🏁 Connectivity Diagnostics complete.");
}

runTests();