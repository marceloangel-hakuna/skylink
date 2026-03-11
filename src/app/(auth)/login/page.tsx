"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push("/home");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/onboarding` },
      });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push("/onboarding");
    }
    setLoading(false);
  }

  async function handleMagicLink() {
    if (!email) { setError("Enter your email first"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/home` },
    });
    if (error) { setError(error.message); }
    else { setMagicSent(true); }
    setLoading(false);
  }

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Hero gradient */}
      <div className="gradient-sky flex flex-col items-center justify-center pt-16 pb-10 px-6 relative overflow-hidden">
        {/* Decorative plane paths */}
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
          <svg className="absolute top-4 right-8 w-32 h-32 rotate-12" viewBox="0 0 100 100" fill="white">
            <path d="M50 5 L95 50 L80 50 L80 80 L65 80 L65 50 L35 50 L35 80 L20 80 L20 50 L5 50 Z" />
          </svg>
        </div>

        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4 shadow-glass">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
            <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z" />
          </svg>
        </div>

        <h1 className="text-3xl font-black text-white tracking-tight">SkyLink</h1>
        <p className="text-sky-200 text-sm mt-1.5 text-center max-w-[220px]">
          Network at 35,000 ft with fellow business travelers
        </p>
      </div>

      {/* Auth card */}
      <div className="flex-1 bg-surface rounded-t-4xl -mt-6 px-6 pt-8 pb-10 flex flex-col gap-6">

        {/* Mode toggle */}
        <div className="flex bg-surface-muted rounded-full p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); }}
              className={`flex-1 text-sm font-semibold py-2 rounded-full transition-all ${
                mode === m
                  ? "bg-white text-sky-700 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              {m === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {magicSent ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="#0A63CA" />
              </svg>
            </div>
            <p className="font-bold text-navy-800">Check your inbox!</p>
            <p className="text-sm text-slate-500 mt-1">We sent a magic link to <strong>{email}</strong></p>
            <button onClick={() => setMagicSent(false)} className="mt-4 btn-ghost text-sm">Back</button>
          </div>
        ) : (
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">Email</label>
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
              {loading ? "Loading…" : mode === "signin" ? "Sign In" : "Create Account"}
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="h-px flex-1 bg-surface-border" />
              <span className="text-xs text-slate-400">or</span>
              <div className="h-px flex-1 bg-surface-border" />
            </div>

            <button
              type="button"
              onClick={handleMagicLink}
              disabled={loading}
              className="btn-secondary w-full"
            >
              Send magic link
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-400 mt-auto">
          By continuing you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
