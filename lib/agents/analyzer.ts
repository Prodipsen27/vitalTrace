import { githubClient, MODELS } from "@/lib/github-models";
import { AgentState, LifestyleRecommendation } from "@/types";

// ─────────────────────────────────────────────
// TWO TOOLS — Analyzer uses 2 tools in sequence
// Tool 1: analyze_findings  → understand what's wrong
// Tool 2: generate_actions  → what to do about it
// This shows the LLM can chain multiple tool calls
// ─────────────────────────────────────────────

const ANALYZE_TOOL = {
  type: "function" as const,
  function: {
    name: "analyze_findings",
    description:
      "Analyze abnormal biomarkers and produce a patient-friendly health assessment with risk flags",
    parameters: {
      type: "object",
      properties: {
        overallStatus: {
          type: "string",
          enum: ["excellent", "good", "needs_attention", "concerning", "critical"],
          description: "Overall health status based on all biomarker findings",
        },
        summary: {
          type: "string",
          description:
            "2-3 sentence plain English summary a non-medical person can understand. Be empathetic, not alarming.",
        },
        riskFlags: {
          type: "array",
          items: { type: "string" },
          description:
            "List of findings that need prompt medical attention. Empty array if none.",
        },
        abnormalFindings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              biomarkerName: { type: "string" },
              significance: {
                type: "string",
                description: "Why this abnormal value matters for health",
              },
              possibleCauses: {
                type: "array",
                items: { type: "string" },
                description: "Common reasons this value might be abnormal",
              },
            },
            required: ["biomarkerName", "significance", "possibleCauses"],
          },
        },
        doctorQuestions: {
          type: "array",
          items: { type: "string" },
          description:
            "Specific, practical questions the patient should ask their doctor based on these findings. Max 5 questions.",
        },
      },
      required: [
        "overallStatus",
        "summary",
        "riskFlags",
        "abnormalFindings",
        "doctorQuestions",
      ],
    },
  },
};

const LIFESTYLE_TOOL = {
  type: "function" as const,
  function: {
    name: "generate_lifestyle_recommendations",
    description:
      "Generate specific, actionable lifestyle recommendations based on the abnormal biomarker findings",
    parameters: {
      type: "object",
      properties: {
        recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: ["diet", "exercise", "sleep", "stress", "medication"],
              },
              suggestion: {
                type: "string",
                description:
                  "Specific, actionable suggestion. Not generic advice. Tied directly to the findings.",
              },
              priority: {
                type: "string",
                enum: ["high", "medium", "low"],
                description:
                  "High = address within days, Medium = address this week, Low = general improvement",
              },
              relatedBiomarker: {
                type: "string",
                description: "Which biomarker this recommendation addresses",
              },
            },
            required: ["category", "suggestion", "priority", "relatedBiomarker"],
          },
        },
      },
      required: ["recommendations"],
    },
  },
};

