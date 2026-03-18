"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url?: string | null;
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

type BestMatch = MatchResult & { profile: Profile };

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

export default function AtlasHomeSuggestion({
  viewerProfile,
  candidates,
}: {
  viewerProfile: Profile;
  candidates: Profile[];
}) {
  const router = useRouter();
  const [best,    setBest]    = useState<BestMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [hidden,  setHidden]  = useState(false);

  useEffect(() => {
    if (!candidates.length) { setLoading(false); return; }
    let cancelled = false;

    (async () => {
      try {
        // Run up to 3 candidates in parallel, pick the highest match
        const top = candidates.slice(0, 3);
        const results = await Promise.all(
          top.map(async (p) => {
            const res = await fetch("/api/atlas/match", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ viewerProfile, targetProfile: p }),
            });
            if (!res.ok) return null;
            const data: MatchResult = await res.json();
            return { ...data, profile: p };
          })
        );
        if (cancelled) return;
        const valid = results.filter(Boolean) as BestMatch[];
        if (valid.length) {
          setBest(valid.sort((a, b) => b.match_percentage - a.match_percentage)[0]);
        }
      } catch {
        // silently hide
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerProfile.id]);

  if (hidden) return null;
  if (!loading && !best) return null;

  return (
    <div className="rounded-2xl p-4 border atlas-suggestion-card">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="atlas-icon text-base leading-none font-black">✦</span>
        <span className="atlas-label text-[13px] font-black tracking-wide">Atlas</span>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full atlas-badge">
          AI Match
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2 animate-pulse">
          <div className="h-3.5 rounded-full atlas-skeleton w-3/4" />
          <div className="h-2.5 rounded-full atlas-skeleton w-1/2" />
          <div className="flex gap-2 mt-2">
            <div className="flex-1 h-9 rounded-full atlas-skeleton" />
            <div className="flex-1 h-9 rounded-full atlas-skeleton" />
          </div>
        </div>
      ) : best ? (
        <>
          {/* Person row */}
          <div className="flex items-center gap-2.5 mb-2">
            {best.profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={best.profile.avatar_url}
                alt={best.profile.full_name ?? ""}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full atlas-avatar flex items-center justify-center font-bold text-sm flex-shrink-0">
                {initials(best.profile.full_name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold truncate atlas-text-primary">
                {best.profile.full_name ?? "Unknown"} · {best.match_percentage}% match
              </p>
              <p className="text-xs truncate atlas-text-secondary">
                {best.match_reason}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/profile/${best.profile.id}`)}
              className="flex-1 text-white text-xs font-semibold py-2.5 rounded-full active:scale-95 transition-transform atlas-btn-primary"
            >
              View Profile
            </button>
            <button
              onClick={() => setHidden(true)}
              className="flex-1 text-xs font-semibold py-2.5 rounded-full active:scale-95 transition-transform border atlas-btn-secondary"
            >
              Later
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
