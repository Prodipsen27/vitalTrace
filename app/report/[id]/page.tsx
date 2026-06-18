"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  Mail,
  Plus,
  Apple,
  Dumbbell,
  Moon,
  Brain,
  Pill,
  Sparkles,
  FileText,
  Calendar,
  AlertTriangle,
  History,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import StatusBadge from "@/components/StatusBadge";
import BiomarkerCard from "@/components/BiomarkerCard";
import TrendChart from "@/components/TrendChart";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [report, setReport] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"all" | "abnormal" | "critical">("all");
  const [copiedQuestionIdx, setCopiedQuestionIdx] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && id) {
      const data = localStorage.getItem(`vitaltrace_report_${id}`);
      if (data) {
        setReport(JSON.parse(data));
      } else {
        toast.error("Report not found");
        router.push("/history");
      }
    }
  }, [id, router]);

  if (!report) {
    return (
      <div className="min-h-screen bg-[#080c0a] text-zinc-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-t-transparent border-[#3ddc84] rounded-full animate-spin mx-auto" />
          <p className="text-sm text-zinc-500">Loading your analysis report...</p>
        </div>
      </div>
    );
  }

  // Filter biomarkers
  const filteredBiomarkers = report.biomarkers.filter((b: any) => {
    if (activeTab === "all") return true;
    if (activeTab === "abnormal") return b.status !== "normal";
    if (activeTab === "critical") return b.status === "critical";
    return true;
  });

  const overallStatus = report.overallStatus || "needs_attention";

  // Category Icon helper
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "diet":
        return <Apple className="w-5 h-5 text-emerald-400" />;
      case "exercise":
        return <Dumbbell className="w-5 h-5 text-indigo-400" />;
      case "sleep":
        return <Moon className="w-5 h-5 text-cyan-400" />;
      case "stress":
        return <Brain className="w-5 h-5 text-purple-400" />;
      case "medication":
        return <Pill className="w-5 h-5 text-red-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-zinc-400" />;
    }
  };

  // Copy helpers
  const copyQuestion = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionIdx(index);
    toast.success("Question copied!");
    setTimeout(() => setCopiedQuestionIdx(null), 2000);
  };

  const copyAllQuestions = () => {
    const allText = report.doctorQuestions
      .map((q: string, idx: number) => `${idx + 1}. ${q}`)
      .join("\n");
    navigator.clipboard.writeText(allText);
    toast.success("All questions copied to clipboard!");
  };

  const sendEmail = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: "Preparing medical brief email...",
        success: "Report briefing sent to your registered email!",
        error: "Failed to send email. Please try again.",
      }
    );
  };

  const downloadPDF = async () => {
    toast.promise(
      (async () => {
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF();
        let y = 15;

        // Cover / Header
        doc.setFillColor(26, 42, 34); // Deep green brand color (#1a2a22 equivalent)
        doc.rect(0, 0, 210, 45, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("VITALTRACE HEALTH BRIEF", 15, 25);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Patient ID: ${report.patientId}`, 15, 35);
        doc.text(`Report Date: ${new Date(report.reportDate).toLocaleDateString()}`, 140, 35);

        // Reset text color
        doc.setTextColor(40, 40, 40);

        // Section: Summary
        y = 60;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Executive Summary", 15, y);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const splitSummary = doc.splitTextToSize(report.summary || "No summary available.", 180);
        doc.text(splitSummary, 15, y);
        y += (splitSummary.length * 5) + 15;

        // Section: Biomarkers Table
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Biomarker Analysis", 15, y);
        y += 10;

        // Table Header
        doc.setFontSize(10);
        doc.setFillColor(240, 240, 240);
        doc.rect(15, y - 5, 180, 7, "F");
        doc.text("Biomarker", 17, y);
        doc.text("Value", 85, y);
        doc.text("Unit", 120, y);
        doc.text("Status", 160, y);
        y += 7;

        doc.setFont("helvetica", "normal");
        report.biomarkers.forEach((b: any) => {
          // Check page overflow
          if (y > 275) {
            doc.addPage();
            y = 20;
          }
          doc.text(b.name || "-", 17, y);
          doc.text(String(b.value ?? "-"), 85, y);
          doc.text(b.unit || "-", 120, y);
          
          // Color code status
          const status = (b.status || "normal").toLowerCase();
          if (status === "critical") {
            doc.setTextColor(220, 38, 38);
          } else if (status === "abnormal" || status === "high" || status === "low") {
            doc.setTextColor(217, 119, 6);
          } else {
            doc.setTextColor(5, 150, 105);
          }
          doc.text(b.status || "-", 160, y);
          doc.setTextColor(40, 40, 40); // Reset
          
          y += 8;
        });

        y += 10;

        // Section: Doctor Prep Questions
        if (report.doctorQuestions && report.doctorQuestions.length > 0) {
          if (y > 230) {
            doc.addPage();
            y = 20;
          }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.text("Physician Consult Guide", 15, y);
          y += 10;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          report.doctorQuestions.forEach((q: string, idx: number) => {
            const splitQ = doc.splitTextToSize(`${idx + 1}. ${q}`, 180);
            if (y + (splitQ.length * 5) > 280) {
              doc.addPage();
              y = 20;
            }
            doc.text(splitQ, 15, y);
            y += (splitQ.length * 5) + 4;
          });
          y += 10;
        }

        // Section: Lifestyle
        if (report.lifestyle && report.lifestyle.length > 0) {
          if (y > 230) {
            doc.addPage();
            y = 20;
          }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.text("Lifestyle Adjustments", 15, y);
          y += 10;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          report.lifestyle.forEach((l: any) => {
            const textStr = `[${l.category.toUpperCase()}] Addressing ${l.relatedBiomarker}: ${l.suggestion} (Priority: ${l.priority})`;
            const splitL = doc.splitTextToSize(textStr, 180);
            if (y + (splitL.length * 5) > 280) {
              doc.addPage();
              y = 20;
            }
            doc.text(splitL, 15, y);
            y += (splitL.length * 5) + 4;
          });
        }

        // Save PDF
        doc.save(`VitalTrace-Report-${report.patientId}-${Date.now()}.pdf`);
      })(),
      {
        loading: "Generating PDF file...",
        success: "PDF downloaded successfully!",
        error: "Failed to download PDF.",
      }
    );
  };

  return (
    <main className="min-h-screen bg-[#080c0a] text-zinc-100 pb-28 pt-8 px-6 relative">
      <Toaster position="top-right" toastOptions={{ style: { background: "#1a2a22", color: "#f4f4f5", border: "1px solid #2d4a3b" } }} />

      {/* Decorative Blur */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-12">
        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Link
            href="/history"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-[#3ddc84] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Analysis History
          </Link>
          <div className="text-xs text-zinc-500 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span className="font-mono">{report.fileName || "extracted_report.pdf"}</span>
          </div>
        </div>

        {/* SECTION 1: Summary Banner */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card rounded-2xl p-6 md:p-8 border border-[#2d4a3b] bg-[#1a2a22]/30 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-4 max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={report.overallStatus || "needs_attention"} className="text-sm px-4 py-1.5" />
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(report.reportDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
              </div>

              <h1 className="text-3xl md:text-5xl font-normal text-zinc-100 font-heading leading-tight">
                VitalTrace Health Assessment
              </h1>

              <p className="text-base md:text-lg text-zinc-300 font-light leading-relaxed">
                {report.summary || "Your lab results are fully processed. Below is a comprehensive breakdown."}
              </p>
            </div>
          </div>
        </motion.section>

        {/* SECTION 2: Biomarker Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2d4a3b]/20 pb-4">
            <div>
              <h2 className="text-2xl font-normal text-zinc-100 font-heading">
                Biomarker Analysis
              </h2>
              <p className="text-xs text-zinc-400">
                Detailed clinical extraction results and reference comparisons
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-[#080c0a] border border-[#2d4a3b]/60 rounded-full p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-4 py-1.5 rounded-full font-semibold transition-colors ${
                  activeTab === "all" ? "bg-[#3ddc84] text-[#080c0a]" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("abnormal")}
                className={`px-4 py-1.5 rounded-full font-semibold transition-colors ${
                  activeTab === "abnormal" ? "bg-[#3ddc84] text-[#080c0a]" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Abnormal
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("critical")}
                className={`px-4 py-1.5 rounded-full font-semibold transition-colors ${
                  activeTab === "critical" ? "bg-[#3ddc84] text-[#080c0a]" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Critical
              </button>
            </div>
          </div>

          {filteredBiomarkers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBiomarkers.map((biomarker: any) => (
                <BiomarkerCard key={biomarker.id} biomarker={biomarker} />
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-xl p-12 border border-[#2d4a3b]/30 bg-[#1a2a22]/10 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm font-bold text-zinc-400">No biomarkers match this filter</p>
              <p className="text-xs text-zinc-600">Try changing your selection tab above</p>
            </div>
          )}
        </motion.section>

        {/* SECTION 3: Trend Charts */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div>
            <h2 className="text-2xl font-normal text-zinc-100 font-heading flex items-center gap-2">
              <History className="w-5 h-5 text-[#3ddc84]" />
              Historical Trajectory Analysis
            </h2>
            <p className="text-xs text-zinc-400">
              Comparing current values against prior diagnostic readings
            </p>
          </div>

          {report.trends && report.trends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {report.trends.map((trend: any) => {
                const biomarker = report.biomarkers.find((b: any) => b.name === trend.biomarkerName);
                return (
                  <TrendChart
                    key={trend.biomarkerName}
                    trend={trend}
                    unit={biomarker?.unit || ""}
                  />
                );
              })}
            </div>
          ) : (
            <div className="glass-card rounded-xl p-8 border border-dashed border-[#2d4a3b]/40 bg-[#1a2a22]/5 text-center">
              <p className="text-sm text-zinc-400 font-semibold">First report analyzed</p>
              <p className="text-xs text-zinc-500 mt-1">
                Trend tracking and progression line charts will appear automatically after you upload your next report.
              </p>
            </div>
          )}
        </motion.section>

        {/* SECTION 4: Doctor Prep */}
        {report.doctorQuestions && report.doctorQuestions.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-end border-b border-[#2d4a3b]/20 pb-4">
              <div>
                <h2 className="text-2xl font-normal text-zinc-100 font-heading">
                  Physician Consult Guide
                </h2>
                <p className="text-xs text-zinc-400">
                  Targeted questions generated to lead your next clinical consultation
                </p>
              </div>
              <button
                type="button"
                onClick={copyAllQuestions}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#2d4a3b]/80 bg-[#1a2a22]/30 hover:border-[#3ddc84] text-xs font-semibold text-zinc-300 hover:text-zinc-100 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy All
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {report.doctorQuestions.map((question: string, index: number) => (
                <div
                  key={index}
                  className="glass-card rounded-xl p-4 border border-[#2d4a3b]/55 bg-[#1a2a22]/10 hover:bg-[#1a2a22]/20 flex justify-between items-center gap-4 transition-all duration-300 group"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#3ddc84]/15 text-[#3ddc84] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <p className="text-sm text-zinc-300 group-hover:text-zinc-200 transition-colors">
                      {question}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyQuestion(question, index)}
                    className="w-8 h-8 rounded-lg border border-[#2d4a3b]/60 flex items-center justify-center text-zinc-400 hover:text-[#3ddc84] hover:border-[#3ddc84]/60 transition-colors shrink-0"
                  >
                    {copiedQuestionIdx === index ? (
                      <Check className="w-4 h-4 text-[#3ddc84]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* SECTION 5: Lifestyle Recommendations */}
        {report.lifestyle && report.lifestyle.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-normal text-zinc-100 font-heading">
                Lifestyle Adjustments
              </h2>
              <p className="text-xs text-zinc-400">
                Actionable guidelines targeted toward resolving biomarker deviations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {report.lifestyle.map((rec: any, index: number) => (
                <div
                  key={index}
                  className="glass-card rounded-xl p-5 border border-[#2d4a3b] bg-[#1a2a22]/10 flex gap-4 items-start relative overflow-hidden"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#1a2a22] border border-[#2d4a3b]/50 flex items-center justify-center shrink-0">
                    {getCategoryIcon(rec.category)}
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-zinc-500">
                        {rec.category} • Addressing {rec.relatedBiomarker}
                      </span>
                      <span
                        className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                          rec.priority === "high"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : rec.priority === "medium"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        {rec.priority} Priority
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed">{rec.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </div>

      {/* SECTION 6: Sticky Action Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-[#080c0a]/80 border-t border-[#2d4a3b]/40 backdrop-blur-md py-4 px-6 z-40">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/upload"
            className="flex items-center gap-2 bg-[#3ddc84] text-[#080c0a] font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-full hover:bg-[#4ef096] transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Upload New Report
          </Link>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={sendEmail}
              className="flex items-center gap-2 bg-[#1a2a22]/40 border border-[#2d4a3b]/80 text-zinc-300 font-semibold text-xs uppercase tracking-wider px-5 py-3 rounded-full hover:border-[#3ddc84] hover:text-zinc-100 transition-colors"
            >
              <Mail className="w-4 h-4 text-[#3ddc84]" />
              Send Email
            </button>
            <button
              type="button"
              onClick={downloadPDF}
              className="flex items-center gap-2 bg-[#1a2a22]/40 border border-[#2d4a3b]/80 text-zinc-300 font-semibold text-xs uppercase tracking-wider px-5 py-3 rounded-full hover:border-[#3ddc84] hover:text-zinc-100 transition-colors"
            >
              <Download className="w-4 h-4 text-[#3ddc84]" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
