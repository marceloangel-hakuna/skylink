"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

function CallbackError({ onError }: { onError: (msg: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const err = searchParams.get("error");
    if (err) onError(err);
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
  const [loading, setLoading] = useState<"google" | "linkedin" | "email" | null>(null);
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

  async function handleLinkedIn() {
    setLoading("linkedin");
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        scopes: "openid profile email",
      },
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

  if (emailSent) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-8 text-center" style={{ backgroundColor: "#3D32CF" }}>
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="white"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
        <p className="text-sm text-white/60 mb-6">
          We sent a confirmation link to <strong className="text-white">{email}</strong>
        </p>
        <button onClick={() => { setEmailSent(false); setShowEmail(false); }} className="text-sm font-semibold text-white underline">
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden" style={{ backgroundColor: "#3D32CF" }}>
      <Suspense fallback={null}>
        <CallbackError onError={setError} />
      </Suspense>

      {/* Paper plane animation — behind logo */}
      <div className="plane-container" aria-hidden="true">
        <svg className="paper-plane" width="44" height="44" viewBox="0 0 44 44" fill="none">
          <path d="M2 22L42 22L28 6L2 22Z" fill="white" fillOpacity="0.95"/>
          <path d="M2 22L42 22L28 38L2 22Z" fill="white" fillOpacity="0.55"/>
          <line x1="28" y1="22" x2="14" y2="22" stroke="white" strokeWidth="1" strokeOpacity="0.4"/>
        </svg>
      </div>

      {/* Logo — higher z-index so plane passes behind */}
      <div className="flex-1 flex items-center justify-center px-6 pt-16 relative" style={{ zIndex: 2 }}>
        <Image
          src="/icons/logo-transparent.png"
          alt="SkyLink"
          width={360}
          height={200}
          priority
          className="w-full max-w-[238px] select-none"
        />
      </div>

      {/* Auth section */}
      <div className="px-6 pb-10 flex flex-col gap-3" style={{ paddingBottom: "max(40px, env(safe-area-inset-bottom))" }}>

        {error && (
          <p className="text-xs text-red-300 bg-white/10 rounded-xl px-4 py-3 text-center">
            {error}
          </p>
        )}

        {!showEmail ? (
          <>
            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-3 bg-white rounded-2xl py-[15px] text-sm font-semibold text-[#1E1878] shadow-sm active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {loading === "google" ? <Spinner dark /> : <GoogleLogo />}
              Continue with Google
            </button>

            {/* LinkedIn */}
            <button
              onClick={handleLinkedIn}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-3 rounded-2xl py-[15px] text-sm font-semibold text-white active:scale-[0.98] transition-all disabled:opacity-60"
              style={{ backgroundColor: "#0A66C2" }}
            >
              {loading === "linkedin" ? <Spinner /> : <LinkedInLogo />}
              Continue with LinkedIn
            </button>

            {/* Email link */}
            <div className="flex items-center justify-center pt-2">
              <button
                onClick={() => setShowEmail(true)}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Sign up with email
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
            <div className="flex bg-white/10 rounded-full p-1">
              {(["Sign in", "Sign up"] as const).map((label, i) => (
                <button key={label} type="button" onClick={() => setIsSignUp(i === 1)}
                  className={`flex-1 text-sm font-semibold py-2 rounded-full transition-all ${
                    isSignUp === (i === 1) ? "bg-white text-[#1E1878] shadow-sm" : "text-white/60"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <input type="email" required placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/10 border-0 rounded-2xl px-4 py-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
            />
            <input type="password" required placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/10 border-0 rounded-2xl px-4 py-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
            />
            <button type="submit" disabled={loading !== null}
              className="w-full rounded-2xl py-[15px] text-sm font-semibold text-[#3D32CF] bg-white active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading === "email" ? <Spinner dark /> : (isSignUp ? "Create account" : "Sign in")}
            </button>
            <button type="button" onClick={() => { setShowEmail(false); setError(null); }}
              className="text-sm text-white/60 text-center pt-1"
            >
              ← Back
            </button>
          </form>
        )}

        <p className="text-center text-[11px] text-white/30 mt-1 px-4">
          By continuing you agree to our{" "}
          <span className="underline">Terms of Service</span> and{" "}
          <span className="underline">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}

function Spinner({ dark }: { dark?: boolean }) {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={dark ? "#1E1878" : "white"} strokeWidth="3" strokeOpacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke={dark ? "#1E1878" : "white"} strokeWidth="3" strokeLinecap="round"/>
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

function LinkedInLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}
