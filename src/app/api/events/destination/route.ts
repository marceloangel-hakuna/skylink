import { NextRequest, NextResponse } from "next/server";

const PHQ_KEY  = process.env.PREDICTHQ_API_KEY;
const PHQ_BASE = "https://api.predicthq.com/v1";

export type DestEvent = {
  id:         string;
  title:      string;
  category:   string;
  start:      string;   // ISO
  end:        string;
  rank:       number;
  attendance: number | null;
  labels:     string[];
};

// Accept either ?city=Los+Angeles or ?iata=LAX (falls back to IATA→city lookup)
export async function GET(req: NextRequest) {
  if (!PHQ_KEY) return NextResponse.json({ events: [] });

  const { searchParams } = req.nextUrl;
  const city = searchParams.get("city")?.trim();
  const iata = searchParams.get("iata")?.trim()?.toUpperCase();
  const date = searchParams.get("date"); // YYYY-MM-DD

  if ((!city && !iata) || !date) return NextResponse.json({ events: [] });

  try {
    // ── Step 1: resolve city name → PredictHQ place ID ──────────────────────
    const query = city ?? iata!;

    const placesUrl = new URL(`${PHQ_BASE}/places/`);
    placesUrl.searchParams.set("q",     query);
    placesUrl.searchParams.set("type",  city ? "locality" : "airport");
    placesUrl.searchParams.set("limit", "1");

    const placesRes = await fetch(placesUrl.toString(), {
      headers: { Authorization: `Bearer ${PHQ_KEY}` },
      next:    { revalidate: 86400 },   // cache 24h — place IDs don't change
    });

    if (!placesRes.ok) return NextResponse.json({ events: [] });

    const placesJson = await placesRes.json() as {
      results?: Array<{ id: string; name: string; type: string; location?: number[] }>;
    };

    let placeId: string | null = null;
    let cityName = city ?? iata ?? "";

    if (placesJson.results?.[0]) {
      const p = placesJson.results[0];
      placeId  = p.id;
      cityName = p.name;

      // For airports: we want city-level events, so climb up to the locality
      // PredictHQ airports have a parent locality — use the airport place ID
      // directly since PHQ's place.scope works for airports too
    }

    if (!placeId) return NextResponse.json({ events: [] });

    // ── Step 2: fetch events in [date, date+7] ───────────────────────────────
    const start = date;
    const endDt = new Date(date + "T00:00:00");
    endDt.setDate(endDt.getDate() + 7);
    const end = endDt.toISOString().split("T")[0];

    const eventsUrl = new URL(`${PHQ_BASE}/events/`);
    eventsUrl.searchParams.set("place.scope",    placeId);
    eventsUrl.searchParams.set("start.gte",      start);
    eventsUrl.searchParams.set("start.lte",      end);
    eventsUrl.searchParams.set("sort",           "-rank");
    eventsUrl.searchParams.set("limit",          "8");
    eventsUrl.searchParams.set("state",          "active");

    const eventsRes = await fetch(eventsUrl.toString(), {
      headers: { Authorization: `Bearer ${PHQ_KEY}` },
      next:    { revalidate: 3600 },  // cache 1h
    });

    if (!eventsRes.ok) return NextResponse.json({ events: [] });

    const eventsJson = await eventsRes.json() as {
      results?: Array<{
        id:              string;
        title:           string;
        category:        string;
        start:           string;
        end:             string;
        rank:            number;
        phq_attendance:  number | null;
        labels:          string[];
      }>;
    };

    const events: DestEvent[] = (eventsJson.results ?? []).map(e => ({
      id:         e.id,
      title:      e.title,
      category:   e.category,
      start:      e.start,
      end:        e.end,
      rank:       e.rank,
      attendance: e.phq_attendance,
      labels:     e.labels ?? [],
    }));

    return NextResponse.json({ events, city: cityName });
  } catch {
    return NextResponse.json({ events: [] });
  }
}
