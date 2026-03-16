"use client";

import { useState, useEffect } from "react";
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
  const router  = useRouter();
  const supabase = createClient();

  const [step,         setStep]         = useState(0);
  const [interests,    setInterests]    = useState<string[]>([]);
  const [role,         setRole]         = useState("");
  const [company,      setCompany]      = useState("");
  const [bio,          setBio]          = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // Pre-populate professional fields from LinkedIn / OAuth metadata
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const m = user.user_metadata ?? {};
      setRole(m.headline ?? m.job_title ?? m.title ?? "");
      setCompany(m.company ?? m.organization ?? m.employer ?? "");
      setBio(m.bio ?? m.summary ?? m.description ?? "");
    });
  }, [supabase]);

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

    const meta = user.user_metadata ?? {};
    const { error: profileError } = await supabase.from("profiles").upsert({
      id:                 user.id,
      full_name:          meta.full_name ?? meta.name ?? null,
      avatar_url:         meta.avatar_url ?? meta.picture ?? null,
      email:              user.email,
      role:               role.trim() || null,
      company:            company.trim() || null,
      bio:                bio.trim() || null,
      interests,
      onboarding_complete: true,
      updated_at:         new Date().toISOString(),
    });

    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }

    if (flightNumber.trim()) {
      await supabase.from("flights").insert({
        user_id:       user.id,
        flight_number: flightNumber.trim().toUpperCase(),
      });
    }

    // Award signup points (only if not already awarded)
    const { count } = await supabase
      .from("points")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("reason", "Welcome to SkyLink");
    if (!count || count === 0) {
      await supabase.from("points").insert({
        user_id: user.id,
        amount:  500,
        reason:  "Welcome to SkyLink",
      });
    }

    router.push("/home");
  }

  const TOTAL_STEPS = 3;

  // ── Step 0: Interests ──────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="min-h-dvh bg-white dark:bg-[#0A0A0B] flex flex-col px-6 pt-14 pb-10">
        <div className="flex gap-2 mb-10">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= 0 ? "bg-[#4A27E8]" : "bg-slate-200 dark:bg-white/10"}`} />
          ))}
        </div>
        <p className="text-xs font-semibold text-[#4A27E8] uppercase tracking-widest mb-3">Step 1 of {TOTAL_STEPS}</p>
        <h2 className="text-2xl font-black text-[#1A1A1A] dark:text-white mb-1">What moves you?</h2>
        <p className="text-sm text-slate-400 mb-8">
          Pick up to {MAX_INTERESTS} topics you&apos;re passionate about.{" "}
          <span className="text-[#4A27E8] font-semibold">{interests.length}/{MAX_INTERESTS} selected</span>
        </p>
        <div className="grid grid-cols-2 gap-3 flex-1">
          {INTERESTS.map(({ id, label, icon }) => {
            const selected = interests.includes(id);
            const maxed    = interests.length >= MAX_INTERESTS && !selected;
            return (
              <button key={id} onClick={() => toggleInterest(id)} disabled={maxed}
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl border-2 text-left transition-all active:scale-[0.97] ${
                  selected ? "border-[#4A27E8] bg-blue-50 dark:bg-blue-950/40"
                  : maxed   ? "border-slate-100 dark:border-white/5 opacity-40"
                  : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5"}`}>
                <span className="text-2xl leading-none">{icon}</span>
                <span className={`text-sm font-semibold ${selected ? "text-[#4A27E8]" : "text-[#1A1A1A] dark:text-white"}`}>{label}</span>
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
          <button onClick={() => setStep(1)} disabled={interests.length === 0}
            className="w-full py-4 rounded-2xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #4A27E8, #1A1A1A)" }}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: Professional Info ──────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="min-h-dvh bg-white dark:bg-[#0A0A0B] flex flex-col px-6 pt-14 pb-10">
        <div className="flex gap-2 mb-10">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= 1 ? "bg-[#4A27E8]" : "bg-slate-200 dark:bg-white/10"}`} />
          ))}
        </div>
        <p className="text-xs font-semibold text-[#4A27E8] uppercase tracking-widest mb-3">Step 2 of {TOTAL_STEPS}</p>
        <h2 className="text-2xl font-black text-[#1A1A1A] dark:text-white mb-1">Your professional profile</h2>
        <p className="text-sm text-slate-400 mb-8">This is what other professionals will see about you.</p>

        <div className="flex flex-col gap-4 flex-1">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Role / Title</label>
            <input
              type="text"
              placeholder="e.g. Co-founder, VP Engineering, Partner"
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 dark:bg-white/10 rounded-2xl text-sm text-[#1A1A1A] dark:text-white placeholder:text-slate-300 border-0 focus:outline-none focus:ring-2 focus:ring-[#4A27E8] transition"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Company</label>
            <input
              type="text"
              placeholder="e.g. Stripe, OpenAI, Independent"
              value={company}
              onChange={e => setCompany(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 dark:bg-white/10 rounded-2xl text-sm text-[#1A1A1A] dark:text-white placeholder:text-slate-300 border-0 focus:outline-none focus:ring-2 focus:ring-[#4A27E8] transition"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Short Bio <span className="normal-case font-normal text-slate-400">(optional)</span></label>
            <textarea
              rows={4}
              placeholder="What do you work on? What are you building or investing in?"
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={280}
              className="w-full px-4 py-3.5 bg-slate-50 dark:bg-white/10 rounded-2xl text-sm text-[#1A1A1A] dark:text-white placeholder:text-slate-300 border-0 focus:outline-none focus:ring-2 focus:ring-[#4A27E8] transition resize-none"
            />
            <p className="text-xs text-slate-400 text-right mt-1">{bio.length}/280</p>
          </div>
        </div>

        <div className="pt-6 flex flex-col gap-3">
          <button onClick={() => setStep(2)}
            className="w-full py-4 rounded-2xl text-sm font-semibold text-white transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #4A27E8, #1A1A1A)" }}>
            Continue
          </button>
          <button onClick={() => setStep(2)} className="text-sm text-slate-400 py-2">
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2: Flight number ──────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-white dark:bg-[#0A0A0B] flex flex-col px-6 pt-14 pb-10">
      <div className="flex gap-2 mb-10">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full bg-[#4A27E8]`} />
        ))}
      </div>
      <p className="text-xs font-semibold text-[#4A27E8] uppercase tracking-widest mb-3">Step 3 of {TOTAL_STEPS}</p>
      <h2 className="text-2xl font-black text-[#1A1A1A] dark:text-white mb-1">What&apos;s your flight?</h2>
      <p className="text-sm text-slate-400 mb-8">We&apos;ll find professionals on your flight to connect with.</p>

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
        <p className="mt-3 text-xs text-red-500 bg-red-50 dark:bg-red-950/40 rounded-xl px-4 py-2">{error}</p>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-8">
        <button onClick={finish} disabled={saving}
          className="w-full py-4 rounded-2xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #4A27E8, #1A1A1A)" }}>
          {saving ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10"/>
              </svg>
              Setting up…
            </>
          ) : "Enter SkyLink ✈"}
        </button>
        <button onClick={finish} disabled={saving} className="text-sm text-slate-400 py-2">
          Skip — add flight later
        </button>
      </div>
    </div>
  );
}
