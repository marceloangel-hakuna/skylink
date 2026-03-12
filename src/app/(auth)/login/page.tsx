"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Reads ?error= from the callback and injects it into the parent via callback
function CallbackError({ onError }: { onError: (msg: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const err = searchParams.get("error");
    if (err) onError(`Auth error: ${err}`);
  }, [searchParams, onError]);
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [showEmail, setShowEmail] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"google" | "apple" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  async function handleGoogle() {
    setLoading("google");
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(null); }
  }

  async function handleApple() {
    setLoading("apple");
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(null); }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading("email");
    setError(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) { setError(error.message); setLoading(null); return; }
      setEmailSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(null); return; }
      router.push("/home");
    }
    setLoading(null);
  }

  // ── Email sent confirmation ────────────────────────────
  if (emailSent) {
    return (
      <div className="min-h-dvh bg-white dark:bg-[#0A0A0B] flex flex-col items-center justify-center px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="#2B88D8"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#0A1E3D] dark:text-white mb-2">Check your inbox</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          We sent a confirmation link to <strong className="text-[#0A1E3D] dark:text-white">{email}</strong>
        </p>
        <button
          onClick={() => { setEmailSent(false); setShowEmail(false); }}
          className="text-sm font-semibold text-[#2B88D8]"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white dark:bg-[#0A0A0B] flex flex-col">
      <Suspense fallback={null}>
        <CallbackError onError={setError} />
      </Suspense>

      {/* Top spacer */}
      <div className="flex-1" />

      {/* Wordmark + subtitle */}
      <div className="flex flex-col items-center px-8 pt-safe">
        <h1 className="text-[42px] font-black tracking-tight leading-none select-none">
          <span style={{ color: "#2B88D8" }}>Sky</span>
          <span style={{ color: "#0A1E3D" }} className="dark:text-white">Link</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400 dark:text-slate-500 tracking-wide">
          Network at 36,000 feet
        </p>
      </div>

      <div className="flex-[2]" />

      {/* Auth section */}
      <div className="px-6 pb-10 pb-safe flex flex-col gap-3">

        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/50 rounded-xl px-4 py-3 text-center">
            {error}
          </p>
        )}

        {!showEmail ? (
          <>
            {/* Google button */}
            <button
              onClick={handleGoogle}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-white border border-[#E2E8F0] rounded-2xl py-[15px] text-sm font-semibold text-[#0A1E3D] shadow-sm active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {loading === "google" ? (
                <Spinner dark />
              ) : (
                <GoogleLogo />
              )}
              Continue with Google
            </button>

            {/* Apple button */}
            <button
              onClick={handleApple}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-3 bg-[#0A0A0B] dark:bg-white dark:text-[#0A0A0B] rounded-2xl py-[15px] text-sm font-semibold text-white active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {loading === "apple" ? (
                <Spinner />
              ) : (
                <AppleLogo className="dark:fill-[#0A0A0B]" />
              )}
              Continue with Apple
            </button>

            {/* Email link */}
            <div className="flex items-center justify-center pt-2">
              <button
                onClick={() => setShowEmail(true)}
                className="text-sm text-slate-400 dark:text-slate-500 hover:text-[#2B88D8] transition-colors"
              >
                Sign up with email
              </button>
            </div>
          </>
        ) : (
          /* Email form */
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
            <div className="flex bg-[#F5F7FA] dark:bg-white/10 rounded-full p-1">
              {(["Sign in", "Sign up"] as const).map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setIsSignUp(i === 1)}
                  className={`flex-1 text-sm font-semibold py-2 rounded-full transition-all ${
                    isSignUp === (i === 1)
                      ? "bg-white dark:bg-white/20 text-[#0A1E3D] dark:text-white shadow-sm"
                      : "text-slate-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#F5F7FA] dark:bg-white/10 border-0 rounded-2xl px-4 py-4 text-sm text-[#0A1E3D] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2B88D8] transition"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#F5F7FA] dark:bg-white/10 border-0 rounded-2xl px-4 py-4 text-sm text-[#0A1E3D] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2B88D8] transition"
            />

            <button
              type="submit"
              disabled={loading !== null}
              className="w-full rounded-2xl py-[15px] text-sm font-semibold text-white active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #2B88D8, #0A1E3D)" }}
            >
              {loading === "email" ? <Spinner /> : (isSignUp ? "Create account" : "Sign in")}
            </button>

            <button
              type="button"
              onClick={() => { setShowEmail(false); setError(null); }}
              className="text-sm text-slate-400 dark:text-slate-500 text-center pt-1"
            >
              ← Back
            </button>
          </form>
        )}

        {/* Terms */}
        <p className="text-center text-[11px] text-slate-300 dark:text-slate-600 mt-1 px-4">
          By continuing you agree to our{" "}
          <span className="underline">Terms of Service</span> and{" "}
          <span className="underline">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function Spinner({ dark }: { dark?: boolean }) {
  return (
    <svg
      className="animate-spin"
      width="18" height="18" viewBox="0 0 24 24" fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke={dark ? "#0A1E3D" : "white"} strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={dark ? "#0A1E3D" : "white"} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg width="17" height="20" viewBox="0 0 814 1000" className={className}>
      <path
        fill="white"
        d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.8-155.5-127.4C46 790.7 0 663.4 0 541.8c0-207.4 135.4-317 269-317 79.4 0 146 52.3 196.1 52.3 47.8 0 122.6-55.5 210.6-55.5zm-130.5-209.4c31.7-37.6 54.3-89.7 54.3-141.8 0-7.1-.6-14.3-1.9-20.1-51.5 2-112.3 34.3-148.8 75.8-28.5 32.4-55.1 84.5-55.1 137.3 0 7.7 1.3 15.4 1.9 17.9 3.2.6 8.4 1.3 13.6 1.3 46.5 0 102.5-30.4 136-70.4z"
      />
    </svg>
  );
}
