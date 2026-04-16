import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const INTEREST_LABELS: Record<string, string> = {
  ai_ml: "AI / ML", fintech: "Fintech", climate: "Climate Tech",
  saas: "SaaS", web3: "Web3", design: "Design",
  vc: "VC", product: "Product", devtools: "DevTools", biotech: "Biotech",
};

function formatInterests(interests: string[] | null): string {
  if (!interests?.length) return "None listed";
  return interests.map(k => INTEREST_LABELS[k] ?? k).join(", ");
}

export async function POST(request: NextRequest) {
  try {
    const { viewerProfile, targetProfile } = await request.json();

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 256,
      system: `You are Atlas, an AI professional matching engine for SkyLink — a networking app for people on the same flight.
Analyze two professionals and return ONLY a JSON object with exactly these three fields:
- "match_percentage": integer 0–100 reflecting genuine professional synergy
- "icebreaker_message": a specific, natural conversation starter under 120 characters
- "match_reason": one short sentence (under 100 chars) on why they should connect
No markdown, no explanation, just the raw JSON.`,
      messages: [{
        role: "user",
        content: `Evaluate these two professionals:

PERSON A (viewer):
Name: ${viewerProfile.full_name ?? "Unknown"}
Role: ${viewerProfile.role ?? "Not specified"}
Company: ${viewerProfile.company ?? "Not specified"}
Bio: ${viewerProfile.bio ?? "No bio"}
Interests: ${formatInterests(viewerProfile.interests)}

PERSON B (target profile):
Name: ${targetProfile.full_name ?? "Unknown"}
Role: ${targetProfile.role ?? "Not specified"}
Company: ${targetProfile.company ?? "Not specified"}
Bio: ${targetProfile.bio ?? "No bio"}
Interests: ${formatInterests(targetProfile.interests)}

Return the JSON now.`,
      }],
    });

    const textBlock = response.content.find(b => b.type === "text");
    const raw = textBlock?.text?.trim() ?? "{}";
    // Strip markdown code fences if Claude wrapped the JSON
    const clean = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const result = JSON.parse(clean);

    return NextResponse.json({
      match_percentage: Math.min(100, Math.max(0, Number(result.match_percentage) || 0)),
      icebreaker_message: String(result.icebreaker_message ?? ""),
      match_reason: String(result.match_reason ?? ""),
    });
  } catch (error) {
    console.error("Atlas match error:", error);
    return NextResponse.json({ error: "Match unavailable" }, { status: 500 });
  }
}
