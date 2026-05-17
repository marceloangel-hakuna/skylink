import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
  const flight = flightResult.data;

  const name = profile?.full_name ?? "Traveler";
  const role = profile?.role ?? "";
  const company = profile?.company ?? "";
  const interests = Array.isArray(profile?.interests)
    ? (profile.interests as string[]).join(", ")
    : "";
  const flightNum = flight?.flight_number ?? "no active flight";
  const origin = flight?.origin ?? "";
  const dest = flight?.destination ?? "";

  const systemPrompt = `You are Sky, SkyLink's AI travel assistant. Route questions to these expert agents:
• Atlas — professional networking, who to meet on flights
• Compass — trip logistics: weather, lounges, transport, flight status
• Bridge — in-flight concierge, real-time flight questions
• Vault — expense tracking and travel spend
• Pulse — network nurturing, follow-up suggestions

Start EVERY response with the agent name in [brackets]. Be concise (2-3 sentences max unless detail is requested).

User: ${name}${role ? `, ${role}` : ""}${company ? ` at ${company}` : ""}
Flight: ${flightNum}${origin && dest ? ` (${origin}→${dest})` : ""}
Interests: ${interests || "not specified"}`;

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...history.slice(-8).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
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
    max_tokens: 400,
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
