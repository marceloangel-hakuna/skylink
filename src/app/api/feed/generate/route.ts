import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Profile = {
  id: string;
  full_name: string | null;
  role: string | null;
  company: string | null;
  interests: unknown;
};

// ── Deterministic match scoring (no Claude tokens) ──────────────────────────
function matchScore(viewer: Profile, candidate: Profile): number {
  let score = 72;
  if (viewer.company && candidate.company &&
      viewer.company.toLowerCase() === candidate.company.toLowerCase()) score += 20;
  if (viewer.role && candidate.role) {
    const vw = viewer.role.toLowerCase().split(/\s+/);
    const cw = candidate.role.toLowerCase().split(/\s+/);
    if (vw.some(w => cw.includes(w) && w.length > 3)) score += 6;
  }
  const vi = Array.isArray(viewer.interests) ? viewer.interests as string[] : [];
  const ci = Array.isArray(candidate.interests) ? candidate.interests as string[] : [];
  score += Math.min(vi.filter(x => ci.includes(x)).length * 3, 8);
  const v = (candidate.id.charCodeAt(0) + candidate.id.charCodeAt(candidate.id.length - 1)) % 11 - 5;
  return Math.min(97, Math.max(61, score + v));
}

function matchWhy(viewer: Profile, candidate: Profile): string {
  const parts: string[] = [];
  if (viewer.company && candidate.company &&
      viewer.company.toLowerCase() === candidate.company.toLowerCase())
    parts.push(`Both at ${candidate.company}`);
  if (viewer.role && candidate.role) {
    const vw = viewer.role.toLowerCase().split(/\s+/);
    const cw = candidate.role.toLowerCase().split(/\s+/);
    if (vw.some(w => cw.includes(w) && w.length > 3))
      parts.push(`Similar ${candidate.role} background`);
  }
  const vi = Array.isArray(viewer.interests) ? viewer.interests as string[] : [];
  const ci = Array.isArray(candidate.interests) ? candidate.interests as string[] : [];
  const shared = vi.filter(x => ci.includes(x));
  if (shared.length > 0) parts.push(`Shared interest in ${shared[0]}`);
  if (parts.length === 0 && candidate.company) parts.push(candidate.company);
  if (parts.length === 0 && candidate.role) parts.push(candidate.role);
  return parts.length > 0 ? parts.join(" · ") : "Strong professional alignment";
}

