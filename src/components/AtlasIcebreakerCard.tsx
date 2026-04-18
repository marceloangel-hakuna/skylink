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
    <div className="rounded-2xl p-4 border atlas-icebreaker">
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="atlas-icon text-sm leading-none font-black">✦</span>
        <span className="text-[11px] font-black uppercase tracking-widest atlas-label">
          Atlas Icebreaker
        </span>
        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full atlas-badge">AI</span>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2 animate-pulse">
          <div className="h-3 rounded-full w-full atlas-skeleton" />
          <div className="h-3 rounded-full w-4/5 atlas-skeleton" />
          <div className="h-3 rounded-full w-3/5 atlas-skeleton" />
        </div>
      ) : icebreaker ? (
        <p className="text-[14px] leading-relaxed atlas-text-primary">
          {icebreaker}
        </p>
      ) : null}
    </div>
  );
}
