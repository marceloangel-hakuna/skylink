"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { avatarColor, initials } from "@/lib/utils/avatarColor";

// ─── Types ────────────────────────────────────────────────────────────────────

type FlightMessage = {
  id: string;
  flight_number: string;
  departure_date: string;
  sender_id: string;
  content: string;
  created_at: string;
  // local-only fields
  _pending?: boolean;
  _failed?: boolean;
  _tempId?: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  company: string | null;
};

type FlightInfo = {
  origin: string | null;
  destination: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatSubtitleDate(dateStr: string): string {
  // dateStr is "YYYY-MM-DD"
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function shouldShowTimestamp(curr: FlightMessage, prev: FlightMessage | undefined): boolean {
  if (!prev) return true;
  return (
    new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime() >
    5 * 60_000
  );
}

function shouldShowSender(
  curr: FlightMessage,
  prev: FlightMessage | undefined,
  myId: string | null
): boolean {
  if (curr.sender_id === myId) return false;
  if (!prev) return true;
  return prev.sender_id !== curr.sender_id;
}

// Parse flightKey: split on LAST underscore
function parseFlightKey(flightKey: string): { flightNumber: string; departureDate: string } {
  const idx = flightKey.lastIndexOf("_");
  if (idx === -1) return { flightNumber: flightKey, departureDate: "" };
  return {
    flightNumber: flightKey.slice(0, idx),
    departureDate: flightKey.slice(idx + 1),
  };
}

const OFFLINE_QUEUE_PREFIX = "skylink_fq_";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FlightChatPage() {
  const params = useParams();
  const flightKey = params.flightKey as string;
  const { flightNumber, departureDate } = parseFlightKey(flightKey);

  const [messages, setMessages] = useState<FlightMessage[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [flightInfo, setFlightInfo] = useState<FlightInfo>({ origin: null, destination: null });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const [passengerCount, setPassengerCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgChannelRef = useRef<RealtimeChannel | null>(null);
  const presChannelRef = useRef<RealtimeChannel | null>(null);
  const myIdRef = useRef<string | null>(null);
  const profileCache = useRef<Map<string, Profile>>(new Map());
  const sb = useRef(createClient());
  const storageKey = `${OFFLINE_QUEUE_PREFIX}${flightKey}`;

  // ── Online / offline detection ─────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Offline queue flush ────────────────────────────────────────────────────
  const flushOfflineQueue = useCallback(async () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const queue: string[] = JSON.parse(raw);
      if (!queue.length) return;
      localStorage.removeItem(storageKey);

      for (const text of queue) {
        const uid = myIdRef.current;
        if (!uid) continue;
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const tempMsg: FlightMessage = {
          id: tempId,
          flight_number: flightNumber,
          departure_date: departureDate,
          sender_id: uid,
          content: text,
          created_at: new Date().toISOString(),
          _pending: true,
          _tempId: tempId,
        };
        setMessages(prev => [...prev, tempMsg]);

        const { data: saved, error } = await sb.current
          .from("flight_messages")
          .insert({
            flight_number: flightNumber,
            departure_date: departureDate,
            sender_id: uid,
            content: text,
          })
          .select()
          .single();

        if (error) {
          setMessages(prev =>
            prev.map(m => (m.id === tempId ? { ...m, _pending: false, _failed: true } : m))
          );
        } else if (saved) {
          setMessages(prev => prev.map(m => (m.id === tempId ? { ...saved } : m)));
        }
      }
    } catch {
      // ignore parse errors
    }
  }, [storageKey, flightNumber, departureDate]);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = sb.current;

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setMyId(user.id);
      myIdRef.current = user.id;

      // My profile
      const { data: myProf } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, company")
        .eq("id", user.id)
        .single();
      if (myProf) {
        profileCache.current.set(user.id, myProf);
      }

      // Flight info + passenger count from user_flights
      const { data: flightRow } = await supabase
        .from("user_flights")
        .select("origin, destination")
        .eq("user_id", user.id)
        .eq("flight_number", flightNumber)
        .eq("departure_date", departureDate)
        .maybeSingle();
      if (flightRow) {
        setFlightInfo({ origin: flightRow.origin, destination: flightRow.destination });
      }

      // Count all passengers on this flight
      const { count } = await supabase
        .from("user_flights")
        .select("id", { count: "exact", head: true })
        .eq("flight_number", flightNumber)
        .eq("departure_date", departureDate);
      if (count != null) setPassengerCount(count);

      // Fetch existing flight messages
      const { data: msgs, error } = await supabase
        .from("flight_messages")
        .select("*")
        .eq("flight_number", flightNumber)
        .eq("departure_date", departureDate)
        .order("created_at", { ascending: true });

      if (error) console.error("flight_messages load error:", error);

      const fetched = msgs ?? [];

      // Pre-fetch profiles for all senders
      const senderIds = Array.from(new Set(fetched.map(m => m.sender_id).filter(id => id !== user.id)));
      if (senderIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, role, company")
          .in("id", senderIds);
        for (const p of profs ?? []) {
          profileCache.current.set(p.id, p);
        }
      }

      setMessages(fetched);
      setLoading(false);

      // ── Realtime: new messages ─────────────────────────────────────────
      const msgChannel = supabase
        .channel(`flight_msg:${flightKey}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "flight_messages",
            filter: `flight_number=eq.${flightNumber}`,
          },
          async (payload) => {
            const msg = payload.new as FlightMessage;
            // Only process messages on the right departure date and not from me
            if (msg.departure_date !== departureDate) return;
            if (msg.sender_id === myIdRef.current) return;

            // Fetch sender profile if not cached
            if (!profileCache.current.has(msg.sender_id)) {
              const { data: prof } = await supabase
                .from("profiles")
                .select("id, full_name, avatar_url, role, company")
                .eq("id", msg.sender_id)
                .single();
              if (prof) profileCache.current.set(msg.sender_id, prof);
            }

            setMessages(prev => {
              // Deduplicate
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        )
        .subscribe();
      msgChannelRef.current = msgChannel;

      // ── Presence ──────────────────────────────────────────────────────
      const presChannel = supabase
        .channel(`flight_pres:${flightKey}`, {
          config: { presence: { key: user.id } },
        })
        .on("presence", { event: "sync" }, () => {
          const state = presChannel.presenceState();
          setOnlineCount(Object.keys(state).length);
        })
        .on("presence", { event: "join" }, () => {
          const state = presChannel.presenceState();
          setOnlineCount(Object.keys(state).length);
        })
        .on("presence", { event: "leave" }, () => {
          const state = presChannel.presenceState();
          setOnlineCount(Object.keys(state).length);
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
      if (msgChannelRef.current) supabase.removeChannel(msgChannelRef.current);
      if (presChannelRef.current) supabase.removeChannel(presChannelRef.current);
    };
  }, [flightKey, flightNumber, departureDate]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim();
    if (!text || !myId || sending) return;

    setInput("");

    if (!isOnline) {
      // Queue for later
      try {
        const raw = localStorage.getItem(storageKey);
        const queue: string[] = raw ? JSON.parse(raw) : [];
        queue.push(text);
        localStorage.setItem(storageKey, JSON.stringify(queue));
      } catch {
        // ignore
      }

      // Show as pending
      const tempId = `temp-${Date.now()}`;
      const tempMsg: FlightMessage = {
        id: tempId,
        flight_number: flightNumber,
        departure_date: departureDate,
        sender_id: myId,
        content: text,
        created_at: new Date().toISOString(),
        _pending: true,
        _tempId: tempId,
      };
      setMessages(prev => [...prev, tempMsg]);
      return;
    }

    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const tempMsg: FlightMessage = {
      id: tempId,
      flight_number: flightNumber,
      departure_date: departureDate,
      sender_id: myId,
      content: text,
      created_at: new Date().toISOString(),
      _pending: true,
      _tempId: tempId,
    };
    setMessages(prev => [...prev, tempMsg]);

    const { data: saved, error } = await sb.current
      .from("flight_messages")
      .insert({
        flight_number: flightNumber,
        departure_date: departureDate,
        sender_id: myId,
        content: text,
      })
      .select()
      .single();

    if (error) {
      console.error("Send error:", error);
      setMessages(prev =>
        prev.map(m => (m.id === tempId ? { ...m, _pending: false, _failed: true } : m))
      );
      setInput(text);
    } else if (saved) {
      setMessages(prev => prev.map(m => (m.id === tempId ? { ...saved } : m)));
    }

    setSending(false);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const formattedDate = departureDate ? formatSubtitleDate(departureDate) : "";
  const flightSlug = flightNumber.replace(/\s+/g, "").toLowerCase();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed flex flex-col"
      style={{
        top: 0,
        bottom: "var(--nav-height)",
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "430px",
        background: "var(--background)",
        zIndex: 10,
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0"
        style={{
          background: "var(--c-card)",
          borderBottom: "1px solid var(--c-border)",
          paddingTop: "max(20px, env(safe-area-inset-top, 20px))",
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Back button */}
          <Link
            href="/chat"
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
            style={{ background: "var(--c-muted)" }}
            aria-label="Back to chats"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="var(--color-brand)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </Link>

          {/* Plane icon in brand purple circle */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--color-brand)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
                fill="white"
              />
            </svg>
          </div>

          {/* Title + subtitle */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight truncate" style={{ color: "var(--c-text1)" }}>
              Flight {flightNumber}
            </p>
            <p className="text-[11px] truncate" style={{ color: "var(--c-text3)" }}>
              {flightInfo.origin && flightInfo.destination
                ? `${flightInfo.origin} → ${flightInfo.destination} · `
                : ""}
              {formattedDate && `${formattedDate} · `}
              {onlineCount > 0 ? (
                <span style={{ color: "#22c55e" }}>{onlineCount} online · </span>
              ) : null}
              {passengerCount > 0 ? (
                <Link
                  href={`/flight/${flightSlug}?tab=people`}
                  className="font-semibold"
                  style={{ color: "var(--color-brand)" }}
                >
                  {passengerCount} passenger{passengerCount !== 1 ? "s" : ""}
                </Link>
              ) : (
                "Group chat"
              )}
            </p>
          </div>

          {/* Offline badge */}
          {!isOnline && (
            <span
              className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: "#fef08a", color: "#713f12" }}
            >
              Offline
            </span>
          )}
        </div>
      </div>

      {/* ── Offline banner ──────────────────────────────────────────────── */}
      {!isOnline && (
        <div
          className="flex-shrink-0 px-4 py-2 text-center text-xs font-medium"
          style={{ background: "#fef9c3", color: "#713f12", borderBottom: "1px solid #fde047" }}
        >
          You&apos;re offline — messages will send when you reconnect
        </div>
      )}

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-0.5"
        style={{ background: "var(--background)" }}
      >
        {loading && (
          <div className="flex justify-center items-center flex-1 py-20">
            <div
              className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--color-brand)", borderTopColor: "transparent" }}
            />
          </div>
        )}

        {/* Empty state */}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(74,39,232,0.12), rgba(107,74,240,0.08))" }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
                  fill="var(--color-brand)"
                />
              </svg>
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: "var(--c-text1)" }}>
                Flight {flightNumber} Chat
              </p>
              <p className="text-sm mt-1.5 max-w-[240px] mx-auto leading-relaxed" style={{ color: "var(--c-text3)" }}>
                All passengers on this flight can chat here. Be the first to say hello! ✈️
              </p>
            </div>
          </div>
        )}

        {/* Message list */}
        {!loading &&
          messages.map((msg, i) => {
            const isMe = msg.sender_id === myId;
            const prev = messages[i - 1];
            const showTs = shouldShowTimestamp(msg, prev);
            const showSender = shouldShowSender(msg, prev, myId);
            const senderProfile = profileCache.current.get(msg.sender_id);
            const senderName = senderProfile?.full_name ?? null;
            const senderColor = avatarColor(senderName);
            const senderInits = initials(senderName);

            // Spacer: same sender as previous, not me
            const isContinuation = !isMe && !showSender && !showTs;

            return (
              <div key={msg.id}>
                {/* Timestamp divider */}
                {showTs && (
                  <div className="flex justify-center my-3">
                    <span
                      className="text-[10px] rounded-full px-2.5 py-1 shadow-sm"
                      style={{
                        background: "var(--c-card)",
                        color: "var(--c-text3)",
                        border: "1px solid var(--c-border)",
                      }}
                    >
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                )}

                {/* Sender name above first consecutive message */}
                {showSender && !isMe && (
                  <p
                    className="text-[11px] font-semibold ml-10 mb-0.5 mt-2"
                    style={{ color: "var(--c-text3)" }}
                  >
                    {senderName ?? "Unknown"}
                  </p>
                )}

                <div className={`flex items-end gap-2 mb-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
                  {/* Left avatar or spacer for others */}
                  {!isMe && (
                    <div className="flex-shrink-0 w-7 self-end">
                      {showSender || showTs ? (
                        senderProfile?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={senderProfile.avatar_url}
                            alt={senderName ?? ""}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${senderColor}`}
                          >
                            {senderInits}
                          </div>
                        )
                      ) : isContinuation ? (
                        // spacer div so message aligns under avatar
                        <div className="w-7" />
                      ) : (
                        senderProfile?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={senderProfile.avatar_url}
                            alt={senderName ?? ""}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${senderColor}`}
                          >
                            {senderInits}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe ? "rounded-br-sm text-white" : "rounded-bl-sm shadow-sm"
                    } ${msg._pending ? "opacity-70" : ""} ${msg._failed ? "opacity-50" : ""}`}
                    style={
                      isMe
                        ? { background: "var(--color-brand)" }
                        : {
                            background: "var(--c-card)",
                            color: "var(--c-text1)",
                            border: "1px solid var(--c-border)",
                          }
                    }
                  >
                    {msg.content}
                    {msg._pending && (
                      <span className="ml-1.5 text-[11px]" title="Sending…">⏳</span>
                    )}
                    {msg._failed && (
                      <span className="ml-1.5 text-[11px]" title="Failed to send">⚠️</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ───────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-4 py-3"
        style={{
          background: "var(--c-card)",
          borderTop: "1px solid var(--c-border)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        }}
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={`Message Flight ${flightNumber}…`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none transition-colors"
            style={{
              background: "var(--c-muted)",
              color: "var(--c-text1)",
              border: "1px solid transparent",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform disabled:opacity-40"
            style={{ background: "var(--color-brand)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
