"use client";

import { useEffect, useState } from "react";

type Profile = {
  id: string;
  full_name: string | null;
  role: string | null;
  company: string | null;
  bio: string | null;
  interests: string[] | null;
};

export default function AtlasIcebreakerCard({
  viewerProfile,
  targetProfile,
}: {
  viewerProfile: Profile;
  targetProfile: Profile;
}) {
  const [icebreaker, setIcebreaker] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/atlas/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ viewerProfile, targetProfile }),
        });
        if (!cancelled && res.ok) {
          const data = await res.json();
          setIcebreaker(data.icebreaker_message ?? null);
        }
      } catch {
        // hide silently
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerProfile.id, targetProfile.id]);

  if (!loading && !icebreaker) return null;

  return (
    <div
      className="rounded-2xl p-4 border"
      style={{
        background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
        borderColor: "rgba(245,158,11,0.3)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-3">
        <span style={{ color: "#D97706", fontSize: "14px" }}>✦</span>
        <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#D97706" }}>
          Atlas Icebreaker
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2 animate-pulse">
          <div className="h-3 rounded-full w-full" style={{ background: "rgba(217,119,6,0.15)" }} />
          <div className="h-3 rounded-full w-4/5" style={{ background: "rgba(217,119,6,0.15)" }} />
          <div className="h-3 rounded-full w-3/5" style={{ background: "rgba(217,119,6,0.15)" }} />
        </div>
      ) : icebreaker ? (
        <p className="text-[14px] leading-relaxed" style={{ color: "#1C1917" }}>
          {icebreaker}
        </p>
      ) : null}
    </div>
  );
}
