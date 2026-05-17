"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ─── Agent registry ──────────────────────────────────────────────────────── */
const AGENTS = {
  atlas:   { label: "Atlas",   color: "#7C6AF5", domain: "Who to meet" },
  compass: { label: "Compass", color: "#2DD4A8", domain: "Flight & logistics" },
  bridge:  { label: "Bridge",  color: "#60A5FA", domain: "Intros & messages" },
  vault:   { label: "Vault",   color: "#F5A623", domain: "Travel expenses" },
  pulse:   { label: "Pulse",   color: "#E8567F", domain: "Your network" },
} as const;

type AgentKey = keyof typeof AGENTS;
type Msg = { id: string; role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  { agent: "atlas",   text: "Who should I meet on this flight?" },
  { agent: "compass", text: "What's the status of my flight?" },
  { agent: "bridge",  text: "Write me an icebreaker message" },
  { agent: "pulse",   text: "Who should I reconnect with?" },
];

const AGENT_RE = /^\[(\w+)\]/;

function parseAgent(content: string): { agent: AgentKey | null; text: string } {
  const m = content.match(AGENT_RE);
  if (m) {
    const k = m[1].toLowerCase() as AgentKey;
    if (k in AGENTS) return { agent: k, text: content.slice(m[0].length).trimStart() };
  }
  return { agent: null, text: content };
}

