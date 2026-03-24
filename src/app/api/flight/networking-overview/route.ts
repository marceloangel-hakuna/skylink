import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Profile = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
};

export async function POST(req: Request) {
  try {
    const { viewer, people, flightNumber } = (await req.json()) as {
      viewer: Profile;
      people: Profile[];
      flightNumber: string;
    };

    const others = people.filter((p) => p.id !== viewer.id);

    if (!others.length) {
      return NextResponse.json({
        insight:
          "You're the first SkyLink member visible on this flight. Set yourself as Available so others can find you.",
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ insight: null });

    const client = new Anthropic({ apiKey });

    const viewerDesc = [viewer.name, viewer.role, viewer.company]
      .filter(Boolean)
      .join(" · ");

    const othersDesc = others
      .map((p) =>
        [p.name, p.role, p.company].filter(Boolean).join(" · ")
      )
      .join("; ");

    const prompt = `You are Atlas, a sharp AI networking assistant inside SkyLink, a professional networking app for frequent flyers.

Flight ${flightNumber}. You are briefing the viewer about who's on this flight and what networking opportunity exists.

Viewer: ${viewerDesc}
Other visible members: ${othersDesc}

Write exactly 2 punchy sentences (under 180 characters total):
1. Who's on the flight — highlight industries, roles, or companies that stand out
2. The specific opportunity or angle for this viewer given their background

Be specific, energetic, and actionable. Plain text only.`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 140,
      messages: [{ role: "user", content: prompt }],
    });

    const insight =
      response.content[0].type === "text"
        ? response.content[0].text.trim()
        : null;

    return NextResponse.json({ insight });
  } catch {
    return NextResponse.json({ insight: null });
  }
}
