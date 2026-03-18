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
      model: "claude-opus-4-6",
      max_tokens: 4000,
      thinking: { type: "adaptive" },
      messages: [
        {
          role: "user",
          content: `You are an expert SVG illustrator. Create a beautiful, recognizable header illustration for a networking crew.

Crew name: "${name}"
Description: "${description ?? "(none provided)"}"

STEP 1 — THINK: What is the single most iconic, universally recognizable visual symbol for this crew?
- "Buenos Aires" → the Obelisco monument (tall thin obelisk with stepped base), pink Casa Rosada silhouette, tango dancers
- "Messi Fans" → soccer ball (hexagon/pentagon pattern), jersey with vertical stripes, stadium arcs
- "AI Builders" → neural network nodes connected by lines, circuit traces, microchip grid
- "Ocean Lovers" → layered wave silhouettes, fish shapes, crescent moon reflection on water
- "Tokyo Crew" → torii gate silhouette, Mount Fuji outline, cherry blossom circles
- "NYC Founders" → Manhattan skyline with recognizable towers, yellow taxi rectangle, grid streets
- "London Tech" → Big Ben clock tower silhouette, Tower Bridge outline, double-decker bus
- "Coffee & Startups" → coffee cup with steam spirals, chat bubble shapes, coffee bean ovals
- "VC Network" → upward trend line/chart, bar chart columns, handshake arcs
- "Biotech" → DNA double helix path, hexagonal cell, molecule nodes
- "Crypto / Web3" → hexagonal blockchain chain, Ethereum diamond shape, binary dot patterns
- "Design" → bezier curve handles, color palette circles, grid layout, pen tool shape
- "Climate Tech" → wind turbine silhouette, solar panel grid, leaf/plant shape, sun rays
- "Paris" → Eiffel Tower (iconic A-frame with lattice), Arc de Triomphe arch, croissant shape

STEP 2 — DRAW: Build the SVG with these hard rules:
1. viewBox="0 0 400 160" exactly
2. Choose 2 hex colors that feel authentic to the theme (warm colors for food/travel, blues for tech, greens for nature, etc.)
3. Background: soft linear gradient with those 2 colors (light, elegant)
4. The main illustration: draw 1–2 RECOGNIZABLE landmark/icon shapes as the hero element (centered or slightly off-center), built from geometric primitives (rect, path, circle, ellipse, polygon, line)
5. Add supporting decorative elements: smaller repeated motifs, dots, arcs, streaks that reinforce the theme
6. All shape opacities: fillOpacity 0.08–0.30, strokeOpacity 0.12–0.28 — keep it refined and subtle, not garish
7. NO <text>, NO <image>, NO <use>, NO external URLs
8. All coordinates strictly within x: 0–400, y: 0–160
9. Return ONLY the raw SVG — no markdown fences, no explanation, no comments

The output must start with <svg and end with </svg>.`,
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
