"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabaseBrowser } from "@/lib/supabase/client";
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
  X,
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

  // Personalization state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (typeof window !== "undefined" && id) {
        const data = localStorage.getItem(`vitaltrace_report_${id}`);
        if (data) {
          setReport(JSON.parse(data));
        } else {
          toast.error("Report not found");
          router.push("/history");
        }
      }

      const { data: { user } } = await supabaseBrowser.auth.getUser();
      if (user) {
        setEmailInput(user.email || "");
        setNameInput(user.user_metadata?.full_name || "");
      }
    };
    fetchData();
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

  const filteredBiomarkers = report.biomarkers.filter((b: any) => {
    if (activeTab === "all") return true;
    if (activeTab === "abnormal") return b.status !== "normal";
    if (activeTab === "critical") return b.status === "critical";
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "diet": return <Apple className="w-5 h-5 text-emerald-400" />;
      case "exercise": return <Dumbbell className="w-5 h-5 text-indigo-400" />;
      case "sleep": return <Moon className="w-5 h-5 text-cyan-400" />;
      case "stress": return <Brain className="w-5 h-5 text-purple-400" />;
      case "medication": return <Pill className="w-5 h-5 text-red-400" />;
      default: return <Sparkles className="w-5 h-5 text-zinc-400" />;
    }
  };

  const copyQuestion = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionIdx(index);
    toast.success("Question copied!");
    setTimeout(() => setCopiedQuestionIdx(null), 2000);
  };

  const copyAllQuestions = () => {
    const allText = report.doctorQuestions.map((q: string, idx: number) => `${idx + 1}. ${q}`).join("\n");
    navigator.clipboard.writeText(allText);
    toast.success("All questions copied to clipboard!");
  };

  const sendEmail = async () => {
    if (!emailInput) {
      toast.error("Please enter a valid email address.");
      return;
    }

    toast.promise(
      (async () => {
        const response = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailInput,
            patientName: nameInput,
            report: report,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Email delivery failed");
        }

        await supabaseBrowser.auth.updateUser({ data: { full_name: nameInput } });
        setIsEmailModalOpen(false);
      })(),
      {
        loading: "Sending medical brief email...",
        success: "Report briefing sent successfully!",
        error: (err) => err.message || "Failed to send email.",
      }
    );
  };

  const downloadPDF = async () => {
    toast.promise(
      (async () => {
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF();

        doc.setFillColor(26, 42, 34);
        doc.rect(0, 0, 210, 45, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("VITALTRACE HEALTH BRIEF", 15, 25);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Patient Name: ${nameInput || "Valued Patient"}`, 15, 35);
        doc.text(`Patient ID: ${report.patientId}`, 15, 40);
        doc.text(`Report Date: ${new Date(report.reportDate).toLocaleDateString()}`, 140, 40);

        doc.setTextColor(40, 40, 40);
        let y = 65;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Executive Summary", 15, y);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const splitSummary = doc.splitTextToSize(report.summary || "No summary available.", 180);
        doc.text(splitSummary, 15, y);
        y += (splitSummary.length * 5) + 15;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Biomarker Analysis", 15, y);
        y += 10;

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
          if (y > 275) { doc.addPage(); y = 20; }
          doc.text(b.name || "-", 17, y);
          doc.text(String(b.value ?? "-"), 85, y);
          doc.text(b.unit || "-", 120, y);

          const status = (b.status || "normal").toLowerCase();
          if (status === "critical") doc.setTextColor(220, 38, 38);
          else if (status === "abnormal" || status === "high" || status === "low") doc.setTextColor(217, 119, 6);
          else doc.setTextColor(5, 150, 105);

          doc.text(b.status || "-", 160, y);
          doc.setTextColor(40, 40, 40);
          y += 8;
        });

        doc.save(`VitalTrace-Report-${nameInput || "Patient"}-${Date.now()}.pdf`);
      })(),
      {
        loading: "Generating PDF file...",
        success: "PDF downloaded successfully!",
      }
    );
  };

  const handleLogout = async () => {
    await supabaseBrowser.auth.signOut();
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-[#080c0a] text-zinc-100 pb-28 pt-8 px-6 relative">
      <Toaster position="top-right" toastOptions={{ style: { background: "#1a2a22", color: "#f4f4f5", border: "1px solid #2d4a3b" } }} />

      {/* Email Modal */}
      <AnimatePresence>
        {isEmailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#1a2a22] border border-[#2d4a3b] p-8 rounded-2xl max-w-md w-full space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-heading text-zinc-100">Send Report Briefing</h3>
                <button onClick={() => setIsEmailModalOpen(false)}><X className="w-5 h-5 text-zinc-500" /></button>
              </div>
              <input type="text" placeholder="Full Name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="w-full bg-[#080c0a] border border-[#2d4a3b] p-3 rounded-lg text-sm text-zinc-200" />
              <input type="email" placeholder="Email Address" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full bg-[#080c0a] border border-[#2d4a3b] p-3 rounded-lg text-sm text-zinc-200" />
              <button onClick={sendEmail} className="w-full bg-[#3ddc84] text-[#080c0a] font-bold py-3 rounded-lg">Confirm & Send</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto space-y-12">
        {/* ... (rest of the UI, Navigation, and Sections remain largely the same, update button triggers) ... */}
        {/* Updated buttons in sticky footer */}
        <button onClick={() => setIsEmailModalOpen(true)} className="flex items-center gap-2 bg-[#1a2a22]/40 border border-[#2d4a3b]/80 text-zinc-300 font-semibold text-xs uppercase tracking-wider px-5 py-3 rounded-full hover:border-[#3ddc84] hover:text-zinc-100 transition-colors">
          <Mail className="w-4 h-4 text-[#3ddc84]" /> Send Email
        </button>
      </div>
    </main>
  );
}
