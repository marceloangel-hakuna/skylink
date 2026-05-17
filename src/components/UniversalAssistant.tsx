"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const AGENTS = {
  atlas:   { label: "Atlas",   color: "#7C6AF5", icon: "✦", domain: "Who to meet" },
  compass: { label: "Compass", color: "#2DD4A8", icon: "◎", domain: "Flight & logistics" },
  bridge:  { label: "Bridge",  color: "#60A5FA", icon: "⌇", domain: "In-flight help" },
  vault:   { label: "Vault",   color: "#F5A623", icon: "◈", domain: "Travel expenses" },
  pulse:   { label: "Pulse",   color: "#E8567F", icon: "♡", domain: "Your network" },
} as const;

type AgentKey = keyof typeof AGENTS;

type Msg = { id: string; role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  { icon: "✦", text: "Who should I meet on my flight?" },
  { icon: "◎", text: "What's the status of my flight?" },
  { icon: "⌇", text: "Write me an icebreaker message" },
  { icon: "♡", text: "Who should I reconnect with?" },
  { icon: "◎", text: "Find lounges at my airport" },
  { icon: "◈", text: "Help me log a travel expense" },
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

function SparkleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden>
      <path d="M11 2 L12.2 8.8 L19 11 L12.2 13.2 L11 20 L9.8 13.2 L3 11 L9.8 8.8 Z" fill="white" />
    </svg>
  );
}

function BouncingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full inline-block"
          style={{ background: "var(--c-text3)", animation: `skydot 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
      <style>{`
        @keyframes skydot {
          0%,80%,100% { transform:translateY(0); opacity:0.4; }
          40%          { transform:translateY(-4px); opacity:1; }
        }
      `}</style>
    </div>
  );
}

function AgentTag({ agentKey }: { agentKey: AgentKey }) {
  const a = AGENTS[agentKey];
  return (
    <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: a.color }}>
      <span>{a.icon}</span>
      {a.label}
    </span>
  );
}

export default function UniversalAssistant() {
  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState<Msg[]>([]);
  const [input, setInput]     = useState("");
  const [streaming, setStr]   = useState(false);
  const [sessionId]           = useState(() => "s_" + Date.now());

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // Restore conversation from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("sky_msgs");
      if (saved) setMsgs(JSON.parse(saved));
    } catch {}
  }, []);

  // Persist conversation
  useEffect(() => {
    if (msgs.length > 0) {
      try { sessionStorage.setItem("sky_msgs", JSON.stringify(msgs.slice(-24))); } catch {}
    }
  }, [msgs]);

  // External trigger from feed cards
  useEffect(() => {
    function handle(e: Event) {
      const ce = e as CustomEvent<{ query?: string }>;
      setOpen(true);
      if (ce.detail?.query) setInput(ce.detail.query);
    }
    window.addEventListener("openAssistant", handle as EventListener);
    return () => window.removeEventListener("openAssistant", handle as EventListener);
  }, []);

  // Scroll to latest
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 380);
  }, [open]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || streaming) return;
      setInput("");
      try { navigator.vibrate?.(8); } catch {}

      const userMsg: Msg = { id: "u_" + Date.now(), role: "user", content };
      const aId = "a_" + Date.now();
      const assistantMsg: Msg = { id: aId, role: "assistant", content: "" };

      setMsgs(p => [...p, userMsg, assistantMsg]);
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

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
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
    },
    [input, streaming, msgs, sessionId]
  );

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <>
      {/* ── FAB — centered pill, hero element ─── */}
      {!open && (
        <button
          aria-label="Open Sky assistant"
          onClick={() => setOpen(true)}
          className="fixed flex items-center gap-2.5 active:scale-95 transition-transform"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
            height: 52,
            paddingInline: 24,
            borderRadius: 26,
            background: "linear-gradient(135deg, #6B4AF0, #7C6AF5, #9B8BFF)",
            animation: "fabPulse 3.5s ease-in-out infinite",
            whiteSpace: "nowrap",
          }}
        >
          <SparkleIcon size={18} />
          <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
            Ask Sky
          </span>
          {msgs.length > 0 && (
            <span
              className="flex items-center justify-center rounded-full text-[9px] font-black"
              style={{ background: "rgba(255,255,255,0.25)", color: "#fff", minWidth: 16, height: 16, paddingInline: 4 }}
            >
              {msgs.filter(m => m.role === "assistant").length}
            </span>
          )}
        </button>
      )}

      {/* ── Backdrop ──────────────────────────── */}
      <div
        onClick={() => setOpen(false)}
        className="fixed inset-0"
        style={{
          background: "rgba(0,0,0,0.55)",
          opacity: open ? 1 : 0,
          transition: "opacity 0.3s",
          pointerEvents: open ? "auto" : "none",
          zIndex: 55,
        }}
      />

      {/* ── Bottom Sheet ─────────────────────── */}
      <div
        className="fixed left-1/2 w-full"
        style={{
          bottom: 0,
          maxWidth: 430,
          height: "85dvh",
          transform: `translateX(-50%) translateY(${open ? "0" : "100%"})`,
          transition: "transform 0.38s cubic-bezier(0.22,1,0.36,1)",
          background: "var(--c-card)",
          borderRadius: "28px 28px 0 0",
          borderTop: "1px solid var(--c-border)",
          zIndex: 60,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--c-border)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
            style={{ background: "linear-gradient(135deg, #6B4AF0, #9B8BFF)", color: "#fff", fontWeight: 900 }}
          >
            ✦
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-black leading-tight" style={{ color: "var(--c-text1)" }}>Sky</p>
            <p className="text-[10px]" style={{ color: "var(--c-text3)" }}>AI travel companion · 5 agents</p>
          </div>
          {msgs.length > 0 && (
            <button
              onClick={() => { setMsgs([]); sessionStorage.removeItem("sky_msgs"); }}
              className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: "var(--c-muted)", color: "var(--c-text3)" }}
              aria-label="Clear conversation"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: "var(--c-muted)", color: "var(--c-text2)" }}
            aria-label="Close assistant"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3 min-h-0">

          {msgs.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-col gap-5 pt-2 pb-4">
              {/* Hero */}
              <div className="flex flex-col items-center gap-2 pt-2">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black"
                  style={{ background: "linear-gradient(135deg, rgba(107,74,240,0.15), rgba(155,139,255,0.1))", color: "#7C6AF5", border: "1px solid rgba(124,106,245,0.25)" }}
                >
                  ✦
                </div>
                <div className="text-center">
                  <p className="text-[16px] font-black" style={{ color: "var(--c-text1)" }}>Meet Sky</p>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--c-text3)" }}>
                    Ask me anything about your trip, flights, or connections
                  </p>
                </div>
              </div>

              {/* Agent grid */}
              <div className="grid grid-cols-5 gap-1.5">
                {(Object.entries(AGENTS) as [AgentKey, typeof AGENTS[AgentKey]][]).map(([key, a]) => (
                  <button
                    key={key}
                    onClick={() => sendMessage(`What can ${a.label} help me with?`)}
                    className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl active:scale-95 transition-transform"
                    style={{ background: `${a.color}10`, border: `1px solid ${a.color}28` }}
                  >
                    <span className="text-lg" style={{ color: a.color }}>{a.icon}</span>
                    <span className="text-[8.5px] font-black leading-none" style={{ color: a.color }}>{a.label}</span>
                    <span className="text-[7.5px] text-center leading-tight px-0.5" style={{ color: "var(--c-text3)" }}>
                      {a.domain}
                    </span>
                  </button>
                ))}
              </div>

              {/* Quick prompts */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-0.5" style={{ color: "var(--c-text3)" }}>
                  Try asking
                </p>
                <div className="flex flex-col gap-2">
                  {QUICK_PROMPTS.slice(0, 4).map((p) => (
                    <button
                      key={p.text}
                      onClick={() => sendMessage(p.text)}
                      className="flex items-center gap-2.5 text-left px-3.5 py-2.5 rounded-xl active:opacity-70 transition-opacity"
                      style={{ background: "var(--c-muted)", color: "var(--c-text2)", border: "1px solid var(--c-border)" }}
                    >
                      <span className="text-sm flex-shrink-0" style={{ color: "var(--c-text3)" }}>{p.icon}</span>
                      <span className="text-[13px]">{p.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── Message thread ── */
            msgs.map((msg) => {
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div
                      className="max-w-[80%] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-[13px] leading-relaxed"
                      style={{ background: "linear-gradient(135deg, #6B4AF0, #7C6AF5)", color: "#fff" }}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              }

              const isStreaming = streaming && msg === msgs[msgs.length - 1];
              const isEmpty     = !msg.content && isStreaming;
              const liveAgent   = isStreaming ? peekAgent(msg.content) : null;
              const { agent, text } = parseAgent(msg.content);
              const agentKey    = agent ?? liveAgent;
              const a           = agentKey ? AGENTS[agentKey] : null;

              return (
                <div key={msg.id} className="flex items-start gap-2">
                  {/* Agent avatar */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
                    style={{
                      background: a ? `${a.color}18` : "rgba(124,106,245,0.12)",
                      color: a ? a.color : "#7C6AF5",
                      border: `1px solid ${a ? a.color + "28" : "rgba(124,106,245,0.2)"}`,
                    }}
                  >
                    {a ? a.icon : "✦"}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    {/* Agent label — show even while streaming so user knows who's responding */}
                    {agentKey && <AgentTag agentKey={agentKey} />}

                    <div
                      className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[13px] leading-relaxed"
                      style={{
                        background: "var(--c-muted)",
                        color: "var(--c-text1)",
                        borderLeft: a ? `3px solid ${a.color}` : "none",
                      }}
                    >
                      {isEmpty ? (
                        <div className="flex items-center gap-2">
                          <BouncingDots />
                          {agentKey && (
                            <span className="text-[10px] font-semibold" style={{ color: a?.color }}>
                              thinking…
                            </span>
                          )}
                        </div>
                      ) : (
                        text || msg.content
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Scrollable quick-prompt chips when thread has messages */}
        {msgs.length > 0 && !streaming && (
          <div
            className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar flex-shrink-0"
            style={{ borderTop: "1px solid var(--c-border)" }}
          >
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p.text}
                onClick={() => sendMessage(p.text)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full active:scale-95 transition-transform text-[11px] font-medium"
                style={{ background: "var(--c-muted)", color: "var(--c-text2)", border: "1px solid var(--c-border)" }}
              >
                <span style={{ fontSize: 12 }}>{p.icon}</span>
                {p.text}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div
          className="flex-shrink-0 px-4 py-3 flex items-end gap-2"
          style={{
            borderTop: msgs.length > 0 ? "none" : "1px solid var(--c-border)",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask Sky anything…"
            rows={1}
            className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-[13px] outline-none"
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
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-all disabled:opacity-30"
            style={{ background: "linear-gradient(135deg, #6B4AF0, #7C6AF5)" }}
            aria-label="Send"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M14 8L2 2l3 6-3 6 12-6z" fill="white" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
