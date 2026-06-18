import { NextRequest, NextResponse } from "next/server";
import { runExtractorAgent } from "@/lib/agents/extractor";
import { runAnalyzerAgent } from "@/lib/agents/analyzer";
import { runPatternAgent } from "@/lib/agents/pattern";
import { generateEmbedding } from "@/lib/tools/embeddings";
import { storeBiomarkerEmbedding, createSupabaseServerClient } from "@/lib/supabase/server";
import { AgentState } from "@/types";
import { randomUUID } from "crypto";

// pdf-parse uses traditional commonjs require
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Polyfill browser globals
if (typeof globalThis.DOMMatrix === "undefined") (globalThis as any).DOMMatrix = class DOMMatrix {};
if (typeof globalThis.ImageData === "undefined") (globalThis as any).ImageData = class ImageData {};
if (typeof globalThis.Path2D === "undefined") (globalThis as any).Path2D = class Path2D {};

const { PDFParse } = require("pdf-parse");

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let reportText = "";
    const patientId = session.user.id;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }

      if (file.type !== "application/pdf") {
        return NextResponse.json({ error: "Only PDF files supported" }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "File too large" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const parser = new PDFParse(uint8Array);
      const parsed = await parser.getText();
      reportText = parsed.text;
    } else {
      const body = await req.json();
      reportText = body.reportText;
    }

    if (!reportText) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    let state: AgentState = {
      reportText,
      patientId,
      reportId: randomUUID(), // Secure unique ID
      currentStep: "extracting",
    };

    const extractResult = await runExtractorAgent(state);
    state = { ...state, ...extractResult };

    if (state.biomarkers && state.biomarkers.length > 0) {
      const reportDate = new Date().toISOString().split("T")[0];
      // Store embeddings; propagate failure if core data persistence fails
      await Promise.all(state.biomarkers.map(async (biomarker) => {
        const textToEmbed = `${biomarker.name} ${biomarker.value} ${biomarker.unit} ${biomarker.status}`;
        const embedding = await generateEmbedding(textToEmbed);
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
      }));
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
    console.error("[API Error]", error); // Log full error internally
    return NextResponse.json({ error: "An internal processing error occurred." }, { status: 500 });
  }
}
