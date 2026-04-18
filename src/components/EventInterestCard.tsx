"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type GoingUser = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
};

type EventCardProps = {
  id: string;
  title: string;
  category: string;
  start: string;
  color: string;
  icon: React.ReactNode;
  description?: string;
  // Networking props (optional — gracefully degrades if absent)
  flightNumber?: string;
  departureDate?: string;
  flightChatKey?: string;
  initialGoing?: boolean;
  goingUsers?: GoingUser[];
};

function fmt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch { return iso; }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "")).toUpperCase();
}

export default function EventInterestCard({
  id, title, category, start, color, icon, description,
  flightNumber, departureDate,
  initialGoing = false, goingUsers = [],
}: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [going, setGoing] = useState(initialGoing);
  const [saving, setSaving] = useState(false);
  const [chatSent, setChatSent] = useState(false);

  const canPersist = Boolean(flightNumber && departureDate);

  async function handleToggleGoing(e: React.MouseEvent) {
    e.stopPropagation();
    if (!canPersist) {
      setGoing(g => !g);
      return;
    }

    setSaving(true);
    const prev = going;
    setGoing(!prev); // optimistic

    try {
      const res = await fetch("/api/events/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: id,
          eventTitle: title,
          flightNumber,
          departureDate,
        }),
      });
      if (!res.ok) setGoing(prev); // revert
    } catch {
      setGoing(prev); // revert
    } finally {
      setSaving(false);
    }
  }

  async function handleShareToChat(e: React.MouseEvent) {
    e.stopPropagation();
    if (!flightNumber || !departureDate) {
      // Fallback to native share / clipboard
      const shareText = `🎯 ${title} — ${fmt(start)}. Anyone from the flight going?`;
      if (typeof navigator !== "undefined" && navigator.share) {
        try { await navigator.share({ text: shareText }); return; } catch { /* cancelled */ }
      }
      try {
        await navigator.clipboard.writeText(shareText);
        setChatSent(true);
        setTimeout(() => setChatSent(false), 2000);
      } catch { /* failed */ }
      return;
    }

    // Send to flight chat
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    const text = `🎯 Anyone going to ${title} on ${fmt(start)}? I'm in!`;
    const { error } = await sb.from("flight_messages").insert({
      flight_number: flightNumber,
      departure_date: departureDate,
      sender_id: user.id,
      content: text,
    });

    if (!error) {
      setChatSent(true);
      setTimeout(() => setChatSent(false), 2500);
    }
  }

  // Truncate description to 120 chars
  const brief = description
    ? description.length > 120 ? description.slice(0, 117) + "..." : description
    : null;

  const showGoing = goingUsers.length > 0;
  const displayUsers = goingUsers.slice(0, 3);
  const extraCount = goingUsers.length - 3;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: "var(--c-card)",
        border: going ? `1px solid ${color}50` : "1px solid var(--c-border)",
      }}
    >
      {/* Main row — tap to expand */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full p-3.5 flex items-center gap-3 text-left active:opacity-80 transition-opacity"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18` }}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight line-clamp-1" style={{ color: "var(--c-text1)" }}>
            {title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--c-text3)" }}>
            {fmt(start)} · <span className="capitalize">{category.replace(/-/g, " ")}</span>
          </p>
        </div>

        {/* Going count badge */}
        {showGoing && !expanded && (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: `${color}14`, color }}>
            {goingUsers.length + (going ? 1 : 0)} going
          </span>
        )}

        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          className="flex-shrink-0 transition-transform"
          style={{ color: "var(--c-text3)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3.5 pb-3.5" style={{ borderTop: "1px solid var(--c-border)" }}>
          {/* Description */}
          {brief && (
            <p className="text-xs leading-relaxed pt-3 mb-3" style={{ color: "var(--c-text2)" }}>
              {brief}
            </p>
          )}

          {/* Action row */}
          <div className="flex items-center gap-2 pt-1">
            {/* I'm going toggle */}
            <button
              onClick={handleToggleGoing}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-60"
              style={
                going
                  ? { background: `${color}18`, color, border: `1px solid ${color}50` }
                  : { background: "var(--c-muted)", color: "var(--c-text2)", border: "1px solid var(--c-border)" }
              }
            >
              {going ? (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Going
                </>
              ) : (
                "I'm going"
              )}
            </button>

            {/* Share to flight chat */}
            <button
              onClick={handleShareToChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95"
              style={
                chatSent
                  ? { background: `${color}18`, color, border: `1px solid ${color}50` }
                  : { background: "var(--c-muted)", color: "var(--c-text2)", border: "1px solid var(--c-border)" }
              }
            >
              {canPersist ? (
                // Plane icon for in-app flight chat
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
                    stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                </svg>
              ) : (
                // Share icon for native share
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {chatSent ? "Sent!" : canPersist ? "Tell flight" : "Share"}
            </button>
          </div>

          {/* Who else is going */}
          {(showGoing || going) && (
            <div className="flex items-center gap-2 mt-3 pt-2.5" style={{ borderTop: "1px solid var(--c-border)" }}>
              {/* Stacked avatars */}
              {showGoing && (
                <div className="flex items-center" style={{ marginRight: displayUsers.length > 1 ? -4 : 0 }}>
                  {displayUsers.map((u, i) => (
                    <div
                      key={u.userId}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
                      style={{
                        background: `${color}20`,
                        color,
                        border: "2px solid var(--c-card)",
                        marginLeft: i > 0 ? -8 : 0,
                        zIndex: displayUsers.length - i,
                        position: "relative",
                      }}
                    >
                      {u.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        initials(u.fullName)
                      )}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[11px] leading-tight" style={{ color: "var(--c-text2)" }}>
                {showGoing ? (
                  <>
                    <span className="font-semibold">
                      {displayUsers.map(u => u.fullName.split(" ")[0]).join(", ")}
                      {extraCount > 0 ? ` +${extraCount}` : ""}
                    </span>
                    {" "}
                    {going ? "also going" : goingUsers.length === 1 ? "is going" : "are going"}
                  </>
                ) : going ? (
                  <span style={{ color: "var(--c-text3)" }}>You&apos;re going — invite others!</span>
                ) : null}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
