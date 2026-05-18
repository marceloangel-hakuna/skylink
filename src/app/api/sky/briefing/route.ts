import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function flightPhase(departureDate: string | null, depTime: string | null): string {
  if (!departureDate) return "none";
  const dateStr = depTime ? `${departureDate}T${depTime}:00` : `${departureDate}T00:00:00`;
  const dep = new Date(dateStr);
  const now = new Date();
  const h = (dep.getTime() - now.getTime()) / 3600000;
  if (h < -3) return "landed";
  if (h < 0)  return "inflight";
  if (h < 1)  return "boarding";
  if (h < 6)  return "near";
  return "far";
}

function matchScore(a: { role?: string|null; company?: string|null; interests?: unknown }, b: { id: string; role?: string|null; company?: string|null; interests?: unknown }): number {
  let s = 72;
  if (a.company && b.company && a.company.toLowerCase() === b.company.toLowerCase()) s += 20;
  if (a.role && b.role) {
    const aw = a.role.toLowerCase().split(/\s+/);
    const bw = b.role.toLowerCase().split(/\s+/);
    if (aw.some(w => bw.includes(w) && w.length > 3)) s += 6;
  }
  const ai = Array.isArray(a.interests) ? a.interests as string[] : [];
  const bi = Array.isArray(b.interests) ? b.interests as string[] : [];
  s += Math.min(ai.filter(x => bi.includes(x)).length * 3, 8);
  const v = (b.id.charCodeAt(0) + b.id.charCodeAt(b.id.length - 1)) % 11 - 5;
  return Math.min(97, Math.max(61, s + v));
}

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = user.id;

  const [profileRes, flightRes] = await Promise.all([
    supabase.from("profiles").select("full_name, role, company, interests").eq("id", uid).single(),
    supabase.from("user_flights")
      .select("flight_number, origin, destination, departure_date, dep_gate, delay_minutes")
      .eq("user_id", uid)
      .in("status", ["upcoming", "active"])
      .order("departure_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const profile = profileRes.data;
  const flight  = flightRes.data;
  const firstName = (profile?.full_name ?? user.user_metadata?.full_name ?? "there").split(" ")[0];

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Top flightmate match
  let topMatch: { name: string; role: string | null; company: string | null; score: number } | null = null;
  if (flight?.flight_number) {
    const { data: fmRows } = await supabase
      .from("user_flights")
      .select("user_id")
      .eq("flight_number", flight.flight_number)
      .neq("user_id", uid)
      .limit(10);
    const ids = (fmRows ?? []).map(r => r.user_id);
    if (ids.length > 0 && profile) {
      const { data: candidates } = await supabase
        .from("profiles")
        .select("id, full_name, role, company, interests")
        .in("id", ids)
        .not("full_name", "is", null);
      const ranked = (candidates ?? [])
        .map(c => ({ ...c, score: matchScore(profile, c) }))
        .sort((a, b) => b.score - a.score);
      const best = ranked[0];
      if (best && best.score >= 65) {
        topMatch = { name: best.full_name ?? "Someone", role: best.role, company: best.company, score: best.score };
      }
    }
  }

  // Build context for the prompt
  const phase = flightPhase(flight?.departure_date ?? null, null);
  let flightCtx = "no active flight";
  if (flight) {
    const dep = flight.departure_date
      ? new Date(flight.departure_date + "T00:00:00")
      : null;
    const diffH = dep ? (dep.getTime() - now.getTime()) / 3600000 : null;
    const timeStr = diffH !== null
      ? diffH < 0 ? "currently in flight"
      : diffH < 1 ? `boarding now (${Math.round(diffH * 60)}m)`
      : diffH < 24 ? `departing in ${Math.floor(diffH)}h ${Math.round((diffH % 1) * 60)}m`
      : `departing ${Math.round(diffH / 24)}d`
      : "";
    flightCtx = `${flight.flight_number} ${flight.origin}→${flight.destination}, ${timeStr}`;
    if (flight.dep_gate) flightCtx += `, gate ${flight.dep_gate}`;
    if ((flight.delay_minutes ?? 0) > 0) flightCtx += `, delayed ${flight.delay_minutes}m`;
  }

  const matchCtx = topMatch
    ? `Top match: ${topMatch.name} (${[topMatch.role, topMatch.company].filter(Boolean).join(" @ ")}, ${topMatch.score}% compatibility)`
    : "no flight matches yet";

  const systemPrompt = `You are Sky — a proactive AI travel companion. Your role: give the user a warm, personal, intelligent briefing the moment they open the app.

Rules:
- 3-4 sentences maximum. No more.
- Start with "${greeting}, ${firstName}." on the first sentence.
- Lead with the single most time-sensitive or important piece of information.
- If there's a flight match worth meeting, say their name and why in one line.
- End with exactly one clear, specific offer or question — something actionable.
- Tone: warm, sharp, like a trusted advisor who knows you well. Never robotic.
- Never use bullet points or lists. Natural flowing sentences only.
- If no flight is active, make it about opportunity or readiness, not emptiness.`;

  const userPrompt = `Context: ${flightCtx}. ${matchCtx}. Phase: ${phase}. Current time: ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}.`;

  const stream = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 200,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }
        // Send match chip data after text
        if (topMatch) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ match: topMatch })}\n\n`));
        }
        if (flight) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ flight: { number: flight.flight_number, phase } })}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}
