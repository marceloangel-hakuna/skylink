import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type AirLabsResponse = {
  dep_iata?: string;
  arr_iata?: string;
  dep_gate?: string;
  dep_delayed?: number;   // minutes of departure delay
  status?: string;        // scheduled | active | landed | cancelled
  dep_time_ts?: number;   // unix timestamp of scheduled departure
  flight_status?: string;
};

async function fetchFlightData(flightIata: string, apiKey: string): Promise<AirLabsResponse | null> {
  try {
    // Try live endpoint first
    const liveRes = await fetch(
      `https://airlabs.co/api/v9/flight?api_key=${apiKey}&flight_iata=${flightIata}`,
      { cache: "no-store", signal: AbortSignal.timeout(8000) }
    );
    if (liveRes.ok) {
      const j = await liveRes.json();
      if (j?.response?.dep_iata) return j.response as AirLabsResponse;
    }
    // Fall back to schedules
    const schedRes = await fetch(
      `https://airlabs.co/api/v9/schedules?api_key=${apiKey}&flight_iata=${flightIata}`,
      { cache: "no-store", signal: AbortSignal.timeout(8000) }
    );
    if (schedRes.ok) {
      const j = await schedRes.json();
      if (j?.response?.[0]?.dep_iata) return j.response[0] as AirLabsResponse;
    }
  } catch { /* timeout or network error */ }
  return null;
}

