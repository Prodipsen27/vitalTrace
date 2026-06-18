import { githubClient, MODELS } from "@/lib/github-models";
import { AgentState, TrendInsight } from "@/types";
import { generateEmbedding } from "@/lib/tools/embeddings";
import { searchBiomarkerHistory } from "@/lib/supabase/server";

export async function runPatternAgent(
  state: AgentState
): Promise<Partial<AgentState>> {
  console.log("📈 [PatternAgent] Starting RAG search...");

  // We only search history for abnormal biomarkers because these represent clinical deviations 
  // that may pose potential health risks. Normal values are expected to stay stable and 
  // usually don't signal underlying health risks or require medical explanation or actionable trends, 
  // whereas tracking the historical trajectory (improving, worsening, or stable) of abnormal values 
  // is crucial for clinical decision support and identifying health progressions.
  const abnormal = (state.biomarkers || []).filter((b) => b.status !== "normal");

  // If no abnormal biomarkers exist, we can't search history/trends for them.
  if (abnormal.length === 0) {
    return { trends: [], currentStep: "complete" };
  }

  const historyMap: Record<string, any[]> = {};

  for (const biomarker of abnormal) {
    try {
      const textToEmbed = `${biomarker.name} ${biomarker.value} ${biomarker.unit} ${biomarker.status}`;
      const embedding = await generateEmbedding(textToEmbed);
      const readings = await searchBiomarkerHistory(
        state.patientId,
        biomarker.name,
        embedding
      );
      // We need at least 2 readings (current + past) to analyze a trend.
      if (readings && readings.length > 1) {
        historyMap[biomarker.name] = readings;
      }
    } catch (err) {
      console.error(`Error processing history for biomarker ${biomarker.name}:`, err);
    }
  }

  // If no history found for any abnormal biomarkers — this is the patient's first report with these abnormals
  if (Object.keys(historyMap).length === 0) {
    console.log("📈 [PatternAgent] No history found — first report with these abnormal biomarkers");
    return { trends: [], currentStep: "complete" };
  }

  const TREND_TOOL = {
    type: "function" as const,
    function: {
      name: "analyze_trends",
      description: "Record analyzed trend insights for abnormal biomarkers based on historical data.",
      parameters: {
        type: "object",
        properties: {
          trends: {
            type: "array",
            description: "List of analyzed trends for each biomarker with sufficient history",
            items: {
              type: "object",
              properties: {
                biomarkerName: { type: "string" },
                direction: {
                  type: "string",
                  enum: ["improving", "worsening", "stable"],
                },
                message: {
                  type: "string",
                  description: "A patient-friendly, empathetic message describing the trend over time (e.g., 'Your Fasting Glucose has improved from 126 mg/dL to 98 mg/dL')."
                },
                dataPoints: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      date: { type: "string", description: "Date of the reading in YYYY-MM-DD format" },
                      value: { type: "number" }
                    },
                    required: ["date", "value"]
                  }
                }
              },
              required: ["biomarkerName", "direction", "message", "dataPoints"]
            }
          }
        },
        required: ["trends"]
      }
    }
  };

  const messages: any[] = [
    {
      role: "system",
      content: `You are a clinical data analyst specialized in tracking biomarker trends over time.
Your goal is to analyze historical data points for biomarkers and determine their trend direction (improving, worsening, or stable) and output a helpful message for the patient.
- Improving: Moving closer to the normal reference range.
- Worsening: Moving further away from the normal reference range.
- Stable: Remaining relatively unchanged.
Always call the analyze_trends tool to save your findings.`
    },
    {
      role: "user",
      content: `Analyze the historical trends for the following abnormal biomarkers based on their historical readings:

${Object.entries(historyMap)
  .map(([name, readings]) => {
    return `Biomarker: ${name}
Historical Readings (most recent first):
${readings
  .map(
    (r) =>
      `- Date: ${r.report_date || r.date}, Value: ${r.value} ${r.unit || ""} (Status: ${r.status})`
  )
  .join("\n")}`;
  })
  .join("\n\n")}

Please identify the trend and call analyze_trends.`
    }
  ];

  let trends: TrendInsight[] = [];
  let iterations = 0;
  const MAX_ITERATIONS = 5;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    console.log(`🔄 [PatternAgent] Loop iteration ${iterations}`);

    const response = await githubClient.chat.completions.create({
      model: MODELS.SMART,
      messages,
      tools: [TREND_TOOL],
      tool_choice: "required",
      max_tokens: 4096,
    });

    const message = response.choices[0].message;
    const stopReason = response.choices[0].finish_reason;

    if (stopReason === "tool_calls" && message.tool_calls) {
      messages.push(message);

      for (const toolCall of message.tool_calls) {
        const tc = toolCall as any;
        if (tc.function.name === "analyze_trends") {
          const args = JSON.parse(tc.function.arguments);
          trends = args.trends || [];
          console.log(`✅ [PatternAgent] Analyzed ${trends.length} trends`);

          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({ success: true, count: trends.length }),
          });
        }
      }
      if (trends.length > 0) break;
    }

    if (stopReason === "stop") {
      break;
    }
  }

  return {
    trends,
    currentStep: "complete",
  };
}