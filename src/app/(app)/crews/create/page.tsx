"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const ICONS = ["✈️","🚀","💼","🤖","🌎","🏙️","🌴","🍸","☕","🎯","📡","🌐","💡","🎤","🏄","🎸","🧬","🌿","🏔️","🌊"];

export default function CreateCrewPage() {
  const supabase = createClient();
  const router   = useRouter();

  const [step, setStep]           = useState(1);
  const [name, setName]           = useState("");
  const [description, setDesc]    = useState("");
  const [icon, setIcon]           = useState("✈️");
  const [creating, setCreating]   = useState(false);
  const [error, setError]         = useState("");

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated"); setCreating(false); return; }

    const { data, error: err } = await supabase
      .from("crews")
      .insert({ name: name.trim(), description: description.trim() || null, icon, created_by: user.id })
      .select("id")
      .single();

    if (err || !data) {
      setError("Failed to create crew. Please try again.");
      setCreating(false);
      return;
    }

    // Auto-join as admin
    await supabase.from("crew_members").insert({ crew_id: data.id, user_id: user.id, role: "admin" });

    router.push(`/crews/${data.id}`);
  }

  return (
    <div className="animate-fade-in min-h-screen" style={{ background: "var(--c-bg)" }}>

      {/* Header */}
      <div className="px-4 flex items-center gap-3 border-b"
           style={{
             paddingTop: "max(16px, env(safe-area-inset-top))",
             paddingBottom: 16,
             borderColor: "var(--c-border)",
           }}>
        <button onClick={() => step > 1 ? setStep(step - 1) : router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "var(--c-muted)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="var(--c-text1)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--c-text3)" }}>
            Step {step} of 2
          </p>
          <h1 className="text-lg font-black" style={{ color: "var(--c-text1)" }}>
            {step === 1 ? "Name your crew" : "Pick an icon"}
          </h1>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 mx-4 rounded-full mt-4" style={{ background: "var(--c-muted)" }}>
        <div className="h-full rounded-full transition-all duration-300"
             style={{ width: `${(step / 2) * 100}%`, background: "#4A27E8" }} />
      </div>

      <div className="px-4 mt-6 flex flex-col gap-5">

        {step === 1 && (
          <>
            {/* Name */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: "var(--c-text3)" }}>
                Crew Name *
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. SFO → NYC Weekly"
                maxLength={60}
                className="w-full rounded-2xl px-4 py-3.5 text-sm border focus:outline-none focus:ring-2 focus:ring-brand"
                style={{ background: "var(--c-card)", borderColor: "var(--c-border)", color: "var(--c-text1)" }}
              />
              <p className="text-[11px] mt-1.5 text-right" style={{ color: "var(--c-text3)" }}>
                {name.length}/60
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: "var(--c-text3)" }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDesc(e.target.value)}
                placeholder="What is this crew about? Who should join?"
                rows={4}
                maxLength={280}
                className="w-full rounded-2xl px-4 py-3.5 text-sm border focus:outline-none focus:ring-2 focus:ring-brand resize-none"
                style={{ background: "var(--c-card)", borderColor: "var(--c-border)", color: "var(--c-text1)" }}
              />
              <p className="text-[11px] mt-1.5 text-right" style={{ color: "var(--c-text3)" }}>
                {description.length}/280
              </p>
            </div>

            {/* Preview card */}
            {name.trim() && (
              <div className="rounded-2xl p-4 border" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--c-text3)" }}>Preview</p>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-violet-100 flex items-center justify-center text-2xl flex-shrink-0">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: "var(--c-text1)" }}>{name}</p>
                    {description && (
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--c-text2)" }}>{description}</p>
                    )}
                    <p className="text-[11px] mt-1.5" style={{ color: "var(--c-text3)" }}>0 members</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => name.trim() && setStep(2)}
              disabled={!name.trim()}
              className="w-full py-4 rounded-2xl text-white font-bold text-sm active:scale-[0.98] transition-transform disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #3418C8 0%, #4A27E8 100%)" }}>
              Next: Pick an Icon →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <p className="text-sm mb-4" style={{ color: "var(--c-text2)" }}>
                Choose an icon that represents your crew:
              </p>
              <div className="grid grid-cols-5 gap-3">
                {ICONS.map(ic => (
                  <button key={ic} onClick={() => setIcon(ic)}
                    className="aspect-square rounded-2xl flex items-center justify-center text-2xl active:scale-90 transition-all"
                    style={{
                      background: icon === ic ? "rgba(74,39,232,0.12)" : "var(--c-card)",
                      border: icon === ic ? "2px solid #4A27E8" : "1px solid var(--c-border)",
                    }}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-2xl p-4 border" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--c-text3)" }}>Preview</p>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-violet-100 flex items-center justify-center text-2xl flex-shrink-0">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: "var(--c-text1)" }}>{name}</p>
                  {description && (
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--c-text2)" }}>{description}</p>
                  )}
                  <p className="text-[11px] mt-1.5" style={{ color: "var(--c-text3)" }}>0 members</p>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <button
              onClick={create}
              disabled={creating}
              className="w-full py-4 rounded-2xl text-white font-bold text-sm active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #3418C8 0%, #4A27E8 100%)" }}>
              {creating ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Creating…
                </>
              ) : "Create Crew ✈️"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
