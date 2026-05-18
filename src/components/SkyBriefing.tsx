"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type FlightPhase = "none" | "far" | "near" | "boarding" | "inflight" | "landed";
type Msg = { id: string; role: "user" | "assistant"; content: string };

interface Props {
  firstName: string;
  phase: FlightPhase;
  flightNumber: string | null;
  origin: string | null;
  destination: string | null;
}

// ── Ambient palettes by phase ──────────────────────────────────────────────
const PHASE_PALETTE: Record<FlightPhase, { orb: string; glow: string; accent: string }> = {
  none:     { orb: "rgba(107,74,240,0.18)",  glow: "#7C6AF5", accent: "#9B8BFF" },
  far:      { orb: "rgba(45,68,180,0.15)",   glow: "#3B5BDB", accent: "#748FFC" },
  near:     { orb: "rgba(107,74,240,0.22)",  glow: "#7C6AF5", accent: "#9B8BFF" },
  boarding: { orb: "rgba(245,166,35,0.18)",  glow: "#F5A623", accent: "#FCC419" },
  inflight: { orb: "rgba(20,40,120,0.25)",   glow: "#1C3D8F", accent: "#4C7EF5" },
  landed:   { orb: "rgba(20,100,80,0.18)",   glow: "#2DD4A8", accent: "#2DD4A8" },
};

// ── Sky icon — tri-arc aperture ────────────────────────────────────────────
function SkyOrb({ color, size = 48 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" aria-hidden>
      <path d="M19.55 8.41 A8 8 0 0 1 19.55 17.59" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M13.7 20.97 A8 8 0 0 1 5.75 16.38"  stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M5.75 9.62 A8 8 0 0 1 13.7 5.03"    stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="13" cy="13" r="2.8" fill={color}/>
    </svg>
  );
}

