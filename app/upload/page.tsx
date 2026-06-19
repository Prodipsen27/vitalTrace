"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { FileUp, File, Trash2, ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import VoiceInput from "@/components/VoiceInput";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAnalysis } from "@/lib/context/AnalysisContext";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const { isAnalyzing, startAnalysis } = useAnalysis();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      if (user) {
        setPatientId(user.id);
        setPatientName(user.user_metadata?.full_name || "");
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    if (isAnalyzing) {
      router.push("/processing");
    }
  }, [isAnalyzing, router]);

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

    if (!patientName.trim()) {
      alert("Please enter a patient name.");
      return;
    }

    await startAnalysis(file, transcript, patientId, patientName);
  };

  const handleLogout = async () => {
    await supabaseBrowser.auth.signOut();
    router.push("/login");
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
          <div className="flex items-center gap-3">
            <Link
              href="/history"
              className="text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-[#3ddc84] transition-colors border border-[#2d4a3b]/40 bg-[#1a2a22]/10 px-4 py-2 rounded-full hover:border-[#3ddc84]/40"
            >
              View History
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

        {/* Title */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h1 className="text-4xl font-normal tracking-tight font-heading text-zinc-100">
            Upload Your <span className="text-[#3ddc84] italic">Biomarkers</span>
          </h1>
          <p className="text-sm text-zinc-400">
            Provide a lab report PDF or voice record the values to run the agent network
          </p>
        </div>

        <div className="space-y-8">
          {/* Patient Name Input */}
          <div className="glass-card rounded-xl p-5 border border-[#2d4a3b]/60 bg-[#1a2a22]/10 max-w-md mx-auto space-y-2">
            <label className="text-xs uppercase font-extrabold tracking-wider text-zinc-400 block text-center">
              Patient Name
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Enter patient name"
              className="w-full bg-[#080c0a] border border-[#2d4a3b]/60 focus:border-[#3ddc84] p-3 rounded-lg text-sm text-zinc-100 text-center transition-colors placeholder-zinc-600 outline-none"
            />
          </div>

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
        </div>
      </div>
    </main>
  );
}
