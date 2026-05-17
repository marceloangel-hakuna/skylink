"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const AGENTS = {
  atlas:   { label: "Atlas",   color: "#7C6AF5", icon: "✦" },
  compass: { label: "Compass", color: "#2DD4A8", icon: "◎" },
  bridge:  { label: "Bridge",  color: "#60A5FA", icon: "⌇" },
  vault:   { label: "Vault",   color: "#F5A623", icon: "◈" },
  pulse:   { label: "Pulse",   color: "#E8567F", icon: "♡" },
};

type AgentKey = keyof typeof AGENTS;

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const QUICK_PROMPTS = ["Who should I meet?", "Check my flight", "Any lounges nearby?"];

const AGENT_REGEX = /^\[(\w+)\]/;

function detectAgent(content: string): { agent: AgentKey | null; text: string } {
  const match = content.match(AGENT_REGEX);
  if (match) {
    const key = match[1].toLowerCase() as AgentKey;
    if (key in AGENTS) {
      return { agent: key, text: content.slice(match[0].length).trimStart() };
    }
  }
  return { agent: null, text: content };
}

function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <path
        d="M11 2 L12.2 8.8 L19 11 L12.2 13.2 L11 20 L9.8 13.2 L3 11 L9.8 8.8 Z"
        fill="white"
      />
    </svg>
  );
}

function BouncingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full inline-block"
          style={{
            background: "var(--c-text3)",
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function UniversalAssistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId] = useState(() => "s_" + Date.now());

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // External trigger
  useEffect(() => {
    function handler(e: Event) {
      const ce = e as CustomEvent<{ query?: string }>;
      setOpen(true);
      if (ce.detail?.query) setInput(ce.detail.query);
    }
    window.addEventListener("openAssistant", handler as EventListener);
    return () => window.removeEventListener("openAssistant", handler as EventListener);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // Focus input when sheet opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [open]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || streaming) return;
      setInput("");

      const userMsg: Msg = { id: "u_" + Date.now(), role: "user", content };
      const assistantId = "a_" + Date.now();
      const assistantMsg: Msg = { id: assistantId, role: "assistant", content: "" };

      setMsgs((prev) => [...prev, userMsg, assistantMsg]);
      setStreaming(true);

      try {
        const history = msgs.slice(-8).map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, sessionId, history }),
        });

        if (!res.ok || !res.body) {
          setMsgs((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: "Sorry, something went wrong." } : m
            )
          );
          setStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === "[DONE]") continue;
            try {
              const parsed = JSON.parse(raw);
              const chunk = parsed.text ?? parsed.delta ?? "";
              if (chunk) {
                setMsgs((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: m.content + chunk } : m
                  )
                );
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      } catch {
        setMsgs((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: "Connection error. Please try again." } : m
          )
        );
      } finally {
        setStreaming(false);
      }
    },
    [input, streaming, msgs, sessionId]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          aria-label="Open Sky assistant"
          onClick={() => setOpen(true)}
          className="fixed flex items-center justify-center w-14 h-14 rounded-full active:scale-95 transition-transform"
          style={{
            bottom: "calc(var(--nav-height, calc(86px + env(safe-area-inset-bottom, 0px))) + 8px)",
            right: "16px",
            background: "linear-gradient(135deg, #7C6AF5, #9B8BFF)",
            boxShadow: "0 4px 20px rgba(124,106,245,0.4)",
            zIndex: 50,
          }}
        >
          <SparkleIcon />
        </button>
      )}

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className="fixed inset-0"
        style={{
          background: "rgba(0,0,0,0.5)",
          opacity: open ? 1 : 0,
          transition: "opacity 0.3s",
          pointerEvents: open ? "auto" : "none",
          zIndex: 55,
        }}
      />

      {/* Bottom Sheet */}
      <div
        className="fixed left-1/2 w-full"
        style={{
          bottom: 0,
          maxWidth: 430,
          height: "70dvh",
          transform: `translateX(-50%) translateY(${open ? "0" : "100%"})`,
          transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)",
          background: "var(--c-card)",
          borderRadius: "28px 28px 0 0",
          borderTop: "1px solid var(--c-border)",
          zIndex: 60,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: "var(--c-border)" }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-base font-black"
            style={{ background: "linear-gradient(135deg, #7C6AF5, #9B8BFF)", color: "#fff" }}
          >
            ✦
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-black leading-tight" style={{ color: "var(--c-text1)" }}>
              Sky
            </p>
            <p className="text-[10px]" style={{ color: "var(--c-text3)" }}>
              AI travel assistant
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-full border flex items-center justify-center active:scale-95 transition-transform"
            style={{ borderColor: "var(--c-border)", color: "var(--c-text2)" }}
            aria-label="Close assistant"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3 min-h-0">
          {msgs.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full gap-3 pb-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: "rgba(124,106,245,0.12)", color: "#7C6AF5" }}
              >
                ✦
              </div>
              <div className="text-center">
                <p className="text-[14px] font-bold" style={{ color: "var(--c-text1)" }}>
                  Meet Sky
                </p>
                <p className="text-[12px] mt-1 max-w-[220px]" style={{ color: "var(--c-text3)" }}>
                  Your AI travel companion. Ask about flights, connections, lounges, and more.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="rounded-full px-3 py-1.5 text-[12px] font-semibold border active:scale-95 transition-transform"
                    style={{
                      borderColor: "var(--c-border)",
                      background: "var(--c-muted)",
                      color: "var(--c-text2)",
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            msgs.map((msg) => {
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div
                      className="max-w-[78%] rounded-2xl rounded-br-sm px-3 py-2 text-[13px] leading-relaxed"
                      style={{ background: "#4A27E8", color: "#fff" }}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              }

              const { agent, text } = detectAgent(msg.content);
              const agentInfo = agent ? AGENTS[agent] : null;
              const isEmpty = !msg.content && streaming;

              return (
                <div key={msg.id} className="flex items-end gap-2">
                  {/* Agent avatar */}
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mb-0.5"
                    style={{
                      background: agentInfo
                        ? `${agentInfo.color}20`
                        : "rgba(124,106,245,0.12)",
                      color: agentInfo ? agentInfo.color : "#7C6AF5",
                    }}
                  >
                    {agentInfo ? agentInfo.icon : "✦"}
                  </div>

                  <div className="max-w-[78%] flex flex-col gap-0.5">
                    {agentInfo && (
                      <span
                        className="text-[10px] font-semibold"
                        style={{ color: agentInfo.color }}
                      >
                        {agentInfo.label}
                      </span>
                    )}
                    <div
                      className="rounded-2xl rounded-bl-sm px-3 py-2 text-[13px] leading-relaxed"
                      style={{ background: "var(--c-muted)", color: "var(--c-text1)" }}
                    >
                      {isEmpty ? <BouncingDots /> : (text || msg.content)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div
          className="flex-shrink-0 px-4 py-3 flex items-end gap-2"
          style={{
            borderTop: "1px solid var(--c-border)",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Sky anything…"
            rows={1}
            className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-[13px] outline-none"
            style={{
              background: "var(--c-muted)",
              color: "var(--c-text1)",
              border: "1px solid var(--c-border)",
              maxHeight: "100px",
              lineHeight: "1.5",
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || streaming}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #7C6AF5, #9B8BFF)",
            }}
            aria-label="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M14 8L2 2l3 6-3 6 12-6z"
                fill="white"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
