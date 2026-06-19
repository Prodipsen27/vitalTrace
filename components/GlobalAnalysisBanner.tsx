"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAnalysis } from "@/lib/context/AnalysisContext";
import Link from "next/link";
import { Activity, Loader2 } from "lucide-react";

export default function GlobalAnalysisBanner() {
  const pathname = usePathname();
  const { isAnalyzing, currentStep } = useAnalysis();

  // Do not show the banner if we are not analyzing, or if we are already on the processing page
  if (!isAnalyzing || pathname === "/processing") {
    return null;
  }

  const getStepLabel = () => {
    switch (currentStep) {
      case "extracting":
        return "Extracting biomarkers...";
      case "analyzing":
        return "Analyzing clinical ranges...";
      case "pattern_detection":
        return "Checking history & trends...";
      case "explaining":
        return "Generating explanations...";
      default:
        return "Processing report...";
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-subtle">
      <Link
        href="/processing"
        className="flex items-center gap-3 bg-[#0f1b14] border border-[#2d4a3b] text-zinc-100 px-5 py-3 rounded-2xl shadow-[0_4px_20px_rgba(61,220,132,0.15)] hover:border-[#3ddc84] transition-all group"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3ddc84] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#3ddc84]"></span>
        </span>
        <div className="text-left">
          <p className="text-xs font-bold uppercase tracking-wider text-[#3ddc84] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            Analysis in Progress
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5">{getStepLabel()}</p>
        </div>
        <Loader2 className="w-4 h-4 text-[#3ddc84] animate-spin ml-2 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
