"use client";

import { useRouter } from "next/navigation";

type FeedAction = {
  label: string;
  action: "navigate" | "dismiss" | "open_assistant";
  href?: string;
  query?: string;
};

type FeedItem = {
  id: string;
  agent: "atlas" | "compass" | "bridge" | "vault" | "pulse";
  type: string;
  title: string;
  body: string;
  actions: FeedAction[];
  priority: "high" | "medium" | "low";
  read: boolean;
  dismissed: boolean;
  expires_at: string | null;
  created_at: string;
  metadata?: Record<string, unknown>;
};

const AGENTS = {
  atlas:   { label: "Atlas",   color: "#7C6AF5", icon: "✦", css: "feed-atlas" },
  compass: { label: "Compass", color: "#2DD4A8", icon: "◎", css: "feed-compass" },
  bridge:  { label: "Bridge",  color: "#60A5FA", icon: "⌇", css: "feed-bridge" },
  vault:   { label: "Vault",   color: "#F5A623", icon: "◈", css: "feed-vault" },
  pulse:   { label: "Pulse",   color: "#E8567F", icon: "♡", css: "feed-pulse" },
} as const;

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface FeedCardProps {
  item: FeedItem;
  onDismiss: (id: string) => void;
}

export default function FeedCard({ item, onDismiss }: FeedCardProps) {
  const router   = useRouter();
  const agent    = AGENTS[item.agent];
  const isHigh   = item.priority === "high";
  const isAtlas  = item.agent === "atlas";
  const meta     = item.metadata ?? {};

  function handleAction(action: FeedAction) {
    if (action.action === "dismiss") {
      fetch("/api/feed", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, dismissed: true }),
      });
      onDismiss(item.id);
    } else if (action.action === "navigate" && action.href) {
      router.push(action.href);
    } else if (action.action === "open_assistant") {
      window.dispatchEvent(new CustomEvent("openAssistant", { detail: { query: action.query } }));
    }
  }

  /* ── Atlas high-priority match card — rich networking card ─── */
  if (isAtlas && isHigh) {
    const hasMatch   = !!meta.match_name;
    const matchScore = meta.match_score as number | undefined;
    const matchName  = meta.match_name as string | undefined;
    const matchRole  = meta.match_role as string | undefined;
    const matchCo    = meta.match_company as string | undefined;
    const why        = meta.why as string | undefined;
    const initials   = matchName ? matchName.split(" ").map((w: string) => w[0]).slice(0, 2).join("") : "?";

    return (
      <div className="atlas-suggestion-card rounded-2xl overflow-hidden">
        {/* Agent header strip */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <span className="atlas-icon text-[13px] font-black">✦</span>
            <span className="atlas-label text-[11px] font-black tracking-widest uppercase">Atlas</span>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold atlas-badge">
              {item.type}
            </span>
          </div>
          <span className="text-[10px]" style={{ color: "var(--c-text3)" }}>
            {relativeTime(item.created_at)}
          </span>
        </div>

        {/* Match person card — if metadata present */}
        {hasMatch ? (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-[15px] font-black flex-shrink-0 atlas-avatar"
              >
                {initials}
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-black leading-tight" style={{ color: "var(--c-text1)", letterSpacing: "-0.02em" }}>
                  {matchName}
                </p>
                <p className="text-[12px] mt-0.5 truncate" style={{ color: "var(--c-text2)" }}>
                  {[matchRole, matchCo].filter(Boolean).join(" · ")}
                </p>
              </div>

              {/* Score ring */}
              {matchScore && (
                <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                  <div
                    className="w-11 h-11 rounded-full atlas-score-badge flex items-center justify-center"
                  >
                    <span className="text-[14px] font-black text-white">{matchScore}</span>
                  </div>
                  <span className="text-[9px] font-bold atlas-label uppercase tracking-wider">match</span>
                </div>
              )}
            </div>

            {/* Why */}
            {why && (
              <div className="mt-3 px-3 py-2.5 rounded-xl atlas-icebreaker">
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--c-text2)" }}>
                  <span className="font-bold" style={{ color: "var(--c-text2)" }}>Why · </span>
                  {why}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Fallback: text-only atlas card */
          <div className="px-4 pb-3">
            <p className="text-[16px] font-black leading-snug atlas-text-primary" style={{ letterSpacing: "-0.02em" }}>
              {item.title}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "var(--c-text2)" }}>
              {item.body}
            </p>
          </div>
        )}

        {/* Actions */}
        {item.actions.length > 0 && (
          <div
            className="flex gap-2 px-4 py-3 flex-wrap"
            style={{ borderTop: "1px solid rgba(124,106,245,0.15)" }}
          >
            {item.actions.map((a, i) => (
              <button
                key={i}
                onClick={() => handleAction(a)}
                className={
                  a.action === "dismiss"
                    ? "rounded-full px-4 py-2 text-[12px] font-bold active:scale-95 transition-transform"
                    : "atlas-btn-primary rounded-full px-4 py-2 text-[12px] font-bold text-white active:scale-95 transition-transform"
                }
                style={
                  a.action === "dismiss"
                    ? { background: "rgba(124,106,245,0.1)", color: "var(--c-text2)" }
                    : undefined
                }
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── Standard agent feed card ──────────────────────── */
  return (
    <div
      className={`${agent.css} rounded-2xl border overflow-hidden`}
      style={{ borderColor: "var(--c-border)" }}
    >
      {/* Agent header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black"
            style={{ background: `${agent.color}18`, color: agent.color, border: `1px solid ${agent.color}28` }}
          >
            {agent.icon}
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: agent.color }}>
            {agent.label}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: `${agent.color}15`, color: agent.color }}
          >
            {item.type}
          </span>
        </div>
        <span className="text-[10px]" style={{ color: "var(--c-text3)" }}>
          {relativeTime(item.created_at)}
        </span>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-[15px] font-black leading-snug" style={{ color: "var(--c-text1)", letterSpacing: "-0.02em" }}>
          {item.title}
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "var(--c-text2)" }}>
          {item.body}
        </p>

        {/* Actions */}
        {item.actions.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {item.actions.map((a, i) => (
              <button
                key={i}
                onClick={() => handleAction(a)}
                className="rounded-full px-4 py-2 text-[12px] font-bold active:scale-95 transition-transform"
                style={
                  a.action === "dismiss"
                    ? { background: "var(--c-muted)", color: "var(--c-text2)", border: "1px solid var(--c-border)" }
                    : { background: agent.color, color: "#fff" }
                }
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
