import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST — toggle "I'm going" for an event
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId, eventTitle, flightNumber, departureDate } = await req.json();
  if (!eventId || !flightNumber || !departureDate) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Check if already going
  const { data: existing } = await supabase
    .from("event_interests")
    .select("id")
    .eq("user_id", user.id)
    .eq("event_id", eventId)
    .eq("flight_number", flightNumber)
    .single();

  if (existing) {
    await supabase.from("event_interests").delete().eq("id", existing.id);
    return NextResponse.json({ going: false });
  }

  await supabase.from("event_interests").insert({
    user_id: user.id,
    event_id: eventId,
    event_title: eventTitle ?? "",
    flight_number: flightNumber,
    departure_date: departureDate,
  });

  return NextResponse.json({ going: true });
}

// GET — batch-fetch who from my flight is going to given events
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const flightNumber = searchParams.get("flightNumber");
  const eventIds = searchParams.get("eventIds")?.split(",").filter(Boolean);

  if (!flightNumber || !eventIds?.length) {
    return NextResponse.json({ interests: {}, myEventIds: [] });
  }

  const { data: rows } = await supabase
    .from("event_interests")
    .select("event_id, user_id, profiles(full_name, avatar_url)")
    .eq("flight_number", flightNumber)
    .in("event_id", eventIds);

  const interests: Record<string, Array<{ userId: string; fullName: string; avatarUrl: string | null }>> = {};
  const myEventIds: string[] = [];

  for (const row of rows ?? []) {
    if (row.user_id === user.id) {
      myEventIds.push(row.event_id);
    } else {
      const profile = row.profiles as unknown as { full_name: string | null; avatar_url: string | null } | null;
      if (!interests[row.event_id]) interests[row.event_id] = [];
      interests[row.event_id].push({
        userId: row.user_id,
        fullName: profile?.full_name ?? "Unknown",
        avatarUrl: profile?.avatar_url ?? null,
      });
    }
  }

  return NextResponse.json({ interests, myEventIds });
}
