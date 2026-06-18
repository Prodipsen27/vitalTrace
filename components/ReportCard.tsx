import React from "react";
import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { Calendar, FileText, Activity, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface ReportCardProps {
  report: {
    id: string;
    uploadedAt: string;
    reportDate: string;
    fileName: string;
    biomarkerCount: number;
    abnormalCount: number;
    overallStatus: string;
  };
}

export default function ReportCard({ report }: ReportCardProps) {
  const { id, reportDate, fileName, biomarkerCount, abnormalCount, overallStatus } = report;

  const displayDate = new Date(reportDate || Date.now()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, borderColor: "rgba(61, 220, 132, 0.4)" }}
      transition={{ duration: 0.3 }}
      className="glass-card rounded-xl p-6 border border-[#2d4a3b] bg-[#1a2a22]/10 hover:bg-[#1a2a22]/20 transition-all duration-300 relative overflow-hidden group"
    >
      <Link href={`/report/${id}`} className="absolute inset-0 z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* File and Date Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#3ddc84]" />
            <h3 className="font-bold text-zinc-200 group-hover:text-[#3ddc84] transition-colors truncate max-w-xs md:max-w-md">
              {fileName || "Extracted Lab Report"}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>Analyzed on {displayDate}</span>
          </div>
        </div>

        {/* Status and Stats */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6 z-20">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                <strong>{biomarkerCount}</strong> biomarkers
              </span>
            </div>
            {abnormalCount > 0 && (
              <div className="flex items-center gap-1.5 text-zinc-400">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                <span>
                  <strong>{abnormalCount}</strong> abnormal
                </span>
              </div>
            )}
          </div>

          <StatusBadge status={overallStatus} />
        </div>
      </div>
    </motion.div>
  );
}
