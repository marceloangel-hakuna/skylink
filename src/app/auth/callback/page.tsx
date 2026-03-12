"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const handled = useRef(false);
  const [diag, setDiag] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const supabase = createClient();

    async function handleCallback() {
      const search = window.location.search;
      const hash = window.location.hash;
      const params = new URLSearchParams(search);
      const hashParams = new URLSearchParams(hash.replace(/^#/, ""));

      // Show diagnostics so we can see exactly what Supabase sent back
      setDiag(
        `search: "${search}" | hash keys: "${Array.from(hashParams.keys()).join(",") || "none"}"`
      );

      // ── PKCE flow: ?code= in query string ─────────────────
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) { router.replace("/home"); return; }
        setErrorMsg(`Exchange failed: ${error.message}`);
        return;
      }

      // ── Supabase error returned in query string ────────────
      const oauthError = params.get("error_description") ?? params.get("error");
      if (oauthError) {
        setErrorMsg(`OAuth error: ${oauthError}`);
        return;
      }

      // ── Implicit flow: tokens in URL hash ─────────────────
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error) { router.replace("/home"); return; }
        setErrorMsg(`Session error: ${error.message}`);
        return;
      }

      // ── Last resort: check if session already established ──
      const { data: { session } } = await supabase.auth.getSession();
      if (session) { router.replace("/home"); return; }

      setErrorMsg(`No auth tokens found in URL. search="${search}" hash="${hash}"`);
    }

    handleCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (errorMsg) {
    return (
      <div className="min-h-dvh bg-white dark:bg-[#0A0A0B] flex flex-col items-center justify-center px-8 text-center gap-4">
        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 px-4 py-3 rounded-2xl max-w-sm break-all font-mono">
          {errorMsg}
        </p>
        <button onClick={() => router.replace("/login")} className="text-sm font-semibold text-[#2B88D8]">
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
      {diag && <p className="text-[10px] text-slate-300 font-mono px-4 text-center break-all max-w-sm">{diag}</p>}
    </div>
  );
}
