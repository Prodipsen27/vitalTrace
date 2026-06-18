"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Activity, Database, Heart, ClipboardCheck, ArrowRight, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  useEffect(() => {
    // Generate and persist patient ID on first visit
    if (typeof window !== "undefined") {
      let patientId = localStorage.getItem("vitaltrace_patient_id");
      if (!patientId) {
        patientId = uuidv4();
        localStorage.setItem("vitaltrace_patient_id", patientId);
      }
    }
  }, []);

  return (
    <main className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[#080c0a] text-zinc-200">
      {/* Background glowing decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto py-16">
        {/* Heartbeat pulse icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="relative flex items-center justify-center w-24 h-24 rounded-full bg-[#1a2a22] border border-[#2d4a3b]/60 mb-8 pulse-glow"
        >
          <Heart className="w-10 h-10 text-[#3ddc84]" fill="rgba(61, 220, 132, 0.2)" />
        </motion.div>

        {/* Logo and Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8 }}
          className="space-y-4"
        >
          <span className="text-[11px] uppercase font-bold tracking-[0.25em] text-[#3ddc84] bg-[#3ddc84]/10 border border-[#3ddc84]/20 px-3.5 py-1 rounded-full inline-flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            Clinical Agent Network
          </span>
          <h1 className="text-6xl md:text-8xl font-normal text-zinc-100 tracking-tight leading-none font-heading">
            Vital<span className="text-[#3ddc84] italic">Trace</span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 font-light max-w-xl mx-auto tracking-wide">
            Your health report. Finally explained.
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mt-10"
        >
          <Link
            href="/upload"
            className="group px-8 py-4 bg-[#3ddc84] text-[#080c0a] font-bold rounded-full flex items-center gap-2 hover:bg-[#4ef096] transition-all hover:scale-105 hover:shadow-[0_0_35px_rgba(61,220,132,0.4)]"
          >
            Analyze Your Report
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="w-full max-w-5xl mx-auto px-6 pb-16 z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="glass-card rounded-2xl p-6 border border-[#2d4a3b]/40 bg-[#1a2a22]/20 relative overflow-hidden group hover:border-[#3ddc84]/40 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-[#1a2a22] border border-[#2d4a3b]/60 flex items-center justify-center mb-4 text-[#3ddc84] group-hover:bg-[#3ddc84]/15 transition-all">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2">AI Extraction</h3>
            <p className="text-sm text-zinc-400 font-light leading-relaxed">
              Instantly extract structured medical biomarkers and clinical values from raw files or voice dictate dictations with precision.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="glass-card rounded-2xl p-6 border border-[#2d4a3b]/40 bg-[#1a2a22]/20 relative overflow-hidden group hover:border-[#3ddc84]/40 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-[#1a2a22] border border-[#2d4a3b]/60 flex items-center justify-center mb-4 text-[#3ddc84] group-hover:bg-[#3ddc84]/15 transition-all">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2">Pattern Detection</h3>
            <p className="text-sm text-zinc-400 font-light leading-relaxed">
              Trace historical data patterns over time. Monitor your health trajectory using vector semantic history mapping.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="glass-card rounded-2xl p-6 border border-[#2d4a3b]/40 bg-[#1a2a22]/20 relative overflow-hidden group hover:border-[#3ddc84]/40 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-[#1a2a22] border border-[#2d4a3b]/60 flex items-center justify-center mb-4 text-[#3ddc84] group-hover:bg-[#3ddc84]/15 transition-all">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2">Doctor Prep</h3>
            <p className="text-sm text-zinc-400 font-light leading-relaxed">
              Get personalized clinical explanations and a structured list of targeted questions to consult your physician.
            </p>
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="flex flex-col md:flex-row justify-between items-center text-zinc-600 text-xs mt-12 border-t border-[#2d4a3b]/20 pt-6 gap-4">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#3ddc84]" />
            Your medical records are stored locally on your device.
          </span>
          <div className="flex gap-4">
            <Link href="/history" className="hover:text-[#3ddc84] transition-colors">
              Access Past Analyses
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
