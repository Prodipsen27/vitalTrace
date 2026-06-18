import React from "react";
import { Biomarker } from "@/types";
import StatusBadge from "./StatusBadge";
import { motion } from "framer-motion";

interface BiomarkerCardProps {
  biomarker: Biomarker;
}

export default function BiomarkerCard({ biomarker }: BiomarkerCardProps) {
  const { name, value, unit, referenceRange, referenceMin, referenceMax, status, category } =
    biomarker;

  // Calculate percentage position of the value relative to range
  let percentage = 50; // default middle
  const hasMin = typeof referenceMin === "number";
  const hasMax = typeof referenceMax === "number";

  if (hasMin && hasMax) {
    const min = referenceMin!;
    const max = referenceMax!;
    const range = max - min;
    if (range > 0) {
      percentage = ((value - min) / range) * 100;
    }
  } else if (hasMax) {
    // e.g. "Below 200"
    const max = referenceMax!;
    percentage = (value / max) * 80; // scale so that max is at 80%
  } else if (hasMin) {
    // e.g. "Above 40"
    const min = referenceMin!;
    percentage = 20 + ((value - min) / min) * 40; // scale around min
  }

  // Clamp percentage between 0 and 100
  percentage = Math.max(0, Math.min(100, percentage));

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4, borderColor: "rgba(61, 220, 132, 0.4)" }}
      transition={{ duration: 0.3 }}
      className="glass-card rounded-xl p-5 border border-[#2d4a3b] bg-[#1a2a22]/40 relative overflow-hidden group transition-all duration-300"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-300 pointer-events-none" />

      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
            {category}
          </span>
          <h4 className="text-lg font-bold text-zinc-200 mt-0.5 group-hover:text-[#3ddc84] transition-colors">
            {name}
          </h4>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-3xl font-extrabold text-[#3ddc84] tracking-tight">{value}</span>
        <span className="text-sm font-semibold text-zinc-400">{unit}</span>
      </div>

      {/* Progress Range Bar */}
      <div className="space-y-1.5">
        <div className="h-1.5 w-full bg-zinc-800 rounded-full relative overflow-visible">
          {/* Highlight normal range on the bar if min/max exist */}
          {hasMin && hasMax && (
            <div className="absolute left-[20%] right-[20%] top-0 bottom-0 bg-emerald-500/20 rounded-full" />
          )}

          {/* Value marker */}
          <div
            style={{ left: `${percentage}%` }}
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-[#080c0a] shadow-lg transition-all duration-500 ${
              status === "normal"
                ? "bg-emerald-400"
                : status === "critical"
                ? "bg-red-400"
                : status === "high"
                ? "bg-orange-400"
                : "bg-amber-400"
            }`}
          />
        </div>

        <div className="flex justify-between text-[10px] text-zinc-500 font-medium pt-1">
          <span>Ref: {referenceRange}</span>
          <span>
            {hasMin && <span>Min: {referenceMin}</span>}
            {hasMin && hasMax && <span className="mx-1">|</span>}
            {hasMax && <span>Max: {referenceMax}</span>}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