// ── Bouncing dots ───────────────────────────────────────────────────────────
function ThinkingDots({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1.5 h-1.5 rounded-full block"
          style={{ background: color, opacity: 0.5,
            animation: `skyDot 1.4s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
    </div>
  );
}

// ── Chip ───────────────────────────────────────────────────────────────────
function Chip({ label, onTap, accent }: { label: string; onTap: () => void; accent: string }) {
  return (
    <button
      onClick={onTap}
      className="flex-shrink-0 text-left px-4 py-2.5 rounded-2xl text-[14px] font-semibold active:scale-95 transition-all"
      style={{
        background: `${accent}14`,
        border: `1px solid ${accent}30`,
        color: accent,
        animation: "chipIn 0.4s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      {label}
    </button>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function SkyBriefing({ phase, flightNumber, origin, destination }: Props) {
  const router = useRouter();
  const pal = PHASE_PALETTE[phase];

  const [briefing,  setBriefing]  = useState("");
  const [done,      setDone]      = useState(false);
  const [thinking,  setThinking]  = useState(true);
  const [msgs,      setMsgs]      = useState<Msg[]>([]);
  const [input,     setInput]     = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId] = useState(() => "sky_" + Date.now());
  const [matchChip, setMatchChip] = useState<{ name: string } | null>(null);
  const [flightChip, setFlightChip] = useState<{ number: string } | null>(null);

  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const aIdRef    = useRef<string | null>(null);

  // Restore conversation from session
  useEffect(() => {
    try {
      const s = sessionStorage.getItem("sky_msgs");
      if (s) setMsgs(JSON.parse(s));
      const b = sessionStorage.getItem("sky_briefing");
      if (b) { setBriefing(b); setDone(true); setThinking(false); return; }
    } catch {}
    // Stream the briefing
    fetchBriefing();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (msgs.length > 0) try { sessionStorage.setItem("sky_msgs", JSON.stringify(msgs.slice(-24))); } catch {}
  }, [msgs]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, briefing]);

  async function fetchBriefing() {
    setThinking(true);
    try {
      const res = await fetch("/api/sky/briefing");
      if (!res.ok || !res.body) { setThinking(false); return; }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      setThinking(false);
      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") { setDone(true); continue; }
          try {
            const parsed = JSON.parse(raw);
            if (parsed.text) {
              setBriefing(p => {
                const next = p + parsed.text;
                try { sessionStorage.setItem("sky_briefing", next); } catch {}
                return next;
              });
            }
            if (parsed.match) setMatchChip({ name: parsed.match.name.split(" ")[0] });
            if (parsed.flight) setFlightChip({ number: parsed.flight.number });
          } catch {}
        }
      }
    } catch {
      setThinking(false);
      setDone(true);
    }
  }

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    setInput("");
    try { navigator.vibrate?.(8); } catch {}

    const aId = "a_" + Date.now();
    aIdRef.current = aId;
    setMsgs(p => [...p, { id: "u_" + Date.now(), role: "user", content }, { id: aId, role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const history = msgs.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, sessionId, history }),
      });
      if (!res.ok || !res.body) { setStreaming(false); return; }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;
          try {
            const { text: chunk } = JSON.parse(raw);
            if (chunk) setMsgs(p => p.map(m => m.id === aId ? { ...m, content: m.content + chunk } : m));
          } catch {}
        }
      }
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, msgs, sessionId]);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  // Parse agent tag from assistant response
  function stripAgentTag(text: string): { agent: string | null; clean: string } {
    const m = text.match(/^\[(\w+)\]\s*/);
    if (m) return { agent: m[1], clean: text.slice(m[0].length) };
    return { agent: null, clean: text };
  }

  const hasConversation = msgs.length > 0;

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: "#060810" }}
    >
      {/* ── Ambient orb — slow breathing glow ── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "70vw",
          height: "70vw",
          maxWidth: 340,
          maxHeight: 340,
          borderRadius: "50%",
          background: pal.orb,
          filter: "blur(80px)",
          animation: "ambientBreathe 8s ease-in-out infinite",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-5 flex-shrink-0"
        style={{
          paddingTop: "calc(env(safe-area-inset-top,0px) + 14px)",
          paddingBottom: 10,
          position: "relative",
          zIndex: 2,
        }}
      >
        <span
          className="text-[10px] font-black uppercase tracking-[0.2em]"
          style={{
            background: `linear-gradient(135deg, ${pal.accent}, ${pal.glow})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          SkyLink
        </span>
        {flightNumber && (
          <button
            onClick={() => router.push(`/flight/${flightNumber.replace(/\s+/g, "").toLowerCase()}`)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold active:opacity-70 transition-opacity"
            style={{ background: `${pal.accent}12`, border: `1px solid ${pal.accent}25`, color: pal.accent }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: pal.accent, opacity: 0.8 }} />
            {origin} → {destination}
          </button>
        )}
        {/* Access to insights / old feed */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("openSheet", { detail: { sheet: "flights" } }))}
          className="w-8 h-8 flex items-center justify-center rounded-full active:opacity-70 transition-opacity"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
          aria-label="Open menu"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2} strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>

      {/* ── Main scroll area ── */}
      <div className="flex-1 overflow-y-auto px-5 pb-4" style={{ position: "relative", zIndex: 2 }}>

        {/* Sky presence */}
        {!hasConversation && (
          <div className="flex flex-col items-center pt-8 pb-6">
            <div
              className="w-16 h-16 rounded-[22px] flex items-center justify-center mb-3"
              style={{
                background: `${pal.glow}18`,
                border: `1px solid ${pal.glow}30`,
                animation: "skyOrbPulse 3s ease-in-out infinite",
              }}
            >
              <SkyOrb color={pal.accent} size={36} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: pal.accent, opacity: 0.7 }}>
              Sky
            </span>
          </div>
        )}

        {/* Sky's briefing */}
        <div className="mb-5">
          {hasConversation && (
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                   style={{ background: `${pal.glow}20` }}>
                <SkyOrb color={pal.accent} size={14} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: pal.accent, opacity: 0.7 }}>Sky</span>
            </div>
          )}
          <div style={{ fontSize: hasConversation ? 15 : 22, fontWeight: hasConversation ? 500 : 700,
                        lineHeight: hasConversation ? 1.55 : 1.35,
                        letterSpacing: hasConversation ? 0 : "-0.025em",
                        color: "rgba(255,255,255,0.92)" }}>
            {thinking ? (
              <div className="pt-1">
                <ThinkingDots color={pal.accent} />
              </div>
            ) : briefing ? (
              briefing
            ) : null}
          </div>
        </div>

        {/* Context chips — appear after briefing done */}
        {done && !hasConversation && (
          <div className="flex flex-col gap-2 mb-6" style={{ animation: "fadeUp 0.5s 0.2s both" }}>
            {matchChip && (
              <Chip
                accent={pal.accent}
                label={`Introduce me to ${matchChip.name} →`}
                onTap={() => sendMessage(`Draft an intro message for me to send to ${matchChip.name} on my flight`)}
              />
            )}
            {flightChip && (
              <Chip
                accent={pal.accent}
                label="What should I know before landing? →"
                onTap={() => sendMessage("What should I know before landing at my destination?")}
              />
            )}
            <Chip
              accent={pal.accent}
              label="Who else is on my flight? →"
              onTap={() => window.dispatchEvent(new CustomEvent("openSheet", { detail: { sheet: "people" } }))}
            />
            {!flightChip && (
              <Chip
                accent={pal.accent}
                label="Add my flight →"
                onTap={() => router.push("/flight")}
              />
            )}
          </div>
        )}

        {/* Conversation messages */}
        {msgs.map(m => {
          if (m.role === "user") {
            return (
              <div key={m.id} className="flex justify-end mb-4">
                <div className="max-w-[78%] px-4 py-2.5 rounded-2xl rounded-br-sm text-[15px] leading-relaxed"
                     style={{ background: `${pal.glow}22`, border: `1px solid ${pal.glow}30`,
                              color: "rgba(255,255,255,0.9)" }}>
                  {m.content}
                </div>
              </div>
            );
          }
          const { agent, clean } = stripAgentTag(m.content);
          return (
            <div key={m.id} className="mb-5">
              {agent && (
                <span className="text-[10px] font-black uppercase tracking-wider mb-1.5 block"
                      style={{ color: pal.accent, opacity: 0.6 }}>{agent}</span>
              )}
              <p className="text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
                {clean || <ThinkingDots color={pal.accent} />}
              </p>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div
        className="flex-shrink-0 px-4 flex items-end gap-3"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 16px)",
          paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(6,8,16,0.8)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder={done ? "Say something to Sky…" : "Sky is preparing your briefing…"}
          disabled={!done || streaming}
          className="flex-1 resize-none text-[15px] leading-relaxed bg-transparent outline-none"
          style={{
            color: "rgba(255,255,255,0.9)",
            caretColor: pal.accent,
            maxHeight: 96,
            overflow: "hidden auto",
            paddingTop: 10,
            paddingBottom: 10,
          }}
          onInput={e => {
            const t = e.currentTarget;
            t.style.height = "auto";
            t.style.height = Math.min(t.scrollHeight, 96) + "px";
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || streaming || !done}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform disabled:opacity-30"
          style={{ background: `linear-gradient(135deg, ${pal.glow}, ${pal.accent})` }}
          aria-label="Send"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* ── CSS ── */}
      <style>{`
        @keyframes ambientBreathe {
          0%,100% { transform: translateX(-50%) scale(1); opacity:0.7; }
          50%      { transform: translateX(-50%) scale(1.15); opacity:1; }
        }
        @keyframes skyOrbPulse {
          0%,100% { box-shadow: 0 0 0 0 ${pal.glow}00; }
          50%      { box-shadow: 0 0 24px 8px ${pal.glow}22; }
        }
        @keyframes skyDot {
          0%,80%,100% { transform:translateY(0);opacity:0.35; }
          40%          { transform:translateY(-5px);opacity:1; }
        }
        @keyframes chipIn {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        textarea::placeholder { color: rgba(255,255,255,0.18); }
      `}</style>
    </div>
  );
}
