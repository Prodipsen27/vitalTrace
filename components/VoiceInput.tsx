"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import clsx from "clsx";

interface VoiceInputProps {
  onTranscriptChange: (text: string) => void;
  transcript: string;
}

export default function VoiceInput({ onTranscriptChange, transcript }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onTranscriptChange(transcript ? transcript + " " + finalTranscript : finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, [transcript, onTranscriptChange]);

  const toggleRecording = () => {
    if (!isSupported) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  return (
    <div className="glass-card rounded-xl p-6 border border-[#2d4a3b] bg-[#1a2a22]/20 flex flex-col items-center space-y-5 h-full justify-between">
      <div className="text-center w-full">
        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block mb-1">
          Input Option B
        </span>
        <h3 className="text-lg font-bold text-zinc-200">Voice Dictation</h3>
        <p className="text-xs text-zinc-400 mt-1">
          Read aloud your biomarker results or doctor notes
        </p>
      </div>

      {/* Mic Button & Waveform */}
      <div className="flex flex-col items-center justify-center space-y-4 my-4">
        <button
          type="button"
          onClick={toggleRecording}
          disabled={!isSupported}
          className={clsx(
            "w-20 h-20 rounded-full flex items-center justify-center border transition-all duration-500 relative group",
            {
              "bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse":
                isRecording,
              "bg-[#1a2a22]/60 border-[#3ddc84]/40 text-[#3ddc84] hover:border-[#3ddc84] hover:shadow-[0_0_20px_rgba(61,220,132,0.2)]":
                !isRecording && isSupported,
              "bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed": !isSupported,
            }
          )}
        >
          {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}

          {/* Glowing rings */}
          {isRecording && (
            <>
              <span className="absolute -inset-2 rounded-full border border-red-500/30 animate-ping" />
              <span className="absolute -inset-4 rounded-full border border-red-500/10 animate-ping [animation-delay:0.3s]" />
            </>
          )}
        </button>

        {isRecording && (
          <div className="flex items-center gap-1">
            <span className="w-1 h-3 bg-red-400 rounded-full animate-bounce [animation-delay:0.1s]" />
            <span className="w-1 h-5 bg-red-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1 h-4 bg-red-400 rounded-full animate-bounce [animation-delay:0.3s]" />
            <span className="w-1 h-6 bg-red-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            <span className="w-1 h-3 bg-red-400 rounded-full animate-bounce [animation-delay:0.5s]" />
          </div>
        )}

        {!isSupported && (
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] bg-zinc-900/60 px-3 py-1 rounded-full border border-zinc-800">
            <AlertCircle className="w-3.5 h-3.5" />
            Speech Recognition not supported in this browser
          </div>
        )}
      </div>

      {/* Transcription Output or Fallback */}
      <div className="w-full space-y-3">
        <label className="text-xs font-bold text-zinc-400 block">
          {isRecording ? "Live Transcript..." : "Pasted / Transcribed Report"}
        </label>
        <textarea
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          placeholder="Paste health report raw text here, or click the mic to begin transcribing..."
          className="w-full h-32 bg-[#080c0a]/60 border border-[#2d4a3b]/40 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#3ddc84] focus:ring-1 focus:ring-[#3ddc84] transition-all resize-none font-mono"
        />
      </div>
    </div>
  );
}
