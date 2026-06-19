"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAnalysis } from "@/lib/context/AnalysisContext";
import AgentProgressBar from "@/components/AgentProgressBar";
import { Activity, AlertCircle, ArrowLeft, XCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ProcessingPage() {
  const router = useRouter();
  const { isAnalyzing, currentStep, error, cancelAnalysis } = useAnalysis();

  // If the user navigates directly to this page while not analyzing and no error is present,
  // redirect them back to the upload screen
  useEffect(() => {
    if (!isAnalyzing && currentStep !== "error" && currentStep !== "complete") {
      router.push("/upload");
    }
  }, [isAnalyzing, currentStep, router]);

  return (
    <main className="min-h-screen bg-[#080c0a] text-zinc-100 py-12 px-6 relative flex flex-col justify-between">
      {/* Noise background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto w-full space-y-12 my-auto">
        {/* Navigation header */}
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-[#3ddc84] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          {isAnalyzing && (
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#3ddc84] bg-[#3ddc84]/10 border border-[#3ddc84]/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3ddc84]"></span>
              Analyzing in Background
            </span>
          )}
        </div>

        {/* Core State Display */}
        {currentStep === "error" ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-2xl border border-red-500/20 bg-red-500/5 p-8 flex flex-col items-center text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-zinc-100">Analysis Failed</h3>
              <p className="text-sm text-zinc-400 max-w-md mx-auto">
                {error || "An unexpected error occurred while running the agent pipeline."}
              </p>
            </div>

            <button
              type="button"
              onClick={cancelAnalysis}
              className="px-6 py-2.5 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-700/50 rounded-full text-xs font-bold tracking-wider uppercase transition-all"
            >
              Return to Upload
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-10"
          >
            <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-[#1a2a22]/30 border border-[#2d4a3b]/50 pulse-glow">
              <Activity className="w-12 h-12 text-[#3ddc84]" />
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-3xl font-normal tracking-tight text-zinc-100 font-heading">
                VitalTrace AI <span className="text-[#3ddc84] italic">Processing</span>
              </h1>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                Running extractor, clinical analyzer, and trend matching agents in sequence
              </p>
            </div>

            {/* Stepper progress component */}
            <div className="w-full">
              <AgentProgressBar currentStep={currentStep} />
            </div>

            {/* Interactive Control buttons */}
            <div className="pt-4 flex flex-col items-center gap-3">
              {isAnalyzing && (
                <>
                  <button
                    type="button"
                    onClick={cancelAnalysis}
                    className="group px-8 py-3.5 font-bold rounded-full border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 flex items-center gap-2 transition-all hover:scale-105"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel Analysis
                  </button>
                  <p className="text-[10px] text-zinc-500">
                    You can safely navigate away. The analysis will continue running in the background.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <div className="text-center text-[10px] text-zinc-600 mt-12">
        VitalTrace Health Assistant Pipeline
      </div>
    </main>
  );
}