export async function GET(req: Request) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.AIRLABS_API_KEY;
  if (!apiKey) return NextResponse.json({ skipped: "no AIRLABS_API_KEY" });

  const supabase = createClient();
  const now = new Date();
  const alertWindow = new Date(now.getTime() - 3 * 3600 * 1000).toISOString(); // 3h dedup window

  // Fetch all upcoming/active flights in the next 24h
  const { data: activeFlights } = await supabase
    .from("user_flights")
    .select("user_id, flight_number, origin, destination, departure_date, dep_gate, delay_minutes")
    .in("status", ["upcoming", "active"])
    .gte("departure_date", now.toISOString().split("T")[0]);

  if (!activeFlights || activeFlights.length === 0) {
    return NextResponse.json({ checked: 0, alerts: 0 });
  }

  // Deduplicate flight_numbers to minimize AirLabs API calls
  const uniqueFlights = Array.from(new Set(activeFlights.map(f => f.flight_number)));

  // Fetch AirLabs data for each unique flight
  const flightDataMap = new Map<string, AirLabsResponse>();
  await Promise.all(
    uniqueFlights.map(async fn => {
      const data = await fetchFlightData(fn.replace(/\s+/g, ""), apiKey);
      if (data) flightDataMap.set(fn, data);
    })
  );

  // Check which users already got a compass alert in the dedup window
  const { data: recentAlerts } = await supabase
    .from("feed_items")
    .select("user_id, metadata")
    .eq("agent", "compass")
    .in("type", ["delay", "gate_change", "cancelled"])
    .gte("created_at", alertWindow);

  const recentAlertSet = new Set(
    (recentAlerts ?? []).map(a => `${a.user_id}:${(a.metadata as Record<string,unknown>)?.flight_number ?? ""}`)
  );

  const newItems: object[] = [];
  const flightUpdates: Map<string, { dep_gate?: string; delay_minutes?: number }> = new Map();

  for (const flight of activeFlights) {
    const airData = flightDataMap.get(flight.flight_number);
    if (!airData) continue;

    const alertKey = `${flight.user_id}:${flight.flight_number}`;
    if (recentAlertSet.has(alertKey)) continue; // already alerted recently

    const newGate    = airData.dep_gate ?? null;
    const newDelay   = airData.dep_delayed ?? 0;
    const isCancelled = airData.status === "cancelled";

    const storedGate  = flight.dep_gate ?? null;
    const storedDelay = flight.delay_minutes ?? 0;

    const gateChanged   = newGate && storedGate && newGate !== storedGate;
    const gateAnnounced = newGate && !storedGate;
    const delayIncreased = newDelay >= 20 && newDelay > storedDelay + 10;
    const newlyCancelled = isCancelled && flight.dep_gate !== "CANCELLED";

    // Track updates for batch write
    const updateKey = flight.flight_number;
    if (!flightUpdates.has(updateKey)) {
      flightUpdates.set(updateKey, {
        dep_gate: newGate ?? undefined,
        delay_minutes: newDelay,
      });
    }

    if (newlyCancelled) {
      newItems.push({
        user_id: flight.user_id,
        agent: "compass",
        type: "cancelled",
        title: `${flight.flight_number} has been cancelled`,
        body: "Your flight has been cancelled. Contact your airline for rebooking options.",
        actions: [
          { label: "Ask Compass", action: "open_assistant",
            query: `My flight ${flight.flight_number} was cancelled. What are my options?` },
          { label: "Dismiss", action: "dismiss" },
        ],
        priority: "high",
        metadata: {
          flight_number: flight.flight_number,
          alert_type: "cancelled",
        },
        expires_at: new Date(now.getTime() + 12 * 3600 * 1000).toISOString(),
      });
    } else if (gateChanged) {
      newItems.push({
        user_id: flight.user_id,
        agent: "compass",
        type: "gate_change",
        title: `Gate change — ${flight.flight_number}`,
        body: `Your gate has moved from ${storedGate} to ${newGate}. Head to the new gate now.`,
        actions: [
          { label: "Got it", action: "dismiss" },
        ],
        priority: "high",
        metadata: {
          flight_number: flight.flight_number,
          old_gate: storedGate,
          new_gate: newGate,
          alert_type: "gate_change",
        },
        expires_at: new Date(now.getTime() + 6 * 3600 * 1000).toISOString(),
      });
    } else if (gateAnnounced) {
      newItems.push({
        user_id: flight.user_id,
        agent: "compass",
        type: "gate_change",
        title: `Gate assigned — ${flight.flight_number}`,
        body: `Your departure gate is ${newGate}. You're all set.`,
        actions: [
          { label: "Got it", action: "dismiss" },
        ],
        priority: "medium",
        metadata: {
          flight_number: flight.flight_number,
          new_gate: newGate,
          alert_type: "gate_announced",
        },
        expires_at: new Date(now.getTime() + 8 * 3600 * 1000).toISOString(),
      });
    } else if (delayIncreased) {
      const h = Math.floor(newDelay / 60);
      const m = newDelay % 60;
      const delayStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
      newItems.push({
        user_id: flight.user_id,
        agent: "compass",
        type: "delay",
        title: `${flight.flight_number} delayed ${delayStr}`,
        body: `Your flight is running ${delayStr} late. ${newGate ? `Gate ${newGate}. ` : ""}Use the extra time to network or grab a bite.`,
        actions: [
          { label: "Ask Compass", action: "open_assistant",
            query: `My flight ${flight.flight_number} is delayed ${delayStr}. What lounges or restaurants are near my gate?` },
          { label: "Dismiss", action: "dismiss" },
        ],
        priority: newDelay >= 60 ? "high" : "medium",
        metadata: {
          flight_number: flight.flight_number,
          delay_minutes: newDelay,
          gate: newGate ?? null,
          alert_type: "delay",
        },
        expires_at: new Date(now.getTime() + 6 * 3600 * 1000).toISOString(),
      });
    }
  }

  // Batch insert feed items
  if (newItems.length > 0) {
    await supabase.from("feed_items").insert(newItems);
  }

  // Update user_flights with latest gate/delay for each flight_number
  await Promise.all(
    Array.from(flightUpdates.entries()).map(([fn, updates]) =>
      supabase
        .from("user_flights")
        .update(updates)
        .eq("flight_number", fn)
        .in("status", ["upcoming", "active"])
    )
  );

  return NextResponse.json({
    checked: activeFlights.length,
    flights: uniqueFlights.length,
    alerts: newItems.length,
  });
}