// ─────────────────────────────────────────────
// THE ANALYZER AGENT
// Input:  AgentState with biomarkers
// Output: summary, riskFlags, doctorQuestions, lifestyle
// ─────────────────────────────────────────────
export async function runAnalyzerAgent(
  state: AgentState
): Promise<Partial<AgentState>> {
  console.log("🧪 [AnalyzerAgent] Starting...");

  const biomarkers = state.biomarkers || [];
  const abnormal = biomarkers.filter((b) => b.status !== "normal");
  const critical = biomarkers.filter((b) => b.status === "critical");

  console.log(
    `📊 [AnalyzerAgent] ${biomarkers.length} total, ${abnormal.length} abnormal, ${critical.length} critical`
  );

  // Build the message context
  const messages: any[] = [
    {
      role: "system",
      content: `You are a clinical health educator — not a doctor, but deeply knowledgeable about lab values and what they mean for everyday health.

Your role:
- Explain findings in plain English that a non-medical person understands
- Be empathetic and calm — never alarmist
- Be specific — generic advice is useless
- Always recommend consulting a doctor for medical decisions
- Frame everything as educational, not diagnostic

IMPORTANT: You must call BOTH tools:
1. First call analyze_findings
2. Then call generate_lifestyle_recommendations`,
    },
    {
      role: "user",
      content: `Analyze these health report findings:

ALL BIOMARKERS (${biomarkers.length} total):
${biomarkers
  .map(
    (b) =>
      `- ${b.name}: ${b.value} ${b.unit} → ${b.status.toUpperCase()} (ref: ${b.referenceRange})`
  )
  .join("\n")}

ABNORMAL VALUES (${abnormal.length}):
${abnormal.map((b) => `- ${b.name}: ${b.value} ${b.unit} [${b.status}]`).join("\n") || "None"}

CRITICAL VALUES: ${critical.map((b) => b.name).join(", ") || "None"}

First call analyze_findings, then call generate_lifestyle_recommendations.`,
    },
  ];

  let summary = "";
  let riskFlags: string[] = [];
  let doctorQuestions: string[] = [];
  let lifestyle: LifestyleRecommendation[] = [];
  let toolsCompleted = 0;

  // ─────────────────────────────────────────
  // AGENTIC LOOP
  // This time the LLM will call TWO tools in sequence
  // Notice how the same loop pattern handles multiple tools
  // ─────────────────────────────────────────
  let iterations = 0;
  const MAX_ITERATIONS = 8;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    console.log(`🔄 [AnalyzerAgent] Iteration ${iterations}, tools done: ${toolsCompleted}/2`);

    const response = await githubClient.chat.completions.create({
      model: MODELS.ANALYZER,
      messages,
      tools: [ANALYZE_TOOL, LIFESTYLE_TOOL],
      // "auto" = LLM decides which tool to call and when
      // vs "required" = must call a tool
      tool_choice: toolsCompleted < 2 ? "auto" : "none",
      max_tokens: 4096,
    });

    const message = response.choices[0].message;
    const stopReason = response.choices[0].finish_reason;

    console.log(`📊 [AnalyzerAgent] Stop reason: ${stopReason}`);

    // ── Tool calls ──────────────────────────────────────────
    if (stopReason === "tool_calls" && message.tool_calls) {
      messages.push(message);

      for (const toolCall of message.tool_calls) {
        const tc = toolCall as any;
        const args = JSON.parse(tc.function.arguments);
        console.log(`🔧 [AnalyzerAgent] Tool: ${tc.function.name}`);

        // ── Tool 1: analyze_findings ──────────────────────
        if (tc.function.name === "analyze_findings") {
          summary = args.summary;
          riskFlags = args.riskFlags || [];
          doctorQuestions = args.doctorQuestions || [];
          toolsCompleted++;

          console.log(`✅ [AnalyzerAgent] Analysis done. Status: ${args.overallStatus}`);
          console.log(`🚩 [AnalyzerAgent] Risk flags: ${riskFlags.length}`);

          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({
              success: true,
              message: "Analysis recorded. Now call generate_lifestyle_recommendations.",
            }),
          });
        }

        // ── Tool 2: generate_lifestyle_recommendations ────
        if (tc.function.name === "generate_lifestyle_recommendations") {
          lifestyle = args.recommendations || [];
          toolsCompleted++;

          console.log(
            `✅ [AnalyzerAgent] Lifestyle recommendations: ${lifestyle.length}`
          );

          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({
              success: true,
              message: "Recommendations recorded.",
            }),
          });
        }
      }

      // Both tools done — exit loop
      if (toolsCompleted >= 2) {
        console.log("✅ [AnalyzerAgent] Both tools complete");
        break;
      }
    }

    // ── LLM finished naturally ──────────────────────────
    if (stopReason === "stop") {
      console.log("✅ [AnalyzerAgent] LLM stopped");
      break;
    }
  }

  return {
    summary,
    riskFlags,
    doctorQuestions,
    lifestyle,
    currentStep: "pattern_detection",
  };
}