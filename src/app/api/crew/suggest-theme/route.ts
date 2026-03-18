import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const VALID_THEMES = ["city", "tech", "globe", "valley", "vibrant", "ocean"] as const;

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json();

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 16,
      messages: [{
        role: "user",
        content: `Pick a theme for a frequent-flyer crew. Reply with ONLY one word from: city, tech, globe, valley, vibrant, ocean.

- city   → urban commuters, NYC/SFO routes, business travel
- tech   → AI, startups, founders, Silicon Valley, tech industry
- globe  → international travel, LatAm, Asia, global networking
- valley → Bay Area, San Francisco, Golden Gate, West Coast
- vibrant → social, lifestyle, food, entertainment, events
- ocean  → coastal, beach, sailing, Pacific routes, maritime

Crew name: "${name}"
Description: "${description ?? ""}"`,
      }],
    });

    const raw = (msg.content[0] as { type: string; text: string }).text.trim().toLowerCase();
    const theme = (VALID_THEMES as readonly string[]).includes(raw) ? raw : "city";

    return NextResponse.json({ theme });
  } catch {
    return NextResponse.json({ theme: "city" });
  }
}
