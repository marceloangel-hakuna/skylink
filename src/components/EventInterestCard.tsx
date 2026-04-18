"use client";
import { useState } from "react";

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
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch { return iso; }
}

export default function EventInterestCard({ id, title, category, start, color, icon }: EventCardProps) {
  const [going, setGoing] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: "var(--c-card)",
        border: going ? `1px solid ${color}50` : "1px solid var(--c-border)",
      }}
    >
      <div className="p-3.5 flex items-center gap-3">
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

        {/* Toggle */}
        <button
          onClick={() => setGoing(g => !g)}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95"
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
      </div>

      {/* Nudge strip — only when going */}
      {going && (
        <div
          className="px-3.5 pb-3 pt-0 flex items-center gap-2"
          style={{ borderTop: "1px solid var(--c-border)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5" style={{ color }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
          </svg>
          <p className="text-[11px] leading-relaxed flex-1 pt-2.5" style={{ color: "var(--c-text3)" }}>
            Mention it to people on your flight — great conversation starter!
          </p>
        </div>
      )}

      {/* Suppress unused id warning */}
      <span className="hidden">{id}</span>
    </div>
  );
}
