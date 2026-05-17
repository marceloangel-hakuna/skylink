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
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function sortItems(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => {
    const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (pd !== 0) return pd;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border h-[80px] animate-pulse" style={{ background: "var(--c-muted)", borderColor: "var(--c-border)" }} />
  );
}

export default function AgentFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="stagger-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-black" style={{ color: "var(--c-text1)" }}>
          Insights
        </h2>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-8 h-8 rounded-full border flex items-center justify-center active:scale-95 transition-transform"
          style={{ borderColor: "var(--c-border)", background: "var(--c-card)" }}
          aria-label="Refresh insights"
        >
          {generating ? (
            <svg
              className="w-4 h-4 animate-spin"
              style={{ color: "var(--c-text2)" }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              style={{ color: "var(--c-text2)" }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          )}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : items.length === 0 ? (
        <div
          className="rounded-2xl border p-6 flex flex-col items-center text-center gap-2"
          style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-xl mb-1"
            style={{ background: "rgba(124,106,245,0.12)", color: "#7C6AF5" }}
          >
            ✦
          </div>
          <p className="text-[13px] font-bold" style={{ color: "var(--c-text1)" }}>
            No insights yet
          </p>
          <p className="text-[11px]" style={{ color: "var(--c-text3)" }}>
            Tap to generate personalized flight insights
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary mt-2 flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold active:scale-95 transition-transform"
          >
            <span>✦</span>
            <span>{generating ? "Generating…" : "Generate Insights"}</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <FeedCard key={item.id} item={item} onDismiss={handleDismiss} />
          ))}
        </div>
      )}
    </div>
  );
}
