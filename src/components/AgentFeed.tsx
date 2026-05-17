"use client";

import { useCallback, useEffect, useState } from "react";
import FeedCard from "./FeedCard";

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

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function sortItems(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => {
    const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (pd !== 0) return pd;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function SkeletonCard({ tall }: { tall?: boolean }) {
  return (
    <div
      className="rounded-2xl animate-pulse"
      style={{
        height: tall ? 140 : 88,
        background: "var(--c-muted)",
        border: "1px solid var(--c-border)",
      }}
    />
  );
}

export default function AgentFeed() {
  const [items,      setItems]      = useState<FeedItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feed");
      if (res.ok) {
        const data = await res.json();
        setItems(sortItems(data.items ?? []));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await fetch("/api/feed/generate", { method: "POST" });
      await fetchItems();
    } finally {
      setGenerating(false);
    }
  }

  function handleDismiss(id: string) {
    setItems(p => p.filter(i => i.id !== id));
  }

  return (
    <div className="stagger-3">

      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[17px] font-black" style={{ color: "var(--c-text1)", letterSpacing: "-0.02em" }}>
            Insights
          </h2>
          {items.length > 0 && (
            <span
              className="text-[10px] font-black rounded-full px-2 py-0.5"
              style={{ background: "rgba(124,106,245,0.12)", color: "#7C6AF5" }}
            >
              {items.length}
            </span>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full active:scale-95 transition-transform text-[11px] font-bold"
          style={{ background: "var(--c-muted)", color: "var(--c-text2)", border: "1px solid var(--c-border)" }}
          aria-label="Refresh insights"
        >
          <svg
            className={generating ? "animate-spin" : ""}
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
          >
            {generating
              ? <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              : <><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>
            }
          </svg>
          {generating ? "Generating" : "Refresh"}
        </button>
      </div>

      {/* States */}
      {loading ? (
        <div className="flex flex-col gap-3">
          <SkeletonCard tall />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : items.length === 0 ? (
        <div
          className="rounded-2xl border flex flex-col items-center text-center gap-3 py-8 px-5"
          style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
            style={{
              background: "linear-gradient(135deg, rgba(124,106,245,0.12), rgba(155,139,255,0.08))",
              color: "#7C6AF5",
              border: "1px solid rgba(124,106,245,0.2)",
            }}
          >
            ✦
          </div>
          <div>
            <p className="text-[15px] font-black" style={{ color: "var(--c-text1)", letterSpacing: "-0.02em" }}>
              No insights yet
            </p>
            <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "var(--c-text3)" }}>
              Your agents are ready to brief you on<br />matches, logistics, and opportunities.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-bold text-white active:scale-95 transition-transform disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #6B4AF0, #7C6AF5)" }}
          >
            <span>✦</span>
            <span>{generating ? "Generating…" : "Brief me"}</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(item => (
            <FeedCard key={item.id} item={item} onDismiss={handleDismiss} />
          ))}
        </div>
      )}
    </div>
  );
}
