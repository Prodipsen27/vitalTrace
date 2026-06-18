import { NextRequest, NextResponse } from "next/server";
import { runExtractorAgent } from "@/lib/agents/extractor";
import { runAnalyzerAgent } from "@/lib/agents/analyzer";
import { runPatternAgent } from "@/lib/agents/pattern";
import { generateEmbedding } from "@/lib/tools/embeddings";
import { storeBiomarkerEmbedding, createSupabaseServerClient } from "@/lib/supabase/server";
import { AgentState } from "@/types";

// pdf-parse uses traditional commonjs require
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Polyfill browser globals that pdf-parse's internal pdfjs-dist requires at load time in serverless Node environments
if (typeof globalThis.DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = class DOMMatrix {};
}
if (typeof globalThis.ImageData === "undefined") {
  (globalThis as any).ImageData = class ImageData {};
}
if (typeof globalThis.Path2D === "undefined") {
  (globalThis as any).Path2D = class Path2D {};
}

const { PDFParse } = require("pdf-parse");

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

export async function POST(req: NextRequest) {
  try {
    // 1. Initialize Authenticated Supabase Client
    const supabase = createSupabaseServerClient();

    // Check if user is authenticated via session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let reportText = "";
    const patientId = session.user.id; // Use authenticated user ID directly

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
      }

      // 2. File validation
      if (file.type !== "application/pdf") {
        return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const parser = new PDFParse({ data: buffer });
      const parsed = await parser.getText();
      reportText = parsed.text;
    } else {
      const body = await req.json();
      reportText = body.reportText;
    }

    if (!reportText) {
      return NextResponse.json({ error: "Required data missing" }, { status: 400 });
    }

    // Initial state
    let state: AgentState = {
      reportText,
      patientId,
      reportId: `report-${Date.now()}`,
      currentStep: "extracting",
    };

    // ── Agent Pipeline ──────────────────────────────────
    const extractResult = await runExtractorAgent(state);
    state = { ...state, ...extractResult };

    if (state.biomarkers && state.biomarkers.length > 0) {
      const reportDate = new Date().toISOString().split("T")[0];
      for (const biomarker of state.biomarkers) {
        try {
          const textToEmbed = `${biomarker.name} ${biomarker.value} ${biomarker.unit} ${biomarker.status}`;
          const embedding = await generateEmbedding(textToEmbed);
          // Note: storeBiomarkerEmbedding needs to be updated to use the 'supabase' client
          // created from createSupabaseServerClient() to respect RLS
          await storeBiomarkerEmbedding(
            state.patientId,
            state.reportId,
            reportDate,
            biomarker.name,
            biomarker.value,
            biomarker.unit,
            biomarker.status,
            embedding
          );
        } catch (dbErr) {
          console.error(`Embedding storage failed for ${biomarker.name}`);
        }
      }
    }

    const analyzeResult = await runAnalyzerAgent(state);
    state = { ...state, ...analyzeResult };

    const patternResult = await runPatternAgent(state);
    state = { ...state, ...patternResult };

    return NextResponse.json({
      success: true,
      reportId: state.reportId,
      biomarkers: state.biomarkers,
      summary: state.summary,
      riskFlags: state.riskFlags,
      doctorQuestions: state.doctorQuestions,
      lifestyle: state.lifestyle,
      trends: state.trends,
    });

  } catch (error: any) {
    console.error("[API Error]");
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}
