"use client";
import { useState } from "react";

type EventCardProps = {
  id: string;
  title: string;
  category: string;
  start: string;
  color: string;
  icon: React.ReactNode;
  description?: string;
};

function fmt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch { return iso; }
}

export default function EventInterestCard({ title, category, start, color, icon, description }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [going, setGoing] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareText = `🎯 ${title} — ${fmt(start)}. Anyone from the flight going?`;

  async function handleShare() {
    // Try native share first (mobile), fallback to clipboard
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch { /* user cancelled or not supported */ }
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard failed */ }
  }

  // Truncate description to 120 chars
  const brief = description
    ? description.length > 120 ? description.slice(0, 117) + "..." : description
    : null;

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
              onClick={(e) => { e.stopPropagation(); setGoing(g => !g); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95"
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

            {/* Share */}
            <button
              onClick={(e) => { e.stopPropagation(); handleShare(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95"
              style={{ background: "var(--c-muted)", color: "var(--c-text2)", border: "1px solid var(--c-border)" }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {copied ? "Copied!" : "Share"}
            </button>

            <div className="flex-1" />

            {going && (
              <p className="text-[10px] text-right" style={{ color: "var(--c-text3)" }}>
                Ask who else is going!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