function peekAgent(partial: string): AgentKey | null {
  const m = partial.match(/^\[(\w+)/);
  if (!m) return null;
  const k = m[1].toLowerCase() as AgentKey;
  return k in AGENTS ? k : null;
}

/* ─── Icons ───────────────────────────────────────────────────────────────── */

/* Sky identity icon — flight vector comet: a bright leading point with two
   tapering trails. Reads as "moving fast, going somewhere, AI-directed." */
function SkyIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="19" cy="5" r="3" fill="white" />
      <path d="M19 5 Q12 10 4 20" stroke="white" strokeWidth="2.5"
            strokeLinecap="round" opacity="0.8" />
      <path d="M19 5 Q14 12 5 22" stroke="white" strokeWidth="1.2"
            strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

/* Agent-specific SVG icons — meaningful, readable at 22px */
function AgentIcon({ agentKey, color, size = 22 }: { agentKey: AgentKey; color: string; size?: number }) {
  const s = { stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (agentKey) {
    case "atlas":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="3.5" {...s} />
          <path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" {...s} />
          <path d="M18 3l1.5 1.5M20 6h1.5M18 9l1.5-1.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
        </svg>
      );
    case "compass":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" {...s} />
          <path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M15 9l-4.5 4.5M9 9l4.5 4.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.45" />
          <circle cx="12" cy="12" r="2" fill={color} />
        </svg>
      );
    case "bridge":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="5.5" cy="7.5" r="2.5" {...s} />
          <circle cx="18.5" cy="7.5" r="2.5" {...s} />
          <path d="M8 7.5h8" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2 2" />
          <path d="M1.5 20c0-2.76 1.79-5 4-5h4" {...s} />
          <path d="M22.5 20c0-2.76-1.79-5-4-5h-4" {...s} />
        </svg>
      );
    case "vault":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect x="3" y="5" width="18" height="14" rx="2.5" {...s} />
          <circle cx="12" cy="12" r="3.5" {...s} />
          <path d="M12 5v2.5M12 16.5V19M3 12h2.5M18.5 12H21" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.45" />
        </svg>
      );
    case "pulse":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M2 12h3.5l2-6 4 12 2.5-8L16 14l1.5-2H22"
                stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
            stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BouncingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-2 h-2 rounded-full inline-block"
          style={{ background: "var(--c-text3)", animation: `skydot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
      <style>{`@keyframes skydot{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function UniversalAssistant() {
  const [open, setOpen]     = useState(false);
  const [msgs, setMsgs]     = useState<Msg[]>([]);
  const [input, setInput]   = useState("");
  const [streaming, setStr] = useState(false);
  const [sessionId]         = useState(() => "s_" + Date.now());

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  /* Restore conversation */
  useEffect(() => {
    try { const s = sessionStorage.getItem("sky_msgs"); if (s) setMsgs(JSON.parse(s)); } catch {}
  }, []);

  /* Persist conversation */
  useEffect(() => {
    if (msgs.length > 0) try { sessionStorage.setItem("sky_msgs", JSON.stringify(msgs.slice(-24))); } catch {}
  }, [msgs]);

  /* External trigger from feed cards */
  useEffect(() => {
    function handle(e: Event) {
      const ce = e as CustomEvent<{ query?: string }>;
      setOpen(true);
      if (ce.detail?.query) setInput(ce.detail.query);
    }
    window.addEventListener("openAssistant", handle as EventListener);
    return () => window.removeEventListener("openAssistant", handle as EventListener);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 400); }, [open]);

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    setInput("");
    try { navigator.vibrate?.(8); } catch {}

    const userMsg: Msg = { id: "u_" + Date.now(), role: "user", content };
    const aId = "a_" + Date.now();
    setMsgs(p => [...p, userMsg, { id: aId, role: "assistant", content: "" }]);
    setStr(true);

    try {
      const history = msgs.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, sessionId, history }),
      });

      if (!res.ok || !res.body) {
        setMsgs(p => p.map(m => m.id === aId ? { ...m, content: "Something went wrong. Try again." } : m));
        setStr(false);
        return;
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;
          try {
            const { text: chunk = "" } = JSON.parse(raw);
            if (chunk) setMsgs(p => p.map(m => m.id === aId ? { ...m, content: m.content + chunk } : m));
          } catch {}
        }
      }
    } catch {
      setMsgs(p => p.map(m => m.id === aId ? { ...m, content: "Connection error. Please try again." } : m));
    } finally {
      setStr(false);
    }
  }, [input, streaming, msgs, sessionId]);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const agentEntries = Object.entries(AGENTS) as [AgentKey, typeof AGENTS[AgentKey]][];

  return (
    <>
      {/* ── FAB ── */}
      {!open && (
        <button
          aria-label="Open Sky assistant"
          onClick={() => setOpen(true)}
          className="fixed flex items-center gap-2.5 active:scale-95 transition-transform"
          style={{
            bottom: "calc(env(safe-area-inset-bottom,0px) + 24px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
            height: 52,
            paddingInline: 24,
            borderRadius: 26,
            background: "linear-gradient(135deg,#6B4AF0,#7C6AF5,#9B8BFF)",
            animation: "fabPulse 3.5s ease-in-out infinite",
            whiteSpace: "nowrap",
          }}
        >
          <SkyIcon size={18} />
          <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
            Ask Sky
          </span>
          {msgs.length > 0 && (
            <span className="flex items-center justify-center rounded-full text-[10px] font-black"
              style={{ background: "rgba(255,255,255,0.25)", color: "#fff", minWidth: 18, height: 18, paddingInline: 4 }}>
              {msgs.filter(m => m.role === "assistant").length}
            </span>
          )}
        </button>
      )}

      {/* ── Backdrop ── */}
      <div onClick={() => setOpen(false)} className="fixed inset-0"
        style={{ background: "rgba(0,0,0,0.55)", opacity: open ? 1 : 0,
          transition: "opacity 0.3s", pointerEvents: open ? "auto" : "none", zIndex: 55 }} />

      {/* ── Sheet ── */}
      <div className="fixed left-1/2 w-full" style={{
        bottom: 0, maxWidth: 430, height: "85dvh",
        transform: `translateX(-50%) translateY(${open ? "0" : "100%"})`,
        transition: "transform 0.38s cubic-bezier(0.22,1,0.36,1)",
        background: "var(--c-card)",
        borderRadius: "28px 28px 0 0",
        borderTop: "1px solid var(--c-border)",
        zIndex: 60, display: "flex", flexDirection: "column",
      }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--c-border)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#6B4AF0,#9B8BFF)" }}>
            <SkyIcon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[17px] font-black leading-tight" style={{ color: "var(--c-text1)", letterSpacing: "-0.02em" }}>
              Sky
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--c-text3)" }}>
              AI travel companion · 5 agents
            </p>
          </div>
          {msgs.length > 0 && (
            <button onClick={() => { setMsgs([]); sessionStorage.removeItem("sky_msgs"); }}
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: "var(--c-muted)", color: "var(--c-text3)" }}
              aria-label="Clear conversation">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6M9 6V4h6v2" />
              </svg>
            </button>
          )}
          <button onClick={() => setOpen(false)}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: "var(--c-muted)", color: "var(--c-text2)" }}
            aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>

        {/* ── Messages / Empty state ── */}
        <div className="flex-1 overflow-y-auto px-5 py-2 flex flex-col gap-4 min-h-0">
          {msgs.length === 0 ? (

            /* ── Empty state ── */
            <div className="flex flex-col gap-6 pt-3 pb-6">

              {/* Hero */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-[22px] flex items-center justify-center"
                  style={{
                    background: "linear-gradient(145deg,#5B48D6,#7C6AF5)",
                    boxShadow: "0 12px 40px rgba(107,74,240,0.35)",
                  }}>
                  <SkyIcon size={30} />
                </div>
                <div className="text-center">
                  <p className="text-[22px] font-black" style={{ color: "var(--c-text1)", letterSpacing: "-0.03em" }}>
                    Sky
                  </p>
                  <p className="text-[14px] mt-1 leading-snug" style={{ color: "var(--c-text3)" }}>
                    Ask me anything about your trip,<br />flights, or network
                  </p>
                </div>
              </div>

              {/* Agent row — horizontal scroll, proper text sizes */}
              <div>
                <p className="label-caps mb-3">5 specialist agents</p>
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                  {agentEntries.map(([key, a]) => (
                    <button
                      key={key}
                      onClick={() => sendMessage(`What can ${a.label} help me with?`)}
                      className="flex-shrink-0 flex flex-col items-center gap-2 py-3.5 rounded-2xl active:scale-95 transition-transform"
                      style={{
                        width: 88,
                        background: `${a.color}10`,
                        border: `1px solid ${a.color}28`,
                      }}
                    >
                      <AgentIcon agentKey={key} color={a.color} size={22} />
                      <div className="text-center px-1">
                        <p className="text-[13px] font-black leading-none" style={{ color: a.color }}>
                          {a.label}
                        </p>
                        <p className="text-[11px] mt-1 leading-tight" style={{ color: "var(--c-text3)" }}>
                          {a.domain}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick prompts */}
              <div>
                <p className="label-caps mb-3">Try asking</p>
                <div className="flex flex-col gap-2.5">
                  {QUICK_PROMPTS.map(p => {
                    const a = AGENTS[p.agent as AgentKey];
                    return (
                      <button
                        key={p.text}
                        onClick={() => sendMessage(p.text)}
                        className="flex items-center gap-4 text-left rounded-2xl active:scale-[0.98] transition-transform"
                        style={{
                          padding: "14px 16px",
                          minHeight: 56,
                          background: "var(--c-muted)",
                          border: "1px solid var(--c-border)",
                        }}
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: `${a.color}14` }}>
                          <AgentIcon agentKey={p.agent as AgentKey} color={a.color} size={16} />
                        </div>
                        <span className="text-[15px] leading-snug" style={{ color: "var(--c-text1)", fontWeight: 500 }}>
                          {p.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          ) : (

            /* ── Message thread ── */
            msgs.map(msg => {
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[82%] rounded-2xl rounded-br-sm px-4 py-3 text-[15px] leading-relaxed"
                      style={{ background: "linear-gradient(135deg,#6B4AF0,#7C6AF5)", color: "#fff" }}>
                      {msg.content}
                    </div>
                  </div>
                );
              }

              const isStreaming = streaming && msg === msgs[msgs.length - 1];
              const isEmpty     = !msg.content && isStreaming;
              const liveAgent   = isStreaming ? peekAgent(msg.content) : null;
              const { agent, text } = parseAgent(msg.content);
              const agentKey = agent ?? liveAgent;
              const a = agentKey ? AGENTS[agentKey] : null;

              return (
                <div key={msg.id} className="flex items-start gap-3">
                  {/* Agent avatar */}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: a ? `${a.color}15` : "rgba(124,106,245,0.12)",
                      border: `1px solid ${a ? a.color + "25" : "rgba(124,106,245,0.2)"}`,
                    }}>
                    {agentKey
                      ? <AgentIcon agentKey={agentKey} color={a!.color} size={16} />
                      : <SkyIcon size={16} />}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    {agentKey && (
                      <span className="text-[12px] font-black" style={{ color: a?.color }}>
                        {a?.label}
                        {isStreaming && isEmpty && (
                          <span className="font-normal ml-1.5" style={{ color: "var(--c-text3)" }}>thinking…</span>
                        )}
                      </span>
                    )}
                    <div className="rounded-2xl rounded-tl-sm px-4 py-3 text-[15px] leading-relaxed"
                      style={{
                        background: "var(--c-muted)",
                        color: "var(--c-text1)",
                        borderLeft: a ? `3px solid ${a.color}` : "none",
                      }}>
                      {isEmpty ? <BouncingDots /> : (text || msg.content)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick chips — only when thread exists */}
        {msgs.length > 0 && !streaming && (
          <div className="flex gap-2 px-5 py-2.5 overflow-x-auto no-scrollbar flex-shrink-0"
            style={{ borderTop: "1px solid var(--c-border)" }}>
            {QUICK_PROMPTS.map(p => {
              const a = AGENTS[p.agent as AgentKey];
              return (
                <button key={p.text} onClick={() => sendMessage(p.text)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full active:scale-95 transition-transform"
                  style={{ background: "var(--c-muted)", border: "1px solid var(--c-border)" }}>
                  <AgentIcon agentKey={p.agent as AgentKey} color={a.color} size={13} />
                  <span className="text-[12px] font-medium whitespace-nowrap" style={{ color: "var(--c-text2)" }}>
                    {p.text}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 px-5 py-3 flex items-end gap-2.5"
          style={{
            borderTop: msgs.length > 0 ? "none" : "1px solid var(--c-border)",
            paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 16px)",
          }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask Sky anything…"
            rows={1}
            className="flex-1 resize-none rounded-2xl px-4 py-3 text-[15px] outline-none"
            style={{
              background: "var(--c-muted)",
              color: "var(--c-text1)",
              border: "1px solid var(--c-border)",
              maxHeight: 100,
              lineHeight: 1.5,
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || streaming}
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-all disabled:opacity-30"
            style={{ background: "linear-gradient(135deg,#6B4AF0,#7C6AF5)" }}
            aria-label="Send">
            <SendIcon />
          </button>
        </div>
      </div>
    </>
  );
}
