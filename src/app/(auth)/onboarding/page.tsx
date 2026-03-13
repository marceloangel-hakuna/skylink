"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INTERESTS = [
  { id: "ai_ml",       label: "AI / ML",      icon: "🤖" },
  { id: "fintech",     label: "Fintech",       icon: "💳" },
  { id: "climate",     label: "Climate Tech",  icon: "🌱" },
  { id: "saas",        label: "SaaS",          icon: "☁️" },
  { id: "web3",        label: "Web3",          icon: "⛓️" },
  { id: "design",      label: "Design",        icon: "🎨" },
  { id: "vc",          label: "VC",            icon: "💼" },
  { id: "product",     label: "Product",       icon: "📦" },
  { id: "devtools",    label: "DevTools",      icon: "🛠️" },
  { id: "biotech",     label: "Biotech",       icon: "🧬" },
];

const MAX_INTERESTS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [flightNumber, setFlightNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleInterest(id: string) {
    setInterests((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= MAX_INTERESTS) return prev;
      return [...prev, id];
    });
  }

  async function finish() {
    setSaving(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Upsert profile with interests + onboarding flag
    const meta = user.user_metadata ?? {};
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: meta.full_name ?? meta.name ?? null,
      avatar_url: meta.avatar_url ?? meta.picture ?? null,
      email: user.email,
      role: meta.headline ?? meta.job_title ?? null,
      company: meta.company ?? meta.organization ?? null,
      interests,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }

    // Save flight if provided
    if (flightNumber.trim()) {
      await supabase.from("flights").insert({
        user_id: user.id,
        flight_number: flightNumber.trim().toUpperCase(),
      });
    }

    router.push("/home");
  }

  // ── Step 0: Interests ──────────────────────────────────────
  if (step === 0) {
    return (
      <div className="min-h-dvh bg-white dark:bg-[#0A0A0B] flex flex-col px-6 pt-14 pb-10">
        {/* Progress */}
        <div className="flex gap-2 mb-10">
          <div className="h-1 flex-1 rounded-full bg-[#4A27E8]" />
          <div className="h-1 flex-1 rounded-full bg-slate-200 dark:bg-white/10" />
        </div>

        <p className="text-xs font-semibold text-[#4A27E8] uppercase tracking-widest mb-3">
          Step 1 of 2
        </p>
        <h2 className="text-2xl font-black text-[#1A1A1A] dark:text-white mb-1">
          What moves you?
        </h2>
        <p className="text-sm text-slate-400 mb-8">
          Pick up to {MAX_INTERESTS} topics you&apos;re passionate about.{" "}
          <span className="text-[#4A27E8] font-semibold">
            {interests.length}/{MAX_INTERESTS} selected
          </span>
        </p>

        <div className="grid grid-cols-2 gap-3 flex-1">
          {INTERESTS.map(({ id, label, icon }) => {
            const selected = interests.includes(id);
            const maxed = interests.length >= MAX_INTERESTS && !selected;
            return (
              <button
                key={id}
                onClick={() => toggleInterest(id)}
                disabled={maxed}
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl border-2 text-left transition-all active:scale-[0.97] ${
                  selected
                    ? "border-[#4A27E8] bg-blue-50 dark:bg-blue-950/40"
                    : maxed
                    ? "border-slate-100 dark:border-white/5 opacity-40"
                    : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5"
                }`}
              >
                <span className="text-2xl leading-none">{icon}</span>
                <span className={`text-sm font-semibold ${
                  selected ? "text-[#4A27E8]" : "text-[#1A1A1A] dark:text-white"
                }`}>
                  {label}
                </span>
                {selected && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-[#4A27E8] flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-8">
          <button
            onClick={() => setStep(1)}
            disabled={interests.length === 0}
            className="w-full py-4 rounded-2xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #4A27E8, #1A1A1A)" }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: Flight number ──────────────────────────────────
  return (
    <div className="min-h-dvh bg-white dark:bg-[#0A0A0B] flex flex-col px-6 pt-14 pb-10">
      {/* Progress */}
      <div className="flex gap-2 mb-10">
        <div className="h-1 flex-1 rounded-full bg-[#4A27E8]" />
        <div className="h-1 flex-1 rounded-full bg-[#4A27E8]" />
      </div>

      <p className="text-xs font-semibold text-[#4A27E8] uppercase tracking-widest mb-3">
        Step 2 of 2
      </p>
      <h2 className="text-2xl font-black text-[#1A1A1A] dark:text-white mb-1">
        What&apos;s your flight?
      </h2>
      <p className="text-sm text-slate-400 mb-8">
        We&apos;ll find professionals on your flight to connect with.
      </p>

      {/* Flight input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"/>
          </svg>
        </div>
        <input
          type="text"
          placeholder="e.g. AA 247, UA 890"
          value={flightNumber}
          onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
          className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/10 rounded-2xl text-sm font-mono font-semibold text-[#1A1A1A] dark:text-white placeholder:text-slate-300 placeholder:font-sans placeholder:font-normal border-0 focus:outline-none focus:ring-2 focus:ring-[#4A27E8] transition tracking-widest"
          maxLength={8}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-500 bg-red-50 dark:bg-red-950/40 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-8">
        <button
          onClick={finish}
          disabled={saving}
          className="w-full py-4 rounded-2xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #4A27E8, #1A1A1A)" }}
        >
          {saving ? (
            <>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              Setting up your profile…
            </>
          ) : (
            "Let's fly →"
          )}
        </button>

        <button
          onClick={finish}
          disabled={saving}
          className="text-sm text-slate-400 dark:text-slate-500 text-center py-2"
        >
          Skip for now
        </button>

        <button
          onClick={() => setStep(0)}
          disabled={saving}
          className="text-sm text-slate-400 dark:text-slate-500 text-center py-1"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
