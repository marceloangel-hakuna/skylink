"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STEPS = ["Welcome", "Your Role", "Travel Style", "Done"];

const INDUSTRIES = [
  "Technology", "Finance", "Consulting", "Healthcare", "Legal",
  "Media", "Real Estate", "Education", "Government", "Other",
];

const TRAVEL_GOALS = [
  { id: "networking",  label: "Professional networking" },
  { id: "deals",      label: "Close deals" },
  { id: "learning",   label: "Share knowledge" },
  { id: "social",     label: "Social connections" },
  { id: "mentoring",  label: "Mentoring" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleGoal(id: string) {
    setGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  async function finish() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName,
        title,
        company,
        industry,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      });
    }
    router.push("/home");
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="flex flex-col min-h-dvh px-6 pt-12 pb-10">
      {/* Progress bar */}
      <div className="w-full h-1 bg-surface-border rounded-full mb-8">
        <div
          className="h-1 bg-sky-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-xs font-semibold text-sky-600 uppercase tracking-widest mb-2">
        Step {step + 1} of {STEPS.length}
      </p>

      {/* Step 0: Welcome */}
      {step === 0 && (
        <div className="flex-1 flex flex-col animate-fade-in">
          <h2 className="text-2xl font-black text-navy-900 mb-2">
            Welcome aboard! ✈️
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Let&apos;s set up your SkyLink profile so fellow travelers know who you are.
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">Full name</label>
              <input
                type="text"
                placeholder="Jane Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
          <div className="mt-auto">
            <button
              onClick={() => setStep(1)}
              disabled={!fullName.trim()}
              className="btn-primary w-full"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Role */}
      {step === 1 && (
        <div className="flex-1 flex flex-col animate-fade-in">
          <h2 className="text-2xl font-black text-navy-900 mb-2">Your role</h2>
          <p className="text-slate-500 text-sm mb-6">Tell us about your professional background.</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">Job title</label>
              <input
                type="text"
                placeholder="VP of Product"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">Company</label>
              <input
                type="text"
                placeholder="Acme Corp"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">Industry</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind}
                    onClick={() => setIndustry(ind)}
                    className={`text-sm py-2.5 px-3 rounded-xl border font-medium transition-all ${
                      industry === ind
                        ? "border-sky-500 bg-sky-50 text-sky-700"
                        : "border-surface-border bg-surface-card text-slate-600"
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-auto flex gap-3 pt-6">
            <button onClick={() => setStep(0)} className="btn-secondary flex-1">Back</button>
            <button onClick={() => setStep(2)} className="btn-primary flex-1">Continue</button>
          </div>
        </div>
      )}

      {/* Step 2: Travel style */}
      {step === 2 && (
        <div className="flex-1 flex flex-col animate-fade-in">
          <h2 className="text-2xl font-black text-navy-900 mb-2">Travel goals</h2>
          <p className="text-slate-500 text-sm mb-6">What do you want from in-flight networking?</p>
          <div className="flex flex-col gap-2">
            {TRAVEL_GOALS.map(({ id, label }) => {
              const selected = goals.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleGoal(id)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                    selected
                      ? "border-sky-500 bg-sky-50"
                      : "border-surface-border bg-surface-card"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selected ? "border-sky-500 bg-sky-500" : "border-slate-300"
                  }`}>
                    {selected && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${selected ? "text-sky-700" : "text-slate-700"}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-auto flex gap-3 pt-6">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
            <button onClick={() => setStep(3)} disabled={goals.length === 0} className="btn-primary flex-1">Continue</button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 3 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full gradient-card flex items-center justify-center mb-6 shadow-card">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <h2 className="text-2xl font-black text-navy-900 mb-2">You&apos;re all set!</h2>
          <p className="text-slate-500 text-sm max-w-[260px]">
            Your profile is ready. Start connecting with professionals on your next flight.
          </p>
          <div className="mt-10 w-full">
            <button onClick={finish} disabled={saving} className="btn-primary w-full">
              {saving ? "Setting up…" : "Launch SkyLink"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
