"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { FileUp, File, Trash2, ChevronRight, Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import VoiceInput from "@/components/VoiceInput";
import AgentProgressBar from "@/components/AgentProgressBar";
import { AgentStep } from "@/types";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<AgentStep>("extracting");
  const [patientId, setPatientId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      if (user) {
        setPatientId(user.id);
      }
    };
    fetchSession();
  }, []);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const removeFile = () => {
    setFile(null);
  };

  const handleAnalyze = async () => {
    if (!patientId) {
      alert("No patient session found. Please refresh and try again.");
      return;
    }

    if (!file && !transcript.trim()) {
      alert("Please upload a PDF report or write/dictate some report text.");
      return;
    }

    setIsAnalyzing(true);
    setCurrentStep("extracting");

    // Stepper simulation intervals (runs alongside the request)
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev === "extracting") return "analyzing";
        if (prev === "analyzing") return "pattern_detection";
        return prev;
      });
    }, 3500);

    try {
      let response;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("patientId", patientId);

        response = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportText: transcript,
            patientId,
          }),
        });
      }

      clearInterval(stepInterval);

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      setCurrentStep("complete");

      // Save full report data in localStorage
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

      // Append to the list of report summaries
      const reportsJson = localStorage.getItem("vitaltrace_reports");
      const reports = reportsJson ? JSON.parse(reportsJson) : [];
      const summaryItem = {
        id: reportId,
        patientId,
        uploadedAt: fullReport.uploadedAt,
        reportDate,
        fileName: fullReport.fileName,
        biomarkerCount: fullReport.biomarkers.length,
        abnormalCount,
        overallStatus: result.riskFlags?.length > 0 ? "critical" : "needs_attention", // simple fallback status mapping
      };

      // Set logical overall status based on biomarker findings
      if (abnormalCount === 0) {
        summaryItem.overallStatus = "excellent";
      } else if (result.riskFlags?.length > 0 || fullReport.biomarkers.some((b: any) => b.status === "critical")) {
        summaryItem.overallStatus = "critical";
      } else if (fullReport.biomarkers.some((b: any) => b.status === "high")) {
        summaryItem.overallStatus = "concerning";
      } else {
        summaryItem.overallStatus = "needs_attention";
      }

      localStorage.setItem("vitaltrace_reports", JSON.stringify([summaryItem, ...reports]));

      // Brief delay to show "Complete" state
      setTimeout(() => {
        router.push(`/report/${reportId}`);
      }, 1000);
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error(err);
      alert(`Analysis failed: ${err.message || err}`);
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080c0a] text-zinc-100 py-12 px-6 relative">
      {/* Noise background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation header */}
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-[#3ddc84] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <Link
            href="/history"
            className="text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-[#3ddc84] transition-colors border border-[#2d4a3b]/40 bg-[#1a2a22]/10 px-4 py-2 rounded-full hover:border-[#3ddc84]/40"
          >
            View History
          </Link>
        </div>

        {/* Title */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h1 className="text-4xl font-normal tracking-tight font-heading text-zinc-100">
            Upload Your <span className="text-[#3ddc84] italic">Biomarkers</span>
          </h1>
          <p className="text-sm text-zinc-400">
            Provide a lab report PDF or voice record the values to run the agent network
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!isAnalyzing ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Method 1: PDF Dropzone */}
                <div className="glass-card rounded-xl p-6 border border-[#2d4a3b] bg-[#1a2a22]/20 flex flex-col justify-between h-full min-h-[350px]">
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block mb-1">
                      Input Option A
                    </span>
                    <h3 className="text-lg font-bold text-zinc-200">PDF Lab Report</h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Upload diagnostic results from your physician
                    </p>
                  </div>

                  {file ? (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#3ddc84] bg-[#3ddc84]/5 p-6 rounded-xl space-y-4 my-6">
                      <div className="w-12 h-12 rounded-xl bg-[#1a2a22] border border-[#2d4a3b] flex items-center justify-center text-[#3ddc84]">
                        <File className="w-6 h-6" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-sm font-bold text-zinc-200 truncate max-w-[200px]">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • PDF Document
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove File
                      </button>
                    </div>
                  ) : (
                    <div
                      {...getRootProps()}
                      className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-300 my-6 ${
                        isDragActive
                          ? "border-[#3ddc84] bg-[#3ddc84]/5 shadow-[0_0_20px_rgba(61,220,132,0.15)]"
                          : "border-[#2d4a3b] hover:border-[#3ddc84]/50 hover:bg-[#1a2a22]/30"
                      }`}
                    >
                      <input {...getInputProps()} />
                      <div className="w-12 h-12 rounded-xl bg-[#1a2a22] border border-[#2d4a3b]/60 flex items-center justify-center text-[#3ddc84] mb-4">
                        <FileUp className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-zinc-300 text-center">
                        {isDragActive ? "Drop the PDF here" : "Drag & drop PDF here"}
                      </p>
                      <p className="text-xs text-zinc-500 text-center mt-1">
                        or click to browse local files
                      </p>
                    </div>
                  )}

                  <div className="text-[10px] text-zinc-600 text-center">
                    Accepts text-based diagnostic laboratory reports (.pdf only)
                  </div>
                </div>

                {/* Method 2: Voice / Paste */}
                <VoiceInput onTranscriptChange={setTranscript} transcript={transcript} />
              </div>

              {/* Action Button */}
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!file && !transcript.trim()}
                  className={`group px-10 py-4 font-bold rounded-full flex items-center gap-2 transition-all ${
                    file || transcript.trim()
                      ? "bg-[#3ddc84] text-[#080c0a] hover:bg-[#4ef096] hover:scale-105 hover:shadow-[0_0_35px_rgba(61,220,132,0.4)]"
                      : "bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed"
                  }`}
                >
                  Analyze Report
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </motion.div>
          ) : (
            /* Analyzing state */
            <motion.div
              key="loader"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center justify-center space-y-8"
            >
              <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-[#1a2a22]/30 border border-[#2d4a3b]/50 pulse-glow">
                <Activity className="w-12 h-12 text-[#3ddc84]" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-zinc-100 font-heading">
                  VitalTrace AI Processing
                </h3>
                <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                  Running extractor, clinical analyzer, and trend matching agents in sequence
                </p>
              </div>

              <AgentProgressBar currentStep={currentStep} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