// ── Route ───────────────────────────────────────────────────────────────────
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid  = user.id;
  const now  = new Date();
  const since24h       = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
  const thirtyDaysAgo  = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString();

  const [profileResult, flightResult, connectionsResult, recentResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, company, interests").eq("id", uid).single(),
    supabase.from("user_flights")
      .select("flight_number, origin, destination, departure_date")
      .eq("user_id", uid)
      .in("status", ["upcoming", "active"])
      .order("departure_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.from("connections")
      .select("id, requester_id, receiver_id, created_at")
      .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`)
      .eq("status", "accepted"),
    supabase.from("feed_items")
      .select("agent, type")
      .eq("user_id", uid)
      .eq("dismissed", false)
      .gte("created_at", since24h),
  ]);

  const profile     = profileResult.data as Profile | null;
  const flight      = flightResult.data;
  const connections = connectionsResult.data ?? [];
  const recentSet   = new Set((recentResult.data ?? []).map(r => `${r.agent}:${r.type}`));

  type NewItem = {
    user_id: string;
    agent: string;
    type: string;
    title: string;
    body: string;
    actions: Array<{ label: string; action: string; href?: string; query?: string }>;
    priority: string;
    metadata?: Record<string, unknown>;
    expires_at?: string;
  };

  const newItems: NewItem[] = [];

  // ── Atlas: best flightmate match with rich metadata ─────────────────────────
  if (flight?.flight_number && !recentSet.has("atlas:match") && profile) {
    const { data: fmRows } = await supabase
      .from("user_flights")
      .select("user_id")
      .eq("flight_number", flight.flight_number)
      .neq("user_id", uid)
      .limit(12);

    const fmIds = (fmRows ?? []).map(f => f.user_id);

    if (fmIds.length > 0) {
      const { data: candidates } = await supabase
        .from("profiles")
        .select("id, full_name, role, company, interests")
        .in("id", fmIds)
        .not("full_name", "is", null)
        .limit(10);

      const ranked = (candidates ?? [] as Profile[])
        .map(c => ({ ...c, score: matchScore(profile, c), why: matchWhy(profile, c) }))
        .sort((a, b) => b.score - a.score);

      const best = ranked[0];
      if (best && best.score >= 65) {
        const firstName = best.full_name?.split(" ")[0] ?? best.full_name ?? "someone";
        const initials  = (best.full_name ?? "?").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

        newItems.push({
          user_id: uid,
          agent: "atlas",
          type: "match",
          title: `Meet ${firstName}`,
          body: best.why,
          actions: [
            { label: "View Profile", action: "navigate", href: `/profile/${best.id}` },
            { label: "Dismiss", action: "dismiss" },
          ],
          priority: "high",
          metadata: {
            match_id:      best.id,
            match_name:    best.full_name ?? "Unknown",
            match_role:    best.role ?? null,
            match_company: best.company ?? null,
            match_score:   best.score,
            why:           best.why,
            initials,
          },
          expires_at: new Date(now.getTime() + 48 * 3600 * 1000).toISOString(),
        });
      }
    }
  }

  // ── Compass: pre-flight briefing ─────────────────────────────────────────────
  if (flight && !recentSet.has("compass:preflight")) {
    const depDate = flight.departure_date
      ? new Date(flight.departure_date + "T00:00:00").toLocaleDateString("en-US", {
          weekday: "short", month: "short", day: "numeric",
        })
      : null;

    newItems.push({
      user_id: uid,
      agent: "compass",
      type: "preflight",
      title: `Pre-flight: ${flight.origin ?? "?"} → ${flight.destination ?? "?"}`,
      body: `${flight.flight_number}${depDate ? ` departs ${depDate}` : ""}. Ask Sky for lounge options, ground transport, and weather at your destination.`,
      actions: [
        {
          label: "Ask Compass",
          action: "open_assistant",
          query: `What should I know before landing at ${flight.destination ?? "my destination"}?`,
        },
        { label: "Dismiss", action: "dismiss" },
      ],
      priority: "medium",
      expires_at: flight.departure_date
        ? new Date(new Date(flight.departure_date + "T00:00:00").getTime() + 36 * 3600 * 1000).toISOString()
        : undefined,
    });
  }

  // ── Pulse: stale connection nudges ───────────────────────────────────────────
  const staleConns = connections.filter(c => c.created_at < thirtyDaysAgo);

  if (staleConns.length > 0 && !recentSet.has("pulse:nudge")) {
    const peerIds = staleConns.slice(0, 3).map(c =>
      c.requester_id === uid ? c.receiver_id : c.requester_id
    );

    const { data: peers } = await supabase
      .from("profiles")
      .select("id, full_name, role, company")
      .in("id", peerIds)
      .not("full_name", "is", null);

    for (const peer of (peers ?? []).slice(0, 1)) {
      const days = Math.floor(
        (now.getTime() - new Date(staleConns[0].created_at).getTime()) / (24 * 3600 * 1000)
      );
      const sub = [peer.role, peer.company].filter(Boolean).join(" at ");

      newItems.push({
        user_id: uid,
        agent: "pulse",
        type: "nudge",
        title: `Reconnect with ${peer.full_name?.split(" ")[0] ?? "a connection"}`,
        body: `You connected ${days}d ago${sub ? ` — ${sub}` : ""}. A short message keeps the relationship warm.`,
        actions: [
          { label: "Send a message", action: "navigate", href: `/chat/${peer.id}` },
          { label: "Dismiss", action: "dismiss" },
        ],
        priority: "low",
        expires_at: new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString(),
      });
    }
  }

  if (newItems.length > 0) {
    await supabase.from("feed_items").insert(newItems);
  }

  return NextResponse.json({ generated: newItems.length });
}
