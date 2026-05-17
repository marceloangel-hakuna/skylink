import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function travelState(departureDate: string | null | undefined): string {
  if (!departureDate) return "between flights";
  const dep = new Date(departureDate + "T00:00:00");
  const now = new Date();
  const diffH = (dep.getTime() - now.getTime()) / 3600000;
  if (diffH < -12) return "between flights (recently landed)";
  if (diffH < 0)   return "likely in flight right now";
  if (diffH < 3)   return "boarding soon";
  if (diffH < 24)  return "departing today";
  return `departing in ${Math.round(diffH / 24)} day(s)`;
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, sessionId, history = [] } = await request.json() as {
    message: string;
    sessionId: string;
    history: Array<{ role: string; content: string }>;
  };

  const [profileResult, flightResult] = await Promise.all([
    supabase.from("profiles").select("full_name, role, company, interests").eq("id", user.id).single(),
    supabase.from("user_flights")
      .select("flight_number, origin, destination, departure_date")
      .eq("user_id", user.id)
      .in("status", ["upcoming", "active"])
      .order("departure_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const profile = profileResult.data;
  const flight  = flightResult.data;

  const name      = profile?.full_name ?? "Traveler";
  const role      = profile?.role ?? "";
  const company   = profile?.company ?? "";
  const interests = Array.isArray(profile?.interests) ? (profile.interests as string[]).join(", ") : "";
  const flightNum = flight?.flight_number ?? null;
  const origin    = flight?.origin ?? "";
  const dest      = flight?.destination ?? "";
  const state     = travelState(flight?.departure_date);

  const systemPrompt = `You are Sky, SkyLink's AI travel companion. You have 5 specialist agents — always start your reply with one of these tags on the same line:

[Atlas] — professional networking: who to meet, compatibility, introductions, seat strategy
[Compass] — logistics: flight status, delays, lounges, weather, transport, gate info
[Bridge] — in-flight concierge: amenities, meals, connectivity, cabin crew help
[Vault] — travel finance: expense tracking, budget, reimbursement tips
[Pulse] — network health: follow-up timing, reconnection nudges, relationship decay

Rules:
• Tag first, always. e.g. "[Atlas] I found 3 strong matches on your flight…"
• Be direct. 2-4 sentences for simple questions, brief lists for complex ones
• Use the traveler's first name once per conversation naturally
• If the question spans agents, pick the primary one

Traveler: ${name}${role ? ` · ${role}` : ""}${company ? ` @ ${company}` : ""}
Travel state: ${state}
Active flight: ${flightNum ? `${flightNum} ${origin}→${dest}` : "none"}
Interests: ${interests || "not specified"}`;

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...history.slice(-10).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: message },
  ];

  await supabase.from("assistant_messages").insert({
    user_id: user.id,
    session_id: sessionId,
    role: "user",
    content: message,
  });

  const stream = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 600,
    system: systemPrompt,
    messages,
    stream: true,
  });

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
