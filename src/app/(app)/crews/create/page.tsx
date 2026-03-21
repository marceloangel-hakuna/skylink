"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { THEME_OPTIONS } from "../themes";

// Mini illustrations for the preset theme picker cards
const THEME_PREVIEWS: Record<string, React.ReactNode> = {
  city: (
    <svg viewBox="0 0 60 40" fill="none" className="w-full h-full">
      <rect x="2"  y="22" width="8"  height="18" rx="0.5" fill="#C2410C" fillOpacity="0.20"/>
      <rect x="12" y="14" width="10" height="26" rx="0.5" fill="#C2410C" fillOpacity="0.22"/>
      <rect x="14" y="10" width="3"  height="5"  rx="0.5" fill="#C2410C" fillOpacity="0.18"/>
      <rect x="24" y="18" width="8"  height="22" rx="0.5" fill="#C2410C" fillOpacity="0.18"/>
      <rect x="34" y="8"  width="12" height="32" rx="0.5" fill="#C2410C" fillOpacity="0.24"/>
      <rect x="36" y="5"  width="3"  height="4"  rx="0.5" fill="#C2410C" fillOpacity="0.20"/>
      <rect x="48" y="20" width="10" height="20" rx="0.5" fill="#C2410C" fillOpacity="0.18"/>
      <circle cx="52" cy="6" r="3" fill="#C2410C" fillOpacity="0.12"/>
    </svg>
  ),
  tech: (
    <svg viewBox="0 0 60 40" fill="none" className="w-full h-full">
      <line x1="8"  y1="14" x2="22" y2="8"  stroke="#1D4ED8" strokeOpacity="0.18" strokeWidth="0.8"/>
      <line x1="8"  y1="14" x2="22" y2="22" stroke="#1D4ED8" strokeOpacity="0.18" strokeWidth="0.8"/>
      <line x1="22" y1="8"  x2="38" y2="6"  stroke="#1D4ED8" strokeOpacity="0.15" strokeWidth="0.8"/>
      <line x1="22" y1="22" x2="38" y2="18" stroke="#1D4ED8" strokeOpacity="0.18" strokeWidth="0.8"/>
      <line x1="38" y1="6"  x2="52" y2="14" stroke="#1D4ED8" strokeOpacity="0.18" strokeWidth="0.8"/>
      <line x1="38" y1="18" x2="52" y2="14" stroke="#1D4ED8" strokeOpacity="0.18" strokeWidth="0.8"/>
      <circle cx="8"  cy="14" r="3"   fill="#1D4ED8" fillOpacity="0.22"/>
      <circle cx="22" cy="8"  r="3.5" fill="#1D4ED8" fillOpacity="0.20"/>
      <circle cx="22" cy="22" r="3.5" fill="#1D4ED8" fillOpacity="0.22"/>
      <circle cx="38" cy="6"  r="3"   fill="#1D4ED8" fillOpacity="0.18"/>
      <circle cx="38" cy="18" r="4"   fill="#1D4ED8" fillOpacity="0.28"/>
      <circle cx="52" cy="14" r="4"   fill="#1D4ED8" fillOpacity="0.26"/>
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 60 40" fill="none" className="w-full h-full">
      <circle cx="38" cy="20" r="18" stroke="#065F46" strokeOpacity="0.14" strokeWidth="1"/>
      <ellipse cx="38" cy="20" rx="18" ry="6" stroke="#065F46" strokeOpacity="0.12" strokeWidth="0.8" strokeDasharray="2 2"/>
      <path d="M38 2 Q48 10 48 20 Q48 30 38 38" stroke="#065F46" strokeOpacity="0.12" strokeWidth="0.8" strokeDasharray="2 2"/>
      <path d="M38 2 Q28 10 28 20 Q28 30 38 38" stroke="#065F46" strokeOpacity="0.12" strokeWidth="0.8" strokeDasharray="2 2"/>
      <path d="M30 15 Q34 12 37 14 Q39 18 36 20 Q32 21 30 18Z" fill="#065F46" fillOpacity="0.18"/>
      <circle cx="34" cy="16" r="1.5" fill="#065F46" fillOpacity="0.50"/>
    </svg>
  ),
  valley: (
    <svg viewBox="0 0 60 40" fill="none" className="w-full h-full">
      <rect x="14" y="8"  width="2.5" height="25" rx="0.3" fill="#92400E" fillOpacity="0.24"/>
      <rect x="19" y="8"  width="2.5" height="25" rx="0.3" fill="#92400E" fillOpacity="0.24"/>
      <rect x="14" y="8"  width="7.5" height="1.5" rx="0.3" fill="#92400E" fillOpacity="0.18"/>
      <rect x="14" y="16" width="7.5" height="1.5" rx="0.3" fill="#92400E" fillOpacity="0.14"/>
      <rect x="13" y="4"  width="9.5" height="4"   rx="0.3" fill="#92400E" fillOpacity="0.26"/>
      <rect x="38" y="8"  width="2.5" height="25" rx="0.3" fill="#92400E" fillOpacity="0.24"/>
      <rect x="43" y="8"  width="2.5" height="25" rx="0.3" fill="#92400E" fillOpacity="0.24"/>
      <rect x="38" y="8"  width="7.5" height="1.5" rx="0.3" fill="#92400E" fillOpacity="0.18"/>
      <rect x="37" y="4"  width="9.5" height="4"   rx="0.3" fill="#92400E" fillOpacity="0.26"/>
      <path d="M0 32 Q7 26 18 8"  stroke="#92400E" strokeOpacity="0.20" strokeWidth="0.8" fill="none"/>
      <path d="M18 8 Q30 18 42 8"  stroke="#92400E" strokeOpacity="0.22" strokeWidth="0.8" fill="none"/>
      <path d="M42 8 Q53 26 60 32" stroke="#92400E" strokeOpacity="0.20" strokeWidth="0.8" fill="none"/>
      <rect x="0" y="31" width="60" height="2" rx="0.3" fill="#92400E" fillOpacity="0.18"/>
    </svg>
  ),
  vibrant: (
    <svg viewBox="0 0 60 40" fill="none" className="w-full h-full">
      <circle cx="44" cy="12" r="16" fill="#BE123C" fillOpacity="0.08"/>
      <path d="M10,7 L11.5,11 L15.5,12.5 L11.5,14 L10,18 L8.5,14 L4.5,12.5 L8.5,11Z" fill="#BE123C" fillOpacity="0.16"/>
      <path d="M44,18 L45.5,22 L49.5,23.5 L45.5,25 L44,29 L42.5,25 L38.5,23.5 L42.5,22Z" fill="#BE123C" fillOpacity="0.12"/>
      <path d="M28,5 L29,8 L32,9 L29,10 L28,13 L27,10 L24,9 L27,8Z" fill="#BE123C" fillOpacity="0.18"/>
      <circle cx="22" cy="26" r="2.5" fill="#BE123C" fillOpacity="0.14"/>
    </svg>
  ),
  ocean: (
    <svg viewBox="0 0 60 40" fill="none" className="w-full h-full">
      <circle cx="46" cy="10" r="12" fill="#0F766E" fillOpacity="0.08"/>
      <path d="M48 8 Q56 13 51 19 Q60 16 58 9 Q55 4 48 8Z" fill="#0F766E" fillOpacity="0.14"/>
      <path d="M0 22 Q8 17 16 22 Q24 27 32 22 Q40 17 48 22 Q56 27 60 22 L60 40 L0 40Z" fill="#0F766E" fillOpacity="0.10"/>
      <path d="M0 29 Q10 24 20 28 Q30 32 40 28 Q50 24 60 29 L60 40 L0 40Z" fill="#0F766E" fillOpacity="0.12"/>
      <path d="M0 22 Q8 17 16 22 Q24 27 32 22 Q40 17 48 22 Q56 27 60 22" stroke="#0F766E" strokeOpacity="0.18" strokeWidth="1" fill="none"/>
    </svg>
  ),
};

