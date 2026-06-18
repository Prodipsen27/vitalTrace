"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, History, Inbox, Database } from "lucide-react";
import { motion } from "framer-motion";
import ReportCard from "@/components/ReportCard";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      if (typeof window !== "undefined") {
        const data = localStorage.getItem("vitaltrace_reports");
        if (data) {
          const parsed = JSON.parse(data);
          if (user) {
            // Filter by patientId (if present) to show only current user's reports
            setReports(parsed.filter((r: any) => !r.patientId || r.patientId === user.id));
          } else {
            setReports(parsed);
          }
        }
      }
    };
    fetchHistory();
  }, []);

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear your local report history? This action is permanent.")) {
      // Clear reports lists
      reports.forEach((r) => {
        localStorage.removeItem(`vitaltrace_report_${r.id}`);
      });
      localStorage.removeItem("vitaltrace_reports");
      setReports([]);
    }
  };

  const handleLogout = async () => {
    await supabaseBrowser.auth.signOut();
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-[#080c0a] text-zinc-100 py-12 px-6 relative">
      {/* Decorative backdrop glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation header */}
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-[#3ddc84] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Home
          </Link>

          <div className="flex gap-3">
            {reports.length > 0 && (
              <button
                type="button"
                onClick={clearHistory}
                className="text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors border border-red-500/20 bg-red-500/5 px-4 py-2 rounded-full"
              >
                Clear History
              </button>
            )}
            <Link
              href="/upload"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#080c0a] bg-[#3ddc84] hover:bg-[#4ef096] px-4 py-2 rounded-full transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New Analysis
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors border border-red-500/20 bg-red-500/5 px-4 py-2 rounded-full"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="border-b border-[#2d4a3b]/20 pb-6 space-y-2">
          <h1 className="text-4xl font-normal tracking-tight font-heading text-zinc-100 flex items-center gap-3">
            <History className="w-8 h-8 text-[#3ddc84]" />
            Diagnostic <span className="text-[#3ddc84] italic">History</span>
          </h1>
          <p className="text-sm text-zinc-400">
            View all health assessments and biomarker progression records processed locally on this device
          </p>
        </div>

        {/* Report List */}
        {reports.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-2xl p-16 border border-dashed border-[#2d4a3b]/40 bg-[#1a2a22]/5 text-center space-y-6 max-w-xl mx-auto"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#1a2a22] border border-[#2d4a3b]/60 flex items-center justify-center text-[#3ddc84]/65 mx-auto">
              <Inbox className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-zinc-200 font-heading">No reports uploaded</h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Upload your first laboratory report PDF or dictation text to begin explaining your biomarkers.
              </p>
            </div>

            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#3ddc84] text-[#080c0a] font-bold text-xs uppercase tracking-wider rounded-full hover:bg-[#4ef096] transition-all hover:scale-105"
            >
              Upload First Report
            </Link>
          </motion.div>
        )}

        {/* Database security note */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-600 pt-8 border-t border-[#2d4a3b]/10">
          <Database className="w-3.5 h-3.5" />
          <span>Local storage persistence is active. Clearing browser cache will wipe this history list.</span>
        </div>
      </div>
    </main>
  );
}
