import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

/** Strip anything dangerous from Claude-generated SVG */
function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/on\w+\s*=\s*'[^']*'/gi, "")
    .replace(/href\s*=\s*"(?!#)[^"]*"/gi, "")
    .replace(/xlink:href\s*=\s*"[^"]*"/gi, "")
    .replace(/<text[\s\S]*?<\/text>/gi, "")
    .replace(/<image[^>]*\/?>/gi, "")
    .replace(/<use[^>]*\/?>/gi, "");
}

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1800,
      messages: [
        {
          role: "user",
          content: `Create a unique, thematic SVG illustration header for a travel networking crew.

Crew name: "${name}"
Description: "${description ?? "(none provided)"}"

Your goal: analyze the crew name/description and create an illustration that VISUALLY REPRESENTS its theme.

Examples of thematic illustrations:
- "AI Builders" → circuit traces, neural network nodes, subtle tech grid patterns
- "Ocean Lovers" → wave silhouettes, fish, ripple circles, moon reflection
- "Coffee & Founders" → coffee cup steam swirls, chat bubbles, subtle bean shapes
- "SFO → NYC Weekly" → airplane silhouette, city skyline silhouettes, flight arc path
- "VC Summit" → mountain silhouettes, bar chart shapes, upward arrows
- "Biotech Pioneers" → DNA double helix, molecule shapes, hexagonal cell patterns
- "Crypto & Web3" → hexagonal blockchain nodes, chain links, binary-like dot patterns
- "Design Thinkers" → geometric shapes, bezier curves, color swatches, grid layout

Hard rules:
1. viewBox="0 0 400 160" exactly
2. Pick 2 harmonious hex colors that authentically reflect the crew's theme (avoid generic blue/gray)
3. Background: linear gradient from color1 to color2 (subtle, elegant, light-ish)
4. Add 12–20 shapes that form recognizable thematic elements — NOT just random abstract shapes
5. Shapes must use the 2 colors with fillOpacity between 0.06 and 0.28 and strokeOpacity between 0.10 and 0.25
6. Absolutely NO <text> elements, NO <image>, NO <use>, NO external URLs
7. All coordinates within x: 0–400 and y: 0–160
8. Return ONLY the raw SVG markup — no markdown, no code fences, no explanation

Format to follow exactly:
<svg viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="400" y2="160" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="COLOR1"/>
      <stop offset="100%" stop-color="COLOR2"/>
    </linearGradient>
  </defs>
  <rect width="400" height="160" fill="url(#bg)"/>
  [12–20 thematic shapes specific to the crew concept]
</svg>`,
        },
      ],
    });

    const raw = (msg.content[0] as { type: string; text: string }).text.trim();

    // Extract the SVG block (handle if model wraps in code fences)
    const match = raw.match(/<svg[\s\S]*?<\/svg>/i);
    if (!match) {
      return NextResponse.json({ error: "No SVG in response" }, { status: 500 });
    }

    const svg = sanitizeSvg(match[0]);
    return NextResponse.json({ svg });
  } catch (e) {
    console.error("generate-header error:", e);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
