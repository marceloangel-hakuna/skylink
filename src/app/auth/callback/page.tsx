"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();
  const handled = useRef(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    async function handleCallback() {
      // ── PKCE flow: ?code= in query string ─────────────────
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.replace("/home");
          return;
        }
        setErrorMsg(error.message);
        return;
      }

      // ── Implicit flow: tokens in URL hash ─────────────────
      // Supabase browser client auto-parses the hash on getSession()
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/home");
        return;
      }

      // Listen for auth state change (fires after hash is parsed)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (session) {
            subscription.unsubscribe();
            router.replace("/home");
          }
        }
      );

      // Timeout fallback — if nothing fires in 8s, show an error
      setTimeout(() => {
        subscription.unsubscribe();
        setErrorMsg("Sign-in timed out. Please try again.");
      }, 8000);
    }

    handleCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (errorMsg) {
    return (
      <div className="min-h-dvh bg-white dark:bg-[#0A0A0B] flex flex-col items-center justify-center px-8 text-center gap-4">
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 px-4 py-3 rounded-2xl max-w-xs">
          {errorMsg}
        </p>
        <button
          onClick={() => router.replace("/login")}
          className="text-sm font-semibold text-[#2B88D8]"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white dark:bg-[#0A0A0B] flex flex-col items-center justify-center gap-4">
      <svg className="animate-spin text-[#2B88D8]" width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      <p className="text-sm text-slate-400">Signing you in…</p>
    </div>
  );
}
