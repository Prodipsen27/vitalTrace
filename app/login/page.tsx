"use client";

import React, { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Database } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      if (user) {
        router.push("/upload");
      } else {
        setLoading(false);
      }
    };
    checkUser();

    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          router.push("/upload");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-200">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-zinc-400 font-medium">Checking active session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 shadow-[0_0_50px_-12px_rgba(16,185,129,0.3)]">
            <Database className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-zinc-100 font-display">
            Welcome to VitalTrace
          </h2>
          <p className="mt-2 text-sm text-zinc-400 font-medium">
            Sign in or create an account to start explaining your biomarkers
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-md">
          <Auth
            supabaseClient={supabaseBrowser}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#10b981",
                    brandAccent: "#059669",
                    inputBackground: "#18181b",
                    inputText: "#f4f4f5",
                    inputBorder: "#27272a",
                    inputPlaceholder: "#71717a",
                    inputBorderFocus: "#10b981",
                    inputBorderHover: "#3f3f46",
                  },
                },
              },
            }}
            providers={[]}
            theme="dark"
            redirectTo={`${typeof window !== "undefined" ? window.location.origin : ""}/upload`}
          />
        </div>
      </motion.div>
    </div>
  );
}
