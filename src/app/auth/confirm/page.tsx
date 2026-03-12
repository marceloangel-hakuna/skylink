"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Handles implicit-flow OAuth tokens that arrive as a URL hash fragment
// (e.g. #access_token=...&refresh_token=...) which the server cannot read.
export default function AuthConfirmPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.replace("/home");
      }
    });

    // Trigger Supabase to parse the hash and set the session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/home");
    });
  }, [router, supabase]);

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
