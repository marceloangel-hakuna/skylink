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
};

const AGENTS = {
  atlas:   { label: "Atlas",   color: "#7C6AF5", icon: "✦" },
  compass: { label: "Compass", color: "#2DD4A8", icon: "◎" },
  bridge:  { label: "Bridge",  color: "#60A5FA", icon: "⌇" },
  vault:   { label: "Vault",   color: "#F5A623", icon: "◈" },
  pulse:   { label: "Pulse",   color: "#E8567F", icon: "♡" },
};

interface FeedCardProps {
  item: FeedItem;
  onDismiss: (id: string) => void;
}

export default function FeedCard({ item, onDismiss }: FeedCardProps) {
  const router = useRouter();
  const agentInfo = AGENTS[item.agent];
  const isAtlasHigh = item.agent === "atlas" && item.priority === "high";

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
      window.dispatchEvent(
        new CustomEvent("openAssistant", { detail: { query: action.query } })
      );
    }
  }

  if (isAtlasHigh) {
    return (
      <div className="atlas-suggestion-card border rounded-2xl p-4">
        {/* Agent header */}
        <div className="flex items-center gap-1.5">
          <span className="atlas-icon text-[12px] font-black">{agentInfo.icon}</span>
          <span className="atlas-label text-[12px] font-black">{agentInfo.label}</span>
          <span
            className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{
              background: "rgba(124,106,245,0.15)",
              color: "#7C6AF5",
            }}
          >
            {item.type}
          </span>
        </div>

        {/* Title */}
        <p className="mt-1 text-[14px] font-bold" style={{ color: "var(--c-text1)" }}>
          {item.title}
        </p>

        {/* Body */}
        <p className="mt-1 text-[12px] leading-relaxed" style={{ color: "var(--c-text3)" }}>
          {item.body}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {item.actions.map((action, i) => {
            const isDismiss = action.action === "dismiss";
            return (
              <button
                key={i}
                onClick={() => handleAction(action)}
                className="rounded-full px-4 py-2.5 text-xs font-semibold active:scale-95 transition-transform"
                style={
                  isDismiss
                    ? {
                        background: "var(--c-muted)",
                        color: "var(--c-text2)",
                        border: "1px solid var(--c-border)",
                      }
                    : {
                        background: agentInfo.color,
                        color: "#fff",
                      }
                }
              >
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Standard card with colored left border
  return (
    <div
      className="rounded-2xl p-4 border"
      style={{
        background: "var(--c-card)",
        borderColor: "var(--c-border)",
        borderLeft: `3px solid ${agentInfo.color}`,
      }}
    >
      {/* Agent header */}
      <div className="flex items-center gap-1.5">
        <span className="text-[12px] font-black" style={{ color: agentInfo.color }}>
          {agentInfo.icon}
        </span>
        <span className="text-[12px] font-black" style={{ color: agentInfo.color }}>
          {agentInfo.label}
        </span>
        <span
          className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{
            background: `${agentInfo.color}20`,
            color: agentInfo.color,
          }}
        >
          {item.type}
        </span>
      </div>

      {/* Title */}
      <p className="mt-1 text-[14px] font-bold" style={{ color: "var(--c-text1)" }}>
        {item.title}
      </p>

      {/* Body */}
      <p className="mt-1 text-[12px] leading-relaxed" style={{ color: "var(--c-text3)" }}>
        {item.body}
      </p>

      {/* Actions */}
      <div className="flex gap-2 mt-3 flex-wrap">
        {item.actions.map((action, i) => {
          const isDismiss = action.action === "dismiss";
          return (
            <button
              key={i}
              onClick={() => handleAction(action)}
              className="rounded-full px-4 py-2.5 text-xs font-semibold active:scale-95 transition-transform"
              style={
                isDismiss
                  ? {
                      background: "var(--c-muted)",
                      color: "var(--c-text2)",
                      border: "1px solid var(--c-border)",
                    }
                  : {
                      background: agentInfo.color,
                      color: "#fff",
                    }
              }
            >
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
