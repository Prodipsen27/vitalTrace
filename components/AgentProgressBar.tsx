"use client";

import React from "react";
import { AgentStep } from "@/types";
import { Check, Loader2 } from "lucide-react";
import clsx from "clsx";

interface AgentProgressBarProps {
  currentStep: AgentStep;
}

interface StepItem {
  id: AgentStep;
  label: string;
  sub: string;
}

const STEPS: StepItem[] = [
  { id: "extracting", label: "Extracting biomarkers", sub: "Pulling structured lab data from PDF" },
  { id: "analyzing", label: "Analyzing findings", sub: "Understanding risk levels & doctor preps" },
  { id: "pattern_detection", label: "Detecting patterns", sub: "Performing RAG queries for trend mapping" },
  { id: "complete", label: "Complete", sub: "Dashboard explanation ready" },
];

export default function AgentProgressBar({ currentStep }: AgentProgressBarProps) {
  const getStepIndex = (step: AgentStep) => {
    switch (step) {
      case "extracting":
        return 0;
      case "analyzing":
        return 1;
      case "pattern_detection":
        return 2;
      case "complete":
        return 3;
      default:
        return -1;
    }
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 bg-[#1a2a22]/30 border border-[#2d4a3b]/50 p-6 rounded-2xl backdrop-blur-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm uppercase font-bold tracking-wider text-[#3ddc84]">
          Clinical Pipeline Execution
        </h3>
        {currentStep !== "complete" && currentStep !== "error" && (
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3ddc84]" />
            AI agent computing...
          </span>
        )}
      </div>

      <div className="space-y-4 relative">
        {/* Connector Line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-zinc-800 -z-10">
          <div
            className="w-full bg-[#3ddc84] transition-all duration-1000 ease-out"
            style={{
              height: `${(Math.max(0, currentIndex) / (STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>

        {STEPS.map((step, idx) => {
          const isCompleted = currentIndex > idx || currentStep === "complete";
          const isActive = currentIndex === idx && currentStep !== "complete";
          const isPending = currentIndex < idx;

          return (
            <div key={step.id} className="flex gap-4 items-start group">
              {/* Dot Icon */}
              <div
                className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                  {
                    "bg-[#3ddc84]/15 border-[#3ddc84] text-[#3ddc84] shadow-[0_0_15px_rgba(61,220,132,0.2)]":
                      isCompleted,
                    "bg-[#080c0a] border-[#3ddc84] text-[#3ddc84] shadow-[0_0_20px_rgba(61,220,132,0.4)] animate-pulse":
                      isActive,
                    "bg-zinc-900 border-zinc-800 text-zinc-600": isPending,
                  }
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>

              {/* Text info */}
              <div className="space-y-0.5 pt-1">
                <h4
                  className={clsx("text-sm font-bold transition-colors duration-500", {
                    "text-zinc-200": isCompleted || isActive,
                    "text-zinc-500": isPending,
                  })}
                >
                  {step.label}
                </h4>
                <p
                  className={clsx("text-xs transition-colors duration-500", {
                    "text-zinc-400": isActive || isCompleted,
                    "text-zinc-600": isPending,
                  })}
                >
                  {step.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
