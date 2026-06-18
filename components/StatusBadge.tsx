import React from "react";
import clsx from "clsx";

export type StatusType =
  | "excellent"
  | "good"
  | "needs_attention"
  | "concerning"
  | "critical"
  | "normal"
  | "high"
  | "low";

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace("_", " ");

  const colorClasses = clsx(
    "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 border backdrop-blur-sm",
    {
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20":
        normalized === "excellent" || normalized === "normal" || normalized === "good",
      "bg-amber-500/10 text-amber-400 border-amber-500/20":
        normalized === "needs attention" || normalized === "low",
      "bg-orange-500/10 text-orange-400 border-orange-500/20":
        normalized === "concerning" || normalized === "high",
      "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)] animate-pulse":
        normalized === "critical",
    },
    className
  );

  const getDotColor = () => {
    switch (normalized) {
      case "excellent":
      case "normal":
      case "good":
        return "bg-emerald-400";
      case "needs attention":
      case "low":
        return "bg-amber-400";
      case "high":
      case "concerning":
        return "bg-orange-400";
      case "critical":
        return "bg-red-400";
      default:
        return "bg-zinc-400";
    }
  };

  return (
    <span className={colorClasses}>
      <span className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", getDotColor())} />
      {normalized}
    </span>
  );
}
