import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = user.id;
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [profileResult, flightResult, connectionsResult, recentItemsResult] = await Promise.all([
    supabase.from("profiles").select("full_name, role, company, interests").eq("id", uid).single(),
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

  const profile = profileResult.data;
  const flight = flightResult.data;
  const connections = connectionsResult.data ?? [];
  const recentItems = recentItemsResult.data ?? [];

  const recentSet = new Set(recentItems.map(r => `${r.agent}:${r.type}`));

  type NewItem = {
    user_id: string;
    agent: string;
    type: string;
    title: string;
    body: string;
    actions: Array<{ label: string; action: string; href?: string; query?: string }>;
    priority: string;
    expires_at?: string;
  };

  const newItems: NewItem[] = [];

  // ── Atlas: best match among flightmates ─────────────────────────────────────
  if (flight?.flight_number && !recentSet.has("atlas:match")) {
    const { data: flightmates } = await supabase
      .from("user_flights")
      .select("user_id")
      .eq("flight_number", flight.flight_number)
      .neq("user_id", uid)
      .limit(8);

    const flightmateIds = (flightmates ?? []).map(f => f.user_id);

    if (flightmateIds.length > 0) {
      const { data: flightmateProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, role, company")
        .in("id", flightmateIds)
        .not("full_name", "is", null)
        .limit(6);

      if ((flightmateProfiles ?? []).length > 0) {
        try {
          const candidateList = (flightmateProfiles ?? [])
            .map(p => `id:${p.id} name:"${p.full_name}" role:"${p.role ?? ""}" company:"${p.company ?? ""}"`)
            .join(" | ");

          const userDesc = `${profile?.full_name ?? "Traveler"}, ${profile?.role ?? ""} at ${profile?.company ?? ""}`;

          const response = await client.messages.create({
            model: "claude-haiku-4-5",
            max_tokens: 150,
            system: 'You are Atlas. Pick the best professional match and return ONLY JSON: {"name":"string","profile_id":"string","body":"string"} No markdown.',
            messages: [{ role: "user", content: `User: ${userDesc}. Candidates: ${candidateList}` }],
          });

          const raw = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
          const clean = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
          const parsed = JSON.parse(clean) as { name: string; profile_id: string; body: string };

          if (parsed.profile_id && parsed.name) {
            newItems.push({
              user_id: uid,
              agent: "atlas",
              type: "match",
              title: `Meet ${parsed.name}`,
              body: parsed.body,
              actions: [
                { label: "View Profile", action: "navigate", href: `/profile/${parsed.profile_id}` },
                { label: "Dismiss", action: "dismiss" },
              ],
              priority: "high",
              expires_at: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
            });
          }
        } catch {
          // Atlas unavailable — skip silently
        }
      }
    }
  }

  // ── Compass: preflight briefing ──────────────────────────────────────────────
  if (flight && !recentSet.has("compass:preflight")) {
    const depDate = flight.departure_date
      ? new Date(flight.departure_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
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
        ? new Date(new Date(flight.departure_date + "T00:00:00").getTime() + 36 * 60 * 60 * 1000).toISOString()
        : undefined,
    });
  }

  // ── Pulse: reconnect with stale connections ──────────────────────────────────
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

    for (const peer of (peers ?? []).slice(0, 2)) {
      const daysSince = Math.floor((now.getTime() - new Date(staleConns[0].created_at).getTime()) / (24 * 60 * 60 * 1000));
      const sub = [peer.role, peer.company].filter(Boolean).join(" at ");

      newItems.push({
        user_id: uid,
        agent: "pulse",
        type: "nudge",
        title: `Keep in touch with ${peer.full_name?.split(" ")[0] ?? "a connection"}`,
        body: `You connected with ${peer.full_name ?? "them"} ${daysSince} days ago${sub ? ` — ${sub}` : ""}. A quick message keeps the relationship warm.`,
        actions: [
          { label: "Send Message", action: "navigate", href: `/chat/${peer.id}` },
          { label: "Dismiss", action: "dismiss" },
        ],
        priority: "low",
        expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }

  if (newItems.length > 0) {
    await supabase.from("feed_items").insert(newItems);
  }

  return NextResponse.json({ generated: newItems.length });
}
