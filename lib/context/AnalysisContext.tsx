"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AgentStep } from "@/types";

import { supabaseBrowser } from "@/lib/supabase/client";

interface AnalysisContextType {
  isAnalyzing: boolean;
  currentStep: AgentStep;
  error: string | null;
  activeReportId: string | null;
  startAnalysis: (file: File | null, transcript: string, patientId: string, patientName?: string) => Promise<void>;
  cancelAnalysis: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<AgentStep>("extracting");
  const [error, setError] = useState<string | null>(null);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const cancelAnalysis = () => {
    console.log("🛑 [AnalysisContext] Cancelling analysis...");
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsAnalyzing(false);
    setCurrentStep("extracting");
    setError(null);
    setActiveReportId(null);
    router.push("/upload");
  };

  const startAnalysis = async (file: File | null, transcript: string, patientId: string, patientName?: string) => {
    setIsAnalyzing(true);
    setCurrentStep("extracting");
    setError(null);
    setActiveReportId(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Update patient name metadata in Supabase if provided
    if (patientName) {
      try {
        await supabaseBrowser.auth.updateUser({ data: { full_name: patientName } });
      } catch (metaErr) {
        console.error("Failed to update patient name metadata:", metaErr);
      }
    }

    // Redirect to the processing page immediately
    router.push("/processing");

    // Stepper simulation
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev === "extracting") return "analyzing";
        if (prev === "analyzing") return "pattern_detection";
        return prev;
      });
    }, 4500);

    try {
      let response;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("patientId", patientId);

        response = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
      } else {
        response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportText: transcript,
            patientId,
          }),
          signal: controller.signal,
        });
      }

      if (intervalRef.current) clearInterval(intervalRef.current);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Analysis failed on server");
      }

      const result = await response.json();
      setCurrentStep("complete");
      setIsAnalyzing(false);

      const reportId = result.reportId;
      const reportDate = new Date().toISOString().split("T")[0];
      const abnormalCount = result.biomarkers?.filter((b: any) => b.status !== "normal").length || 0;

      const fullReport = {
        id: reportId,
        patientId,
        uploadedAt: new Date().toISOString(),
        reportDate,
        fileName: result.fileName || file?.name || "Text Dictation",
        rawText: transcript || file?.name || "Uploaded PDF Report",
        biomarkers: result.biomarkers || [],
        summary: result.summary || "",
        doctorQuestions: result.doctorQuestions || [],
        lifestyle: result.lifestyle || [],
        trends: result.trends || [],
        riskFlags: result.riskFlags || [],
        status: "complete",
      };

      localStorage.setItem(`vitaltrace_report_${reportId}`, JSON.stringify(fullReport));

      // Append to list of summaries
      const reportsJson = localStorage.getItem("vitaltrace_reports");
      const reports = reportsJson ? JSON.parse(reportsJson) : [];
      
      let overallStatus = "needs_attention";
      if (abnormalCount === 0) {
        overallStatus = "excellent";
      } else if (result.riskFlags?.length > 0 || fullReport.biomarkers.some((b: any) => b.status === "critical")) {
        overallStatus = "critical";
      } else if (fullReport.biomarkers.some((b: any) => b.status === "high")) {
        overallStatus = "concerning";
      }

      const summaryItem = {
        id: reportId,
        patientId,
        uploadedAt: fullReport.uploadedAt,
        reportDate,
        fileName: fullReport.fileName,
        biomarkerCount: fullReport.biomarkers.length,
        abnormalCount,
        overallStatus,
      };

      localStorage.setItem("vitaltrace_reports", JSON.stringify([summaryItem, ...reports]));
      setActiveReportId(reportId);

      // Navigate to completed report
      setTimeout(() => {
        router.push(`/report/${reportId}`);
      }, 1000);

    } catch (err: any) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (err.name === "AbortError") {
        console.log("❌ [AnalysisContext] Request successfully aborted.");
        return;
      }
      console.error("❌ [AnalysisContext] Error:", err);
      setError(err.message || String(err));
      setCurrentStep("error");
      setIsAnalyzing(false);
    }
  };

  return (
    <AnalysisContext.Provider
      value={{
        isAnalyzing,
        currentStep,
        error,
        activeReportId,
        startAnalysis,
        cancelAnalysis,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  return context;
}
