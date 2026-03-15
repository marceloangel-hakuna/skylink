"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  company: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

function shouldShowTimestamp(curr: Message, prev: Message | undefined): boolean {
  if (!prev) return true;
  return new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60_000;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ConversationPage() {
  const params  = useParams();
  const otherId = params.id as string;

  const [messages,      setMessages]      = useState<Message[]>([]);
  const [otherProfile,  setOtherProfile]  = useState<Profile | null>(null);
  const [myId,          setMyId]          = useState<string | null>(null);
  const [input,         setInput]         = useState("");
  const [sending,       setSending]       = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const messagesEndRef    = useRef<HTMLDivElement>(null);
  const msgChannelRef     = useRef<RealtimeChannel | null>(null);
  const presChannelRef    = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myIdRef           = useRef<string | null>(null);
  const sb                = useRef(createClient());

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = sb.current;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setMyId(user.id);
      myIdRef.current = user.id;

      // Other person's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, company")
        .eq("id", otherId)
        .single();
      setOtherProfile(profile);

      // Load conversation — fetch all my messages and filter client-side
      // (avoids PostgREST nested-and syntax issues)
      const { data: msgs, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: true });

      if (error) console.error("messages load error:", error);

      const filtered = (msgs ?? []).filter(m =>
        (m.sender_id === user.id && m.receiver_id === otherId) ||
        (m.sender_id === otherId && m.receiver_id === user.id)
      );
      setMessages(filtered);
      setLoading(false);

      // Mark incoming as read
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("receiver_id", user.id)
        .eq("sender_id", otherId)
        .is("read_at", null);

      const convId = [user.id, otherId].sort().join(":");

      // ── Realtime: incoming messages ──────────────────────────────────────
      const msgChannel = supabase
        .channel(`dm_msg:${convId}`)
        .on("postgres_changes", {
          event:  "INSERT",
          schema: "public",
          table:  "messages",
          filter: `receiver_id=eq.${user.id}`,
        }, async (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id !== otherId) return;
          setMessages(prev => [...prev, msg]);
          // Mark as read immediately
          await supabase.from("messages")
            .update({ read_at: new Date().toISOString() })
            .eq("id", msg.id);
        })
        .subscribe();
      msgChannelRef.current = msgChannel;

      // ── Presence + typing via broadcast ─────────────────────────────────
      const presChannel = supabase
        .channel(`dm_pres:${convId}`, {
          config: { presence: { key: user.id } },
        })
        .on("presence", { event: "join" }, ({ key }) => {
          if (key === otherId) setIsOtherOnline(true);
        })
        .on("presence", { event: "leave" }, ({ key }) => {
          if (key === otherId) setIsOtherOnline(false);
        })
        .on("presence", { event: "sync" }, () => {
          const state = presChannel.presenceState();
          setIsOtherOnline(otherId in state);
        })
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          if (payload?.userId !== otherId) return;
          setIsOtherTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await presChannel.track({ online_at: new Date().toISOString() });
          }
        });
      presChannelRef.current = presChannel;
    }

    init();

    return () => {
      const supabase = sb.current;
      if (msgChannelRef.current)  supabase.removeChannel(msgChannelRef.current);
      if (presChannelRef.current) supabase.removeChannel(presChannelRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [otherId]);

  // Scroll to bottom when messages or typing indicator changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOtherTyping]);

  // ── Typing broadcast ──────────────────────────────────────────────────────
  const handleInputChange = useCallback((val: string) => {
    setInput(val);
    if (!presChannelRef.current || !myIdRef.current) return;
    presChannelRef.current.send({
      type:    "broadcast",
      event:   "typing",
      payload: { userId: myIdRef.current },
    });
  }, []);

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim();
    if (!text || !myId || sending) return;

    setSending(true);
    setInput("");

    const tempId  = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId, sender_id: myId, receiver_id: otherId,
      content: text, created_at: new Date().toISOString(), read_at: null,
    };
    setMessages(prev => [...prev, tempMsg]);

    const { data: saved, error } = await sb.current
      .from("messages")
      .insert({ sender_id: myId, receiver_id: otherId, content: text })
      .select()
      .single();

    if (error) {
      console.error("Send error:", error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(text);
    } else if (saved) {
      setMessages(prev => prev.map(m => m.id === tempId ? saved : m));
    }

    setSending(false);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const otherName    = otherProfile?.full_name ?? "";
  const otherInits   = initials(otherName || null);
  const otherSubline = [otherProfile?.role, otherProfile?.company].filter(Boolean).join(" at ");

  // ── Render ────────────────────────────────────────────────────────────────
  // position:fixed escapes the outer page-scroll container so the input
  // stays pinned to the bottom and only the messages area scrolls.
  return (
    <div
      className="fixed flex flex-col"
      style={{
        top:       0,
        bottom:    "calc(64px + env(safe-area-inset-bottom, 0px))",
        left:      "50%",
        transform: "translateX(-50%)",
        width:     "100%",
        maxWidth:  "430px",
        background: "var(--background)",
        zIndex:    10,
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0"
        style={{
          background:   "var(--c-card)",
          borderBottom: "1px solid var(--c-border)",
          paddingTop:   "env(safe-area-inset-top, 0px)",
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/chat"
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
            style={{ background: "var(--c-muted)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#4A27E8" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </Link>

          <Link href={`/profile/${otherId}`} className="relative flex-shrink-0 active:opacity-70 transition-opacity">
            {otherProfile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={otherProfile.avatar_url} alt={otherName}
                className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">
                {loading ? "…" : otherInits}
              </div>
            )}
            {isOtherOnline && (
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2"
                style={{ borderColor: "var(--c-card)" }}
              />
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight truncate" style={{ color: "var(--c-text1)" }}>
              {loading ? "Loading…" : otherName || "Unknown"}
            </p>
            <p
              className="text-[11px] truncate transition-colors"
              style={{ color: isOtherTyping ? "#4A27E8" : isOtherOnline ? "#22c55e" : "var(--c-text3)" }}
            >
              {isOtherTyping ? "typing…" : isOtherOnline ? "Online" : (otherSubline || "SkyLink Member")}
            </p>
          </div>

          <button className="p-2 rounded-full active:scale-90 transition flex-shrink-0" style={{ color: "var(--c-text3)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5"  r="1.5"/>
              <circle cx="12" cy="12" r="1.5"/>
              <circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1"
        style={{ background: "var(--background)" }}
      >
        {loading && (
          <div className="flex justify-center items-center flex-1 py-20">
            <div
              className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderColor: "#4A27E8", borderTopColor: "transparent" }}
            />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center text-xl font-black">
              {otherInits}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--c-text1)" }}>{otherName || "Unknown"}</p>
              {otherSubline && (
                <p className="text-xs mt-0.5" style={{ color: "var(--c-text3)" }}>{otherSubline}</p>
              )}
              <p className="text-xs mt-3" style={{ color: "var(--c-text3)" }}>
                Say hello to start the conversation 👋
              </p>
            </div>
          </div>
        )}

        {!loading && messages.map((msg, i) => {
          const isMe   = msg.sender_id === myId;
          const prev   = messages[i - 1];
          const showTs = shouldShowTimestamp(msg, prev);
          const isTemp = msg.id.startsWith("temp-");
          const isRead = isMe && msg.read_at !== null;

          return (
            <div key={msg.id}>
              {showTs && (
                <div className="flex justify-center my-3">
                  <span
                    className="text-[10px] rounded-full px-2.5 py-1 shadow-sm"
                    style={{ background: "var(--c-card)", color: "var(--c-text3)", border: "1px solid var(--c-border)" }}
                  >
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              )}

              <div className={`flex mb-1 ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe ? "rounded-br-sm text-white" : "rounded-bl-sm shadow-sm"
                  } ${isTemp ? "opacity-70" : ""}`}
                  style={isMe
                    ? { background: "#4A27E8" }
                    : { background: "var(--c-card)", color: "var(--c-text1)", border: "1px solid var(--c-border)" }
                  }
                >
                  {msg.content}
                  {isMe && (
                    <span className="ml-1.5 inline-flex items-center" style={{ color: isRead ? "#93c5fd" : "rgba(255,255,255,0.55)" }}>
                      {/* double tick = delivered+read, single = sent */}
                      <svg width="14" height="9" viewBox="0 0 14 9" fill="none">
                        {isRead ? (
                          <>
                            <path d="M1 4.5L4.5 8L9 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M5 4.5L8.5 8L13 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </>
                        ) : (
                          <path d="M3 4.5L6.5 8L11 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        )}
                      </svg>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isOtherTyping && (
          <div className="flex justify-start mb-1">
            <div
              className="px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center shadow-sm"
              style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}
            >
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: "var(--c-text3)", animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ──────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-4 py-3"
        style={{
          background:    "var(--c-card)",
          borderTop:     "1px solid var(--c-border)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        }}
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={`Message ${otherProfile?.full_name?.split(" ")[0] ?? "…"}`}
            value={input}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none transition-colors"
            style={{
              background: "var(--c-muted)",
              color:      "var(--c-text1)",
              border:     "1px solid transparent",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform disabled:opacity-40"
            style={{ background: "#4A27E8" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
