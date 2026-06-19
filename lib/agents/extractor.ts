import { nvidiaClient, MODELS } from "@/lib/github-models";
import { Biomarker, AgentState } from "@/types";

// ─────────────────────────────────────────────
// TOOL DEFINITION
// This is the "function" we're giving the LLM.
// The LLM reads this schema and decides when + how to call it.
// Think of it like a TypeScript interface — but for the AI.
// ─────────────────────────────────────────────
const EXTRACT_TOOL = {
  type: "function" as const,
  function: {
    name: "extract_biomarkers",
    description:
      "Extract ALL biomarker and lab values from a health report into structured JSON. Include every measurable value found in the report.",
    parameters: {
      type: "object",
      properties: {
        biomarkers: {
          type: "array",
          description: "Array of all biomarkers found in the report",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Full name e.g. Hemoglobin, Fasting Glucose, TSH",
              },
              value: {
                type: "number",
                description: "The numeric value",
              },
              unit: {
                type: "string",
                description: "Unit e.g. g/dL, mg/dL, IU/L, %",
              },
              referenceRange: {
                type: "string",
                description: "Reference range as string e.g. 13.0-17.0",
              },
              referenceMin: {
                type: "number",
                description: "Lower bound of reference range",
              },
              referenceMax: {
                type: "number",
                description: "Upper bound of reference range",
              },
              status: {
                type: "string",
                enum: ["normal", "high", "low", "critical"],
                description:
                  "Status based on comparison with reference range. Critical = dangerously out of range.",
              },
              category: {
                type: "string",
                description:
                  "Category e.g. Blood Count, Metabolic Panel, Lipids, Thyroid, Liver Function, Kidney Function",
              },
            },
            required: ["name", "value", "unit", "status", "category"],
          },
        },
        reportDate: {
          type: "string",
          description: "Date of the report if found, in YYYY-MM-DD format",
        },
      },
      required: ["biomarkers"],
    },
  },
};

// ─────────────────────────────────────────────
// THE EXTRACTOR AGENT
// Takes raw report text → returns structured biomarkers
// Uses the agentic loop pattern with tool calling
// ─────────────────────────────────────────────
export async function runExtractorAgent(
  state: AgentState
): Promise<Partial<AgentState>> {
  console.log("🔍 [ExtractorAgent] Starting...");

  // Message history — this grows as the agent thinks
  const messages: any[] = [
    {
      role: "system",
      content: `You are a medical data extraction specialist. 
Your job is to extract every single biomarker and lab value from health reports.
Be thorough — never skip a value. 
Determine status (normal/high/low/critical) by comparing the value against the reference range.
If no reference range is given, use standard medical reference ranges.
Always call the extract_biomarkers tool with your findings.`,
    },
    {
      role: "user",
      content: `Extract all biomarkers from this health report:\n\n${state.reportText}`,
    },
  ];

  let biomarkers: Biomarker[] = [];

  // ─────────────────────────────────────────
  // THE AGENTIC LOOP
  // Keeps running until LLM says it's done
  // ─────────────────────────────────────────
  let iterations = 0;
  const MAX_ITERATIONS = 5; // Safety limit — prevent infinite loops

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    console.log(`🔄 [ExtractorAgent] Loop iteration ${iterations}`);

    const response = await nvidiaClient.chat.completions.create({
      model: MODELS.EXTRACTOR,
      messages,
      tools: [EXTRACT_TOOL],
      tool_choice: "required",
      temperature: 1,
      top_p: 0.95,
      max_tokens: 16384,
      reasoning_budget: 4096, // 4096 is optimal for thorough clinical data extraction
      chat_template_kwargs: { enable_thinking: true }
    } as any);

    const message = response.choices[0].message;
    const stopReason = response.choices[0].finish_reason;

    console.log(`📊 [ExtractorAgent] Stop reason: ${stopReason}`);

    // ── Case 1: LLM wants to call a tool ──────────────────
    if (stopReason === "tool_calls" && message.tool_calls) {
      // Add the LLM's response to message history
      messages.push(message);

      // Process each tool call (usually just one here)
      for (const toolCall of message.tool_calls) {
        const tc = toolCall as any;
        console.log(`🔧 [ExtractorAgent] Tool called: ${tc.function.name}`);

        if (tc.function.name === "extract_biomarkers") {
          // Parse the JSON arguments the LLM filled in
          const args = JSON.parse(tc.function.arguments);

          // Add unique IDs to each biomarker
          biomarkers = args.biomarkers.map(
            (b: Omit<Biomarker, "id">, i: number) => ({
              ...b,
              id: `bm-${i}-${Date.now()}`,
              referenceRange: b.referenceRange || "N/A",
            })
          );

          console.log(
            `✅ [ExtractorAgent] Extracted ${biomarkers.length} biomarkers`
          );

          // Send tool result back to LLM
          // This closes the loop — LLM now knows the tool ran
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({
              success: true,
              count: biomarkers.length,
              biomarkers,
            }),
          });
        }
      }

      // If we have biomarkers, we're done — no need to loop again
      if (biomarkers.length > 0) break;
    }

    // ── Case 2: LLM is done (no more tool calls) ──────────
    if (stopReason === "stop") {
      console.log("✅ [ExtractorAgent] LLM finished");
      break;
    }
  }

  if (biomarkers.length === 0) {
    console.warn("⚠️ [ExtractorAgent] No biomarkers found");
  }

  // Return partial state — orchestrator will merge this
  return {
    biomarkers,
    currentStep: "analyzing",
  };
}