"use client";

import { useState, useEffect, useRef } from "react";
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
  title: string | null;
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

// Show a timestamp divider if messages are more than 5 min apart
function shouldShowTimestamp(curr: Message, prev: Message | undefined): boolean {
  if (!prev) return true;
  return new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60_000;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ConversationPage() {
  const params  = useParams();
  const otherId = params.id as string;

  const [messages,     setMessages]     = useState<Message[]>([]);
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);
  const [myId,         setMyId]         = useState<string | null>(null);
  const [input,        setInput]        = useState("");
  const [sending,      setSending]      = useState(false);
  const [loading,      setLoading]      = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef     = useRef<RealtimeChannel | null>(null);
  const supabase       = useRef(createClient());

  // ── Init: load user, profile, messages, subscribe ────────────────────────
  useEffect(() => {
    const sb = supabase.current;

    async function init() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      setMyId(user.id);

      // Other person's profile
      const { data: profile } = await sb
        .from("profiles")
        .select("id, full_name, avatar_url, title, company")
        .eq("id", otherId)
        .single();
      setOtherProfile(profile);

      // All messages between the two users, chronological
      const { data: msgs } = await sb
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),` +
          `and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      setMessages(msgs ?? []);
      setLoading(false);

      // Mark any unread messages from this person as read
      await sb
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("receiver_id", user.id)
        .eq("sender_id", otherId)
        .is("read_at", null);

      // ── Realtime: postgres_changes on messages table ──────────────────────
      // Filter to rows where I'm the receiver — Supabase delivers them
      // instantly when the other person inserts a row.
      const channel = sb
        .channel(`dm:${[user.id, otherId].sort().join(":")}`)
        .on(
          "postgres_changes",
          {
            event:  "INSERT",
            schema: "public",
            table:  "messages",
            filter: `receiver_id=eq.${user.id}`,
          },
          async (payload) => {
            const msg = payload.new as Message;
            // Ignore messages from anyone other than this conversation
            if (msg.sender_id !== otherId) return;

            setMessages(prev => [...prev, msg]);

            // Auto-read
            await sb
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", msg.id);
          }
        )
        .subscribe();

      channelRef.current = channel;
    }

    init();

    return () => {
      if (channelRef.current) sb.removeChannel(channelRef.current);
    };
  }, [otherId]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send ─────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim();
    if (!text || !myId || sending) return;

    setSending(true);
    setInput("");

    // Optimistic update — show immediately with a temp id
    const tempId  = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id:          tempId,
      sender_id:   myId,
      receiver_id: otherId,
      content:     text,
      created_at:  new Date().toISOString(),
      read_at:     null,
    };
    setMessages(prev => [...prev, tempMsg]);

    // Persist to Supabase
    const { data: saved } = await supabase.current
      .from("messages")
      .insert({ sender_id: myId, receiver_id: otherId, content: text })
      .select()
      .single();

    // Swap temp with the real row (has the canonical id + server timestamp)
    if (saved) {
      setMessages(prev => prev.map(m => m.id === tempId ? saved : m));
    }

    setSending(false);
  };

  // ── Derived display values ────────────────────────────────────────────────
  const otherName    = otherProfile?.full_name ?? "";
  const otherInits   = initials(otherName || null);
  const otherSubline = [otherProfile?.title, otherProfile?.company]
    .filter(Boolean).join(" at ");

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)]">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 bg-white border-b border-surface-border"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Back */}
          <Link
            href="/chat"
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
            style={{ background: "#F5F3FF" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#4A27E8" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </Link>

          {/* Other person's avatar */}
          <div className="flex-shrink-0">
            {otherProfile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={otherProfile.avatar_url} alt={otherName}
                className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">
                {loading ? "…" : otherInits}
              </div>
            )}
          </div>

          {/* Name + subtitle */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-900 leading-tight truncate">
              {loading ? "Loading…" : otherName || "Unknown"}
            </p>
            {otherSubline && (
              <p className="text-[11px] text-zinc-400 truncate">{otherSubline}</p>
            )}
          </div>

          {/* Options */}
          <button className="p-2 rounded-full active:bg-surface-muted transition text-zinc-400 flex-shrink-0">
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
        style={{ background: "#F8F7FF" }}
      >
        {/* Loading spinner */}
        {loading && (
          <div className="flex justify-center items-center flex-1 py-20">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                 style={{ borderColor: "#4A27E8", borderTopColor: "transparent" }} />
          </div>
        )}

        {/* Empty state */}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center text-xl font-black">
              {otherInits}
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-800">{otherName || "Unknown"}</p>
              {otherSubline && <p className="text-xs text-zinc-400 mt-0.5">{otherSubline}</p>}
              <p className="text-xs text-zinc-400 mt-3">Say hello to start the conversation 👋</p>
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {!loading && messages.map((msg, i) => {
          const isMe = msg.sender_id === myId;
          const prev = messages[i - 1];
          const showTs = shouldShowTimestamp(msg, prev);
          const isTemp = msg.id.startsWith("temp-");

          return (
            <div key={msg.id}>
              {/* Timestamp divider */}
              {showTs && (
                <div className="flex justify-center my-3">
                  <span className="text-[10px] text-zinc-400 bg-white rounded-full px-2.5 py-1 shadow-sm border border-surface-border">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              )}

              {/* Bubble */}
              <div className={`flex mb-1 ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "rounded-br-sm text-white"
                      : "rounded-bl-sm bg-white text-zinc-800 shadow-sm border border-surface-border"
                  } ${isTemp ? "opacity-70" : ""}`}
                  style={isMe ? { background: "#4A27E8" } : undefined}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input bar ──────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 bg-white border-t border-surface-border px-4 py-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={`Message ${otherProfile?.full_name?.split(" ")[0] ?? "…"}`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            className="flex-1 bg-surface-muted rounded-full px-4 py-2.5 text-sm outline-none border border-transparent focus:border-brand/30 transition-colors"
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
