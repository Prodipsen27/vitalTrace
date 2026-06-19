import type { Metadata } from "next";
import localFont from "next/font/local";
import { Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});

export const metadata: Metadata = {
  title: "VitalTrace — Your Health Report, Explained",
  description: "AI-powered clinical biomarker extraction, pattern detection, and personalized health recommendations.",
};

import { AnalysisProvider } from "@/lib/context/AnalysisContext";
import GlobalAnalysisBanner from "@/components/GlobalAnalysisBanner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${instrumentSerif.variable} font-sans antialiased bg-[#080c0a] text-zinc-100 min-h-screen selection:bg-[#3ddc84]/30 selection:text-[#3ddc84]`}
      >
        <div className="noise-overlay pointer-events-none fixed inset-0 z-50 opacity-[0.015]" />
        <AnalysisProvider>
          {children}
          <GlobalAnalysisBanner />
        </AnalysisProvider>
      </body>
    </html>
  );
}