export default function CreateCrewPage() {
  const supabase = createClient();
  const router   = useRouter();

  const [step, setStep]         = useState(1);
  const [name, setName]         = useState("");
  const [description, setDesc]  = useState("");
  const [style, setStyle]       = useState<string>("city");
  const [customSvg, setCustomSvg] = useState<string | null>(null);  // AI-generated SVG
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError]       = useState("");

  // When style === "ai" we use the customSvg; otherwise use one of the 6 presets
  const isAiStyle = style === "ai" && !!customSvg;
  const selectedTheme = THEME_OPTIONS.find(t => t.key === style) ?? THEME_OPTIONS[0];

  async function aiGenerate() {
    if (!name.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/crew/generate-header", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (data.svg) {
        setCustomSvg(data.svg);
        setStyle("ai");
      }
    } catch { /* ignore */ }
    setGenerating(false);
  }

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated"); setCreating(false); return; }

    const { data, error: err } = await supabase
      .from("crews")
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        icon: "",
        header_style: isAiStyle ? "custom" : style,
        header_svg: isAiStyle ? customSvg : null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (err || !data) {
      setError("Failed to create crew. Please try again.");
      setCreating(false);
      return;
    }

    await supabase.from("crew_members").insert({ crew_id: data.id, user_id: user.id, role: "admin" });
    router.push(`/crews/${data.id}`);
  }

  const stepTitles = ["Name your crew", "Design the header"];

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
            {stepTitles[step - 1]}
          </h1>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 mx-4 rounded-full mt-4" style={{ background: "var(--c-muted)" }}>
        <div className="h-full rounded-full transition-all duration-300"
             style={{ width: `${(step / 2) * 100}%`, background: "#4A27E8" }} />
      </div>

      <div className="px-4 mt-6 flex flex-col gap-5">

        {/* ── Step 1: Name + Description ── */}
        {step === 1 && (
          <>
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
                className="w-full rounded-2xl px-4 py-3.5 text-sm border focus:outline-none focus:ring-2"
                style={{ background: "var(--c-card)", borderColor: "var(--c-border)", color: "var(--c-text1)" }}
              />
              <p className="text-[11px] mt-1.5 text-right" style={{ color: "var(--c-text3)" }}>
                {name.length}/60
              </p>
            </div>

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
                className="w-full rounded-2xl px-4 py-3.5 text-sm border focus:outline-none focus:ring-2 resize-none"
                style={{ background: "var(--c-card)", borderColor: "var(--c-border)", color: "var(--c-text1)" }}
              />
              <p className="text-[11px] mt-1.5 text-right" style={{ color: "var(--c-text3)" }}>
                {description.length}/280
              </p>
            </div>

            <button
              onClick={() => name.trim() && setStep(2)}
              disabled={!name.trim()}
              className="w-full py-4 rounded-2xl text-white font-bold text-sm active:scale-[0.98] transition-transform disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #3418C8 0%, #4A27E8 100%)" }}>
              Next: Design a Header →
            </button>
          </>
        )}

        {/* ── Step 2: Header Design ── */}
        {step === 2 && (
          <>
            {/* AI Generate — hero CTA */}
            <div className="rounded-2xl p-4 flex flex-col gap-3"
                 style={{ background: "linear-gradient(135deg, #1e1045 0%, #2d1b6e 100%)" }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                     style={{ background: "rgba(255,255,255,0.12)" }}>
                  ✨
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">Generate a unique header</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Claude designs a custom graphic just for this crew based on its name and topic
                  </p>
                </div>
              </div>
              <button
                onClick={aiGenerate}
                disabled={generating}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
                style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}>
                {generating ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Generating…
                  </>
                ) : (
                  <>✨ Generate with AI</>
                )}
              </button>
            </div>

            {/* AI Result preview */}
            {customSvg && (
              <button
                onClick={() => setStyle("ai")}
                className="w-full rounded-2xl overflow-hidden border-2 text-left transition-all active:scale-[0.98]"
                style={{
                  borderColor: isAiStyle ? "#4A27E8" : "var(--c-border)",
                  boxShadow: isAiStyle ? "0 0 0 1px #4A27E8" : "none",
                }}>
                {/* Render generated SVG */}
                <div className="h-28 relative overflow-hidden"
                     dangerouslySetInnerHTML={{ __html: customSvg.replace('viewBox="0 0 400 160"', 'viewBox="0 0 400 160" style="width:100%;height:100%"') }} />
                <div className="px-3 py-2 flex items-center justify-between"
                     style={{ background: "var(--c-card)" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: "var(--c-text1)" }}>AI Generated</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-semibold"
                          style={{ background: "#4A27E8" }}>Unique</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); aiGenerate(); }}
                    disabled={generating}
                    className="text-[11px] font-semibold disabled:opacity-40"
                    style={{ color: "var(--color-brand-fg)" }}>
                    {generating ? "…" : "Regenerate"}
                  </button>
                </div>
                {isAiStyle && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                       style={{ background: "#4A27E8" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
              </button>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "var(--c-border)" }} />
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text3)" }}>
                or choose a preset
              </p>
              <div className="flex-1 h-px" style={{ background: "var(--c-border)" }} />
            </div>

            {/* Preset theme grid */}
            <div className="grid grid-cols-2 gap-3">
              {THEME_OPTIONS.map(opt => (
                <button key={opt.key} onClick={() => setStyle(opt.key)}
                  className="rounded-2xl overflow-hidden border-2 transition-all active:scale-[0.97] text-left relative"
                  style={{
                    borderColor: style === opt.key ? "#4A27E8" : "transparent",
                    boxShadow: style === opt.key ? "0 0 0 1px #4A27E8" : "none",
                  }}>
                  <div className="h-20 relative overflow-hidden"
                       style={{ background: opt.bg }}>
                    <div className="absolute inset-0 flex items-center justify-center opacity-80">
                      {THEME_PREVIEWS[opt.key]}
                    </div>
                    {style === opt.key && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand flex items-center justify-center"
                           style={{ background: "#4A27E8" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2" style={{ background: "var(--c-card)" }}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{opt.emoji}</span>
                      <span className="text-xs font-bold" style={{ color: "var(--c-text1)" }}>{opt.label}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Live preview */}
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <div className="h-20 relative overflow-hidden"
                   style={isAiStyle ? {} : { background: selectedTheme.bg }}>
                {isAiStyle ? (
                  <div className="w-full h-full"
                       dangerouslySetInnerHTML={{ __html: customSvg.replace('viewBox="0 0 400 160"', 'viewBox="0 0 400 160" style="width:100%;height:100%"') }} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-70 scale-150">
                    {THEME_PREVIEWS[style] ?? THEME_PREVIEWS.city}
                  </div>
                )}
                <div className="absolute inset-0 flex items-end p-3"
                     style={{ background: "linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 60%)" }}>
                  <div>
                    <p className="text-xs font-bold text-white drop-shadow">{name || "Crew name"}</p>
                    <p className="text-[10px] text-white/70">
                      {isAiStyle ? "AI Generated" : selectedTheme.label} · 0 members
                    </p>
                  </div>
                </div>
              </div>
            </div>

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
              ) : "Create Crew"}
            </button>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
