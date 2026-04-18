"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type EventCardProps = {
  id: string;
  title: string;
  category: string;
  start: string;
  color: string;
  icon: React.ReactNode;
};

function fmt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch { return iso; }
}

export default function EventInterestCard({ id, title, category, start, color, icon }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [going, setGoing] = useState(false);
  const router = useRouter();

  const shareText = `🎯 ${title} — ${fmt(start)}. Anyone going?`;

  function handleShare() {
    // Share to flight group chat as a pre-filled message
    router.push(`/chat?share=${encodeURIComponent(shareText)}`);
  }

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: "var(--c-card)",
        border: going ? `1px solid ${color}50` : "1px solid var(--c-border)",
      }}
    >
      {/* Main row — tap to expand/collapse */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full p-3.5 flex items-center gap-3 text-left active:opacity-80 transition-opacity"
      >
        {/* Category icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18` }}
        >
          {icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight line-clamp-1" style={{ color: "var(--c-text1)" }}>
            {title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--c-text3)" }}>
            {fmt(start)} · <span className="capitalize">{category.replace(/-/g, " ")}</span>
          </p>
        </div>

        {/* Chevron */}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          className="flex-shrink-0 transition-transform"
          style={{ color: "var(--c-text3)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Expanded detail strip */}
      {expanded && (
        <div
          className="px-3.5 pb-3.5 flex items-center gap-2"
          style={{ borderTop: "1px solid var(--c-border)" }}
        >
          {/* I'm going toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); setGoing(g => !g); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95 mt-2.5"
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

          {/* Share to chat */}
          <button
            onClick={(e) => { e.stopPropagation(); handleShare(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95 mt-2.5"
            style={{ background: "var(--c-muted)", color: "var(--c-text2)", border: "1px solid var(--c-border)" }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Share
          </button>

          <div className="flex-1" />

          {/* Conversation nudge when going */}
          {going && (
            <p className="text-[10px] mt-2.5 text-right" style={{ color: "var(--c-text3)" }}>
              Ask who else is going!
            </p>
          )}
        </div>
      )}

      {/* Suppress unused id warning */}
      <span className="hidden">{id}</span>
    </div>
  );
}
