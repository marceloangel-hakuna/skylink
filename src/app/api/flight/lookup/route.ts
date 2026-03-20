import { NextResponse } from "next/server";

export const maxDuration = 15;

type AirLabsFlight = {
  flight_iata?: string;
  dep_iata?: string;
  arr_iata?: string;
  dep_time?: string;       // "2025-03-20 14:30"
  arr_time?: string;
  dep_time_utc?: string;
  arr_time_utc?: string;
  status?: string;         // "scheduled" | "active" | "landed" | "cancelled"
  airline_iata?: string;
  airline_name?: string;
  dep_terminal?: string;
  dep_gate?: string;
  arr_terminal?: string;
  arr_gate?: string;
  duration?: number;       // minutes
  delayed?: number;        // minutes
  dep_city?: string;
  arr_city?: string;
  dep_name?: string;       // airport name
  arr_name?: string;
};

function parseDate(dt?: string): string | null {
  if (!dt) return null;
  return dt.split(" ")[0] ?? null;
}

function parseTime(dt?: string): string | null {
  if (!dt) return null;
  return dt.split(" ")[1] ?? null;
}

async function queryAirLabs(endpoint: string, params: Record<string, string>) {
  const key = process.env.AIRLABS_API_KEY;
  if (!key) { console.error("AIRLABS_API_KEY not set"); return null; }
  const url = new URL(`https://airlabs.co/api/v9/${endpoint}`);
  url.searchParams.set("api_key", key);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  // AirLabs always returns HTTP 200 — check for error field in body
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  if (data?.error) { console.error("AirLabs error:", data.error.message); return null; }
  return data;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("flight")?.trim().toUpperCase().replace(/\s+/g, "") ?? "";
  if (!raw || raw.length < 4) {
    return NextResponse.json({ error: "Flight number too short" }, { status: 400 });
  }

  let flight: AirLabsFlight | null = null;

  // 1. Try real-time flight status first
  const liveData = await queryAirLabs("flight", { flight_iata: raw });
  if (liveData?.response) {
    flight = liveData.response as AirLabsFlight;
  }

  // 2. If not live, try schedules (future flights)
  if (!flight?.dep_iata) {
    const schedData = await queryAirLabs("schedules", { flight_iata: raw });
    if (schedData?.response?.length > 0) {
      flight = schedData.response[0] as AirLabsFlight;
    }
  }

  if (!flight?.dep_iata) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found:          true,
    flight_iata:    flight.flight_iata ?? raw,
    origin:         flight.dep_iata ?? null,
    destination:    flight.arr_iata ?? null,
    dep_city:       flight.dep_city ?? flight.dep_name ?? null,
    arr_city:       flight.arr_city ?? flight.arr_name ?? null,
    departure_date: parseDate(flight.dep_time ?? flight.dep_time_utc),
    departure_time: parseTime(flight.dep_time),
    arrival_date:   parseDate(flight.arr_time ?? flight.arr_time_utc),
    arrival_time:   parseTime(flight.arr_time),
    status:         flight.status ?? "scheduled",
    airline:        flight.airline_iata ?? null,
    duration:       flight.duration ?? null,
    delayed:        flight.delayed ?? 0,
    dep_terminal:   flight.dep_terminal ?? null,
    dep_gate:       flight.dep_gate ?? null,
    arr_terminal:   flight.arr_terminal ?? null,
    arr_gate:       flight.arr_gate ?? null,
  });
}
