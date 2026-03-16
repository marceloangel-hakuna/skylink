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

type MatchResult = {
  match_percentage: number;
  icebreaker_message: string;
  match_reason: string;
};

export default function AtlasInsightCard({
  viewerProfile,
  targetProfile,
}: {
  viewerProfile: Profile;
  targetProfile: Profile;
}) {
  const [result,  setResult]  = useState<MatchResult | null>(null);
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
          setResult(data);
        }
      } catch {
        // silently hide on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerProfile.id, targetProfile.id]);

  if (!loading && !result) return null;

  return (
    <div
      className="rounded-2xl p-4 border"
      style={{
        background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
        borderColor: "#EAB308",
        borderWidth: "1px",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-amber-500 text-base leading-none font-black">✦</span>
        <span className="text-[13px] font-black tracking-wide" style={{ color: "#92400E" }}>Atlas</span>
        <span className="text-[11px] font-semibold ml-1" style={{ color: "#78350F" }}>AI Insight</span>
        <span
          className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "#FEF08A", color: "#713F12", border: "1px solid #EAB308" }}
        >
          Match Score
        </span>
      </div>

      {loading ? (
        /* Skeleton */
        <div className="flex flex-col gap-2 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-200/60 flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="h-3 rounded-full bg-amber-200/60 w-3/4" />
              <div className="h-2.5 rounded-full bg-amber-200/60 w-1/2" />
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-200/60 flex-shrink-0" />
          </div>
          <div className="h-2.5 rounded-full bg-amber-200/60 w-full mt-1" />
          <div className="h-2.5 rounded-full bg-amber-200/60 w-4/5" />
        </div>
      ) : result ? (
        <>
          {/* Score row */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold mb-1.5" style={{ color: "#92400E" }}>
                {result.match_reason}
              </p>
              {/* Progress bar */}
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "#FEF08A" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${result.match_percentage}%`,
                    background: "linear-gradient(90deg, #EAB308, #F59E0B)",
                  }}
                />
              </div>
            </div>
            {/* Percentage badge */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-sm shadow-sm"
              style={{ background: "#EAB308", color: "#fff" }}
            >
              {result.match_percentage}%
            </div>
          </div>

          {/* Icebreaker */}
          <div
            className="rounded-xl px-3 py-2.5"
            style={{ background: "#FEF9C3", border: "1px solid #FDE047" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#A16207" }}>
              Icebreaker
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#78350F" }}>
              &ldquo;{result.icebreaker_message}&rdquo;
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
