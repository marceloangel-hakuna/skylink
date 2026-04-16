import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { flightNumber, userId } = (await req.json()) as {
      flightNumber: string;
      userId: string;
    };

    // Service-role client bypasses RLS so we can see other users' flights
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Normalize and deduplicate flight number variants to query
    const flightNum = flightNumber.replace(/\s+/g, "").toUpperCase();
    const flightNumsRaw = [flightNum, flightNumber];
    const flightNums = flightNumsRaw.filter((v, i, a) => a.indexOf(v) === i);

    // Try with networking_status column first
    const { data: flightmates, error } = await sb
      .from("user_flights")
      .select("user_id, networking_status")
      .in("flight_number", flightNums)
      .in("status", ["upcoming", "active", "completed"]);

    if (error) {
      // Column doesn't exist — fall back, treat everyone as available
      const { data: fallback } = await sb
        .from("user_flights")
        .select("user_id")
        .in("flight_number", flightNums)
        .in("status", ["upcoming", "active", "completed"]);

      const ids = (fallback ?? [])
        .map((f: { user_id: string }) => f.user_id)
        .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);

      const statusMap: Record<string, string> = {};
      ids.forEach((id: string) => { statusMap[id] = "available"; });

      return NextResponse.json({ ids, statusMap });
    }

    // Deduplicate by user_id — prefer non-invisible status
    const byUser = new Map<string, { user_id: string; networking_status: string | null }>();
    for (const f of flightmates ?? []) {
      const existing = byUser.get(f.user_id);
      if (!existing || existing.networking_status === "invisible") {
        byUser.set(f.user_id, f);
      }
    }

    // Always include self; exclude others who explicitly set invisible
    const visible = Array.from(byUser.values()).filter(
      (f) => f.user_id === userId || f.networking_status !== "invisible"
    );

    const ids = visible.map((f) => f.user_id);
    const statusMap = Object.fromEntries(
      visible.map((f) => [f.user_id, f.networking_status ?? "available"])
    );

    return NextResponse.json({ ids, statusMap });
  } catch {
    return NextResponse.json({ ids: [], statusMap: {} }, { status: 500 });
  }
}
