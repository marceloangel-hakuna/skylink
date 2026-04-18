import { NextRequest, NextResponse } from "next/server";

const PHQ_KEY  = process.env.PREDICTHQ_API_KEY;
const PHQ_BASE = "https://api.predicthq.com/v1";

export type DestEvent = {
  id:          string;
  title:       string;
  category:    string;
  start:       string;   // ISO
  end:         string;
  rank:        number;
  attendance:  number | null;
  labels:      string[];
  description?: string;
};

async function lookupPlaceId(query: string, type: string): Promise<{ id: string; name: string } | null> {
  const url = new URL(`${PHQ_BASE}/places/`);
  url.searchParams.set("q",     query);
  url.searchParams.set("type",  type);
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${PHQ_KEY}` },
    next:    { revalidate: 86400 },
  });
  if (!res.ok) return null;
  const json = await res.json() as { results?: Array<{ id: string; name: string }> };
  if (!json.results?.[0]) return null;
  return json.results[0];
}

// Accept either ?city=Los+Angeles or ?iata=LAX
export async function GET(req: NextRequest) {
  if (!PHQ_KEY) return NextResponse.json({ events: [] });

  const { searchParams } = req.nextUrl;
  const city = searchParams.get("city")?.trim();
  const iata = searchParams.get("iata")?.trim()?.toUpperCase();
  let date = searchParams.get("date"); // YYYY-MM-DD

  if ((!city && !iata) || !date) return NextResponse.json({ events: [] });

  // If the date is in the past (> 1 day ago), use today so test flights still surface events
  try {
    const stored = new Date(date + "T00:00:00");
    const today  = new Date();
    today.setHours(0, 0, 0, 0);
    const oneDayAgo = new Date(today);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    if (stored < oneDayAgo) {
      date = today.toISOString().split("T")[0];
    }
  } catch { /* use original date */ }

  try {
    // Step 1: resolve city/IATA → PredictHQ place ID
    let place: { id: string; name: string } | null = null;

    if (city) {
      // Try locality first (most reliable)
      place = await lookupPlaceId(city, "locality");
    }

    if (!place && iata) {
      // Try airport type
      place = await lookupPlaceId(iata, "airport");
    }

    if (!place && iata) {
      // Fallback: try the IATA code as a locality name
      place = await lookupPlaceId(iata, "locality");
    }

    if (!place) return NextResponse.json({ events: [] });

    // Step 2: fetch events in [date, date+14]
    const start = date!;
    const endDt = new Date(date! + "T00:00:00");
    endDt.setDate(endDt.getDate() + 14);
    const end = endDt.toISOString().split("T")[0];

    const eventsUrl = new URL(`${PHQ_BASE}/events/`);
    eventsUrl.searchParams.set("place.scope", place.id);
    eventsUrl.searchParams.set("start.gte",   start);
    eventsUrl.searchParams.set("start.lte",   end);
    eventsUrl.searchParams.set("sort",        "-rank");
    eventsUrl.searchParams.set("limit",       "10");
    // Removed state=active filter — gets all confirmed future events

    const eventsRes = await fetch(eventsUrl.toString(), {
      headers: { Authorization: `Bearer ${PHQ_KEY}` },
      next:    { revalidate: 3600 },
    });

    if (!eventsRes.ok) return NextResponse.json({ events: [] });

    const eventsJson = await eventsRes.json() as {
      results?: Array<{
        id:             string;
        title:          string;
        category:       string;
        start:          string;
        end:            string;
        rank:           number;
        phq_attendance: number | null;
        labels:         string[];
        description?:   string;
      }>;
    };

    const events: DestEvent[] = (eventsJson.results ?? []).map(e => ({
      id:          e.id,
      title:       e.title,
      category:    e.category,
      start:       e.start,
      end:         e.end,
      rank:        e.rank,
      attendance:  e.phq_attendance,
      description: e.description,
      labels:     e.labels ?? [],
    }));

    return NextResponse.json({ events, city: place.name });
  } catch {
    return NextResponse.json({ events: [] });
  }
}
