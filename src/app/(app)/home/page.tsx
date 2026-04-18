import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import AtlasHomeSuggestion from "@/components/AtlasHomeSuggestion";
import { Reveal } from "@/components/Reveal";
import { EmptyState } from "@/components/EmptyState";
import PullToRefresh from "@/components/PullToRefresh";
import EventInterestCard from "@/components/EventInterestCard";

export const dynamic = "force-dynamic";

// ── Brand tokens (mode-agnostic) ────────────────────────────────────────────
const B = {
  teal:   "#2DD4A8",
  purple: "#7C6AF5",
  amber:  "#F5A623",
  pink:   "#E8567F",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatName(fullName: string | null): { initials: string; display: string } {
  if (!fullName) return { initials: "?", display: "Unknown" };
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] ?? "";
  const last  = parts[parts.length - 1] ?? "";
  const initials = (first[0] ?? "") + (parts.length > 1 ? (last[0] ?? "") : "");
  const display  = parts.length > 1 ? `${first} ${last[0]}.` : first;
  return { initials: initials.toUpperCase(), display };
}

const AVATAR_COLORS = [
  { bg: "rgba(45,212,168,0.2)",  text: "#2DD4A8" },
  { bg: "rgba(124,106,245,0.2)", text: "#7C6AF5" },
  { bg: "rgba(245,166,35,0.2)",  text: "#F5A623" },
  { bg: "rgba(232,86,127,0.2)",  text: "#E8567F" },
  { bg: "rgba(96,165,250,0.2)",  text: "#60A5FA" },
];
function avatarColor(str: string) {
  const i = (str.charCodeAt(0) + (str.charCodeAt(str.length - 1) || 0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}

type ProfileForMatch = {
  id: string;
  role: string | null;
  company: string | null;
  interests: unknown;
};

function matchScore(viewer: ProfileForMatch, candidate: { id: string; role: string | null; company: string | null; interests: unknown }): number {
  let score = 72;
  if (viewer.company && candidate.company && viewer.company.toLowerCase() === candidate.company.toLowerCase()) score += 20;
  if (viewer.role && candidate.role) {
    const vw = viewer.role.toLowerCase().split(/\s+/);
    const cw = candidate.role.toLowerCase().split(/\s+/);
    if (vw.some(w => cw.includes(w) && w.length > 3)) score += 6;
  }
  const vi = Array.isArray(viewer.interests) ? viewer.interests as string[] : [];
  const ci = Array.isArray(candidate.interests) ? candidate.interests as string[] : [];
  score += Math.min(vi.filter(x => ci.includes(x)).length * 3, 8);
  const variation = (candidate.id.charCodeAt(0) + candidate.id.charCodeAt(candidate.id.length - 1)) % 11 - 5;
  return Math.min(97, Math.max(61, score + variation));
}

function whyMatch(viewer: { role: string | null; company: string | null }, candidate: { role: string | null; company: string | null }): string {
  const parts: string[] = [];
  if (candidate.role && viewer.role) {
    const vw = viewer.role.toLowerCase().split(/\s+/);
    const cw = candidate.role.toLowerCase().split(/\s+/);
    if (vw.some(w => cw.includes(w) && w.length > 3)) parts.push("Same industry");
  }
  if (candidate.company) parts.push(candidate.company);
  if (parts.length === 0 && candidate.role) parts.push(candidate.role);
  return parts.length > 0 ? parts.join(", ") : "Similar professional background";
}

// ── Match Ring — color matches avatar ─────────────────────────────────────────
function MatchRing({ score, color }: { score: number; color: string }) {
  if (score < 60) return null;
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  // Parse color to make a transparent track version
  const trackColor = color + "22";
  return (
    <div className="relative flex-shrink-0" style={{ width: 54, height: 54 }}>
      <svg width={54} height={54} viewBox="0 0 54 54" style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}>
        <circle cx={27} cy={27} r={r} fill="none" stroke={trackColor} strokeWidth="3" />
        <circle cx={27} cy={27} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-black" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

// ── Flight Arc ────────────────────────────────────────────────────────────────
function FlightArc({ duration }: { duration: string | null }) {
  return (
    <div className="relative flex-1 flex flex-col items-center justify-start" style={{ height: 64 }}>
      <svg width="100%" height="44" viewBox="0 0 200 44" preserveAspectRatio="none" fill="none" style={{ overflow: "visible" }}>
        <path d="M 4 40 Q 100 4 196 40" stroke="rgba(124,106,245,0.30)" strokeWidth="1.5" strokeDasharray="5 4" fill="none"/>
        <circle cx="4"   cy="40" r="3" fill="rgba(124,106,245,0.4)" />
        <circle cx="196" cy="40" r="3" fill="rgba(124,106,245,0.4)" />
      </svg>
      <div className="absolute" style={{ top: -2, left: "50%", transform: "translateX(-50%)" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
             style={{ background: "rgba(124,106,245,0.15)", border: "1px solid rgba(124,106,245,0.3)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#7C6AF5">
            <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"/>
          </svg>
        </div>
      </div>
      {duration && (
        <p className="text-[10px] font-medium mt-1" style={{ color: "var(--c-text3)" }}>{duration}</p>
      )}
    </div>
  );
}

// ── Event helpers ─────────────────────────────────────────────────────────────
type DestEvent = { id: string; title: string; category: string; start: string; rank: number; description?: string };

// Rotating palette — ensures consecutive events have distinct colors
const EVENT_PALETTE = ["#7C6AF5", "#2DD4A8", "#E8567F", "#F5A623", "#60A5FA"];
function eventColor(index: number) { return EVENT_PALETTE[index % EVENT_PALETTE.length]; }

// Build a mixed list: tech-first but ensure category diversity
const TECH_CATS = new Set(["conferences", "expos", "academic", "community"]);
function mixEvents(events: DestEvent[]): DestEvent[] {
  const tech = events.filter(e => TECH_CATS.has(e.category)).sort((a, b) => b.rank - a.rank);
  const ent  = events.filter(e => !TECH_CATS.has(e.category)).sort((a, b) => b.rank - a.rank);
  // Interleave: 2 tech, 1 entertainment, repeat — gives tech priority with variety
  const out: DestEvent[] = [];
  let ti = 0, ei = 0;
  while (out.length < 5 && (ti < tech.length || ei < ent.length)) {
    if (ti < tech.length) out.push(tech[ti++]);
    if (out.length < 5 && ti < tech.length) out.push(tech[ti++]);
    if (out.length < 5 && ei < ent.length) out.push(ent[ei++]);
  }
  return out;
}

function eventIcon(cat: string, color: string) {
  // Music / entertainment
  if (cat === "concerts" || cat === "performing-arts") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M9 18V5l12-2v13M9 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"
            stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  // Festivals — tent/flag icon
  if (cat === "festivals") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 22V2l14 5-14 5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  // Sports — ball
  if (cat === "sports") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
      <path d="M12 3c0 4.97-4.03 9-9 9M12 21c0-4.97 4.03-9 9-9M3 12h18" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
  // Conferences / expos — calendar
  if (cat === "conferences" || cat === "expos") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="1.8"/>
      <path d="M8 4V2M16 4V2M3 10h18" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
  // Academic — graduation cap
  if (cat === "academic") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 3L1 9l11 6 9-4.91V17M5 13.18v4L12 21l7-3.82v-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  // Community — people
  if (cat === "community") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.8"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
  // Default: star
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("onboarding_complete").eq("id", user.id).single();
    if (!profile?.onboarding_complete) redirect("/onboarding");
  }

  const uid = user?.id ?? "";
  const [{ data: flights }, { data: viewerProfileRow }, { data: pointsRows }] = await Promise.all([
    supabase.from("user_flights").select("flight_number, origin, destination, departure_date").eq("user_id", uid).in("status", ["upcoming", "active"]).order("departure_date", { ascending: true, nullsFirst: false }).limit(1),
    supabase.from("profiles").select("id, full_name, role, company, bio, interests").eq("id", uid).single(),
    supabase.from("points").select("amount").eq("user_id", uid),
  ]);

  const hasActiveFlight = (flights?.length ?? 0) > 0;
  const activeFlight   = flights?.[0] ?? null;
  const flightNumber   = activeFlight?.flight_number ?? null;

  let flightOrigin = activeFlight?.origin ?? null;
  let flightDest   = activeFlight?.destination ?? null;
  let flightDate   = activeFlight?.departure_date ?? null;
  let depCity: string | null = null;
  let arrCity: string | null = null;
  let depTime: string | null = null;
  let arrTime: string | null = null;
  let flightDuration: string | null = null;
  let gate: string | null = null;

  if (flightNumber) {
    try {
      const airLabsKey = process.env.AIRLABS_API_KEY;
      if (airLabsKey) {
        const fn = flightNumber.replace(/\s+/g, "");
        let airData: Record<string, unknown> | null = null;
        const liveRes = await fetch(`https://airlabs.co/api/v9/flight?api_key=${airLabsKey}&flight_iata=${fn}`, { cache: "no-store" });
        if (liveRes.ok) { const j = await liveRes.json(); if (j?.response?.dep_iata) airData = j.response; }
        if (!airData) {
          const schedRes = await fetch(`https://airlabs.co/api/v9/schedules?api_key=${airLabsKey}&flight_iata=${fn}`, { cache: "no-store" });
          if (schedRes.ok) { const j = await schedRes.json(); if (j?.response?.[0]?.dep_iata) airData = j.response[0]; }
        }
        if (airData?.dep_iata) {
          flightOrigin = airData.dep_iata as string;
          flightDest   = (airData.arr_iata as string) ?? flightDest;
          depCity      = (airData.dep_city as string) ?? null;
          arrCity      = (airData.arr_city as string) ?? null;
          depTime      = (airData.dep_time as string)?.split(" ")[1]?.slice(0,5) ?? null;
          arrTime      = (airData.arr_time as string)?.split(" ")[1]?.slice(0,5) ?? null;
          gate         = (airData.dep_gate as string) ?? null;
          const dur    = airData.duration as number | undefined;
          if (dur) flightDuration = `${Math.floor(dur/60)}h ${dur%60}m`;
          if (airData.dep_time) flightDate = (airData.dep_time as string).split(" ")[0] ?? flightDate;
          supabase.from("user_flights").update({ origin: flightOrigin, destination: flightDest, ...(airData.dep_time ? { departure_date: flightDate } : {}) }).eq("flight_number", flightNumber).eq("user_id", uid).then(() => {});
        }
      }
    } catch { /* AirLabs unavailable */ }
  }

  const totalPoints = (pointsRows ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0);
  const tierName    = totalPoints >= 5000 ? "Platinum" : totalPoints >= 1500 ? "Gold" : totalPoints >= 500 ? "Silver" : "Bronze";
  const nextTierPts = totalPoints >= 5000 ? null : totalPoints >= 1500 ? 5000 : totalPoints >= 500 ? 1500 : 500;
  const ptsToNext   = nextTierPts ? nextTierPts - totalPoints : null;
  const tierThresholds: Record<string, number> = { Bronze: 0, Silver: 500, Gold: 1500, Platinum: 5000 };
  const prevThreshold = tierThresholds[tierName] ?? 0;
  const progress = nextTierPts ? Math.min(1, (totalPoints - prevThreshold) / (nextTierPts - prevThreshold)) : 1;

  const { data: flightmates } = flightNumber
    ? await supabase.from("user_flights").select("user_id").eq("flight_number", flightNumber).neq("user_id", uid).limit(8)
    : { data: [] };

  const flightmateIds = (flightmates ?? []).map(f => f.user_id);
  const { data: flightmateProfiles } = flightmateIds.length > 0
    ? await supabase.from("profiles").select("id, full_name, avatar_url, role, company, bio, interests").in("id", flightmateIds)
    : { data: [] };

  const { data: discoverProfiles } = flightmateIds.length === 0
    ? await supabase.from("profiles").select("id, full_name, avatar_url, role, company, interests").neq("id", uid).not("role", "is", null).limit(4)
    : { data: [] };

  // ── Fetch destination events ────────────────────────────────────────────────
  let destEvents: DestEvent[] = [];
  let destCityLabel: string | null = arrCity ?? flightDest;

  if (flightDest && process.env.PREDICTHQ_API_KEY) {
    try {
      const PHQ_KEY  = process.env.PREDICTHQ_API_KEY;
      const PHQ_BASE = "https://api.predicthq.com/v1";

      // Resolve destination IATA → place ID
      let placeId: string | null = null;

      const airportUrl = new URL(`${PHQ_BASE}/places/`);
      airportUrl.searchParams.set("q", flightDest);
      airportUrl.searchParams.set("type", "airport");
      airportUrl.searchParams.set("limit", "1");
      const airportRes = await fetch(airportUrl.toString(), {
        headers: { Authorization: `Bearer ${PHQ_KEY}` },
        next: { revalidate: 86400 },
      });
      if (airportRes.ok) {
        const aj = await airportRes.json() as { results?: Array<{ id: string; name: string }> };
        placeId = aj.results?.[0]?.id ?? null;
        destCityLabel = aj.results?.[0]?.name ?? destCityLabel;
      }

      if (!placeId && arrCity) {
        const localUrl = new URL(`${PHQ_BASE}/places/`);
        localUrl.searchParams.set("q", arrCity);
        localUrl.searchParams.set("type", "locality");
        localUrl.searchParams.set("limit", "1");
        const localRes = await fetch(localUrl.toString(), {
          headers: { Authorization: `Bearer ${PHQ_KEY}` },
          next: { revalidate: 86400 },
        });
        if (localRes.ok) {
          const lj = await localRes.json() as { results?: Array<{ id: string; name: string }> };
          placeId = lj.results?.[0]?.id ?? null;
          destCityLabel = lj.results?.[0]?.name ?? destCityLabel;
        }
      }

      if (placeId) {
        const today = new Date();
        const start = today.toISOString().split("T")[0];
        const endDt = new Date(today);
        endDt.setDate(endDt.getDate() + 14);
        const end = endDt.toISOString().split("T")[0];

        // Fetch multiple category groups in parallel for diversity
        const CATS_TECH = "conferences,expos,academic,community";
        const CATS_ENT  = "concerts,festivals,performing-arts,sports";

        const fetchCat = async (cats: string) => {
          const u = new URL(`${PHQ_BASE}/events/`);
          u.searchParams.set("place.scope", placeId!);
          u.searchParams.set("category", cats);
          u.searchParams.set("start.gte", start);
          u.searchParams.set("start.lte", end);
          u.searchParams.set("sort", "-rank");
          u.searchParams.set("limit", "10");
          const r = await fetch(u.toString(), {
            headers: { Authorization: `Bearer ${PHQ_KEY}` },
            next: { revalidate: 3600 },
          });
          if (r.ok) {
            const j = await r.json() as { results?: DestEvent[] };
            return j.results ?? [];
          }
          return [];
        };

        const [techEv, entEv] = await Promise.all([fetchCat(CATS_TECH), fetchCat(CATS_ENT)]);
        destEvents = [...techEv, ...entEv];
      }
    } catch { /* events unavailable */ }
  }

  const viewerForAtlas = viewerProfileRow ?? { id: uid, full_name: user?.user_metadata?.full_name ?? null, role: null, company: null, bio: null, interests: null };
  const meta      = user?.user_metadata ?? {};
  const fullName  = meta.full_name ?? meta.name ?? "Traveler";
  const firstName = (fullName as string).split(" ")[0];
  const avatarUrl = meta.avatar_url ?? meta.picture ?? null;
  const { initials: myInitials } = formatName(fullName as string);
  const flightSlug = flightNumber ? flightNumber.replace(/\s+/g, "").toLowerCase() : null;

  let boardingLabel: string | null = null;
  if (depTime && flightDate) {
    const now = new Date();
    const dep = new Date(`${flightDate}T${depTime}:00`);
    const diffMs = dep.getTime() - now.getTime();
    if (diffMs > 0 && diffMs < 24 * 3600 * 1000) {
      const h = Math.floor(diffMs / 3600000);
      const m = Math.floor((diffMs % 3600000) / 60000);
      boardingLabel = h > 0 ? `Boarding in ${h}h ${m}m` : `Boarding in ${m}m`;
    }
  }

  const dateLabel = flightDate
    ? new Date(flightDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <PullToRefresh>
    <div className="animate-fade-in pb-[120px]">

      {/* ── Top bar ─────────────────────────────── */}
      <div className="flex items-center px-4 pb-5 gap-3"
           style={{ paddingTop: "max(20px, env(safe-area-inset-top))" }}>
        <Link href="/profile" className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 active:scale-90 transition-transform"
              style={{ background: "linear-gradient(135deg, #7C6AF5, #9B8BFF)" }}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl as string} alt={fullName as string} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-black text-base">
              {myInitials[0]}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <p className="text-[18px] font-black leading-tight" style={{ color: "var(--c-text1)" }}>Hey, {firstName}</p>
          <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: "var(--c-text2)" }}>
            {hasActiveFlight ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" style={{ boxShadow: "0 0 4px #4ade80" }} />
                {flightNumber}{flightOrigin && flightDest ? ` · ${flightOrigin} → ${flightDest}` : ""}
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--c-text3)" }} />
                No active flight
              </>
            )}
          </p>
        </div>

        <Link href="/notifications"
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform relative flex-shrink-0"
          style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="var(--c-text2)" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="var(--c-text2)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: B.pink }} />
        </Link>
      </div>

      <div className="px-4 flex flex-col gap-5">

        {/* ── Upcoming Flight Card ────────────────── */}
        <div className="stagger-1">
        {hasActiveFlight ? (
          <div className="rounded-3xl overflow-hidden" style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
            <div className="p-5">
              {/* Label + boarding badge */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text3)" }}>
                  Upcoming Flight
                </p>
                {boardingLabel && (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full"
                        style={{ background: "rgba(45,212,168,0.12)", color: B.teal, border: `1px solid rgba(45,212,168,0.25)` }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke={B.teal} strokeWidth="2"/>
                      <path d="M12 7v5l3 3" stroke={B.teal} strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {boardingLabel}
                  </span>
                )}
              </div>

              {/* Flight number + date/gate */}
              <div className="flex items-baseline justify-between mb-5">
                <p className="text-2xl font-black" style={{ color: "var(--c-text1)" }}>{flightNumber}</p>
                <p className="text-sm" style={{ color: "var(--c-text2)" }}>
                  {[dateLabel, gate && `Gate ${gate}`].filter(Boolean).join(" · ")}
                </p>
              </div>

              {/* IATA arc row */}
              <div className="flex items-end gap-3 mb-5">
                <div className="flex-shrink-0" style={{ minWidth: 72 }}>
                  <p className="text-[46px] font-black tracking-tight leading-none" style={{ color: "var(--c-text1)" }}>
                    {flightOrigin ?? "—"}
                  </p>
                  {depCity && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--c-text2)", maxWidth: 80 }}>{depCity}</p>
                  )}
                  {depTime && (
                    <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--c-text2)" }}>{depTime}</p>
                  )}
                </div>

                <FlightArc duration={flightDuration} />

                <div className="flex-shrink-0 text-right" style={{ minWidth: 72 }}>
                  <p className="text-[46px] font-black tracking-tight leading-none" style={{ color: "var(--c-text1)" }}>
                    {flightDest ?? "—"}
                  </p>
                  {arrCity && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--c-text2)", maxWidth: 80, textAlign: "right", marginLeft: "auto" }}>{arrCity}</p>
                  )}
                  {arrTime && (
                    <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--c-text2)" }}>{arrTime}</p>
                  )}
                </div>
              </div>

              {/* Divider + actions */}
              <div className="pt-4" style={{ borderTop: "1px solid var(--c-border)" }}>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: "Dashboard",
                      href: flightSlug ? `/flight/${flightSlug}` : "/flight",
                      color: B.purple,
                      icon: (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={B.purple} strokeWidth="1.8"/>
                          <rect x="14" y="3" width="7" height="7" rx="1.5" stroke={B.purple} strokeWidth="1.8"/>
                          <rect x="3" y="14" width="7" height="7" rx="1.5" stroke={B.purple} strokeWidth="1.8"/>
                          <rect x="14" y="14" width="7" height="7" rx="1.5" stroke={B.purple} strokeWidth="1.8"/>
                        </svg>
                      ),
                    },
                    {
                      label: "Seat map",
                      href: flightSlug ? `/flight/${flightSlug}/seatmap` : "/flight",
                      color: B.teal,
                      icon: (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <rect x="2" y="4" width="9" height="6" rx="1.5" stroke={B.teal} strokeWidth="1.8"/>
                          <rect x="13" y="4" width="9" height="6" rx="1.5" stroke={B.teal} strokeWidth="1.8"/>
                          <rect x="2" y="13" width="9" height="6" rx="1.5" stroke={B.teal} strokeWidth="1.8"/>
                          <rect x="13" y="13" width="9" height="6" rx="1.5" stroke={B.teal} strokeWidth="1.8"/>
                        </svg>
                      ),
                    },
                    {
                      label: "Pass",
                      href: flightSlug ? `/flight/${flightSlug}/pass` : "/flight",
                      color: B.pink,
                      icon: (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <rect x="2" y="5" width="20" height="14" rx="2" stroke={B.pink} strokeWidth="1.8"/>
                          <path d="M16 5V3M8 5V3M16 19v2M8 19v2M2 10h20" stroke={B.pink} strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                      ),
                    },
                  ].map(({ label, href, icon, color }) => (
                    <Link
                      key={label}
                      href={href}
                      className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl active:scale-95 transition-transform"
                      style={{ background: `${color}14`, color }}
                    >
                      {icon}
                      <span className="text-[10px] font-semibold">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl overflow-hidden" style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
            <EmptyState
              icon="✈️"
              title="No active flight"
              body="Add your flight to discover professionals onboard and start networking at 35,000 ft."
              action={{ label: "Add a Flight", href: "/flight" }}
              className="py-10"
            />
          </div>
        )}
        </div>

        {/* ── Atlas AI insight ────────────────────── */}
        <div className="stagger-2">
          <AtlasHomeSuggestion viewerProfile={viewerForAtlas} candidates={flightmateProfiles ?? []} />
        </div>

        {/* ── People on your flight ──────────────── */}
        {(flightmateProfiles ?? []).length > 0 && (
          <Reveal delay={40}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black" style={{ color: "var(--c-text1)" }}>People on your flight</h3>
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(124,106,245,0.15)", color: B.purple }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: B.purple }} />
                    AI matched
                  </span>
                </div>
                <Link href="/network"
                  className="text-xs font-semibold px-3 py-1.5 rounded-full active:opacity-70"
                  style={{ border: `1px solid var(--c-border)`, color: "var(--c-text1)" }}>
                  See all
                </Link>
              </div>

              <div className="flex flex-col gap-3">
                {(flightmateProfiles ?? []).slice(0, 4).map((p) => {
                  const { initials, display } = formatName(p.full_name ?? null);
                  const pct = matchScore(viewerForAtlas, p);
                  if (pct < 60) return null;
                  const why = whyMatch(viewerForAtlas, p);
                  const ac  = avatarColor(p.full_name ?? p.id);
                  return (
                    <Link key={p.id} href={`/profile/${p.id}`}
                      className="block rounded-2xl p-4 active:opacity-80 transition-opacity"
                      style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                             style={{ background: ac.bg, color: ac.text }}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold" style={{ color: "var(--c-text1)" }}>{display}</p>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path d="M9 12L11 14L15 10M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke={B.teal} strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--c-text2)" }}>
                            {[p.role, p.company].filter(Boolean).join(", ")}
                          </p>
                        </div>
                        <MatchRing score={pct} color={ac.text} />
                      </div>
                      <p className="text-xs mt-2.5 leading-relaxed" style={{ color: "var(--c-text3)" }}>
                        <span className="font-semibold" style={{ color: "var(--c-text2)" }}>Why: </span>{why}
                      </p>
                    </Link>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 mt-3 px-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z" stroke="var(--c-text3)" strokeWidth="2" strokeLinejoin="round"/>
                </svg>
                <p className="text-[10px]" style={{ color: "var(--c-text3)" }}>
                  Only opt-in passengers shown.{" "}
                  <Link href="/profile#privacy" className="underline" style={{ color: B.teal }}>Privacy settings</Link>
                </p>
              </div>
            </div>
          </Reveal>
        )}

        {/* ── Discover Professionals ─────────────── */}
        {(discoverProfiles ?? []).length > 0 && (flightmateProfiles ?? []).length === 0 && (
          <Reveal delay={50}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black" style={{ color: "var(--c-text1)" }}>People you might know</h3>
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(124,106,245,0.15)", color: B.purple }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: B.purple }} />
                    AI matched
                  </span>
                </div>
                <Link href="/network"
                  className="text-xs font-semibold px-3 py-1.5 rounded-full active:opacity-70"
                  style={{ border: `1px solid var(--c-border)`, color: "var(--c-text1)" }}>
                  See all
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                {(discoverProfiles ?? []).map((p) => {
                  const { initials, display } = formatName(p.full_name ?? null);
                  const pct = matchScore(viewerForAtlas, p);
                  const why = whyMatch(viewerForAtlas, p);
                  const ac  = avatarColor(p.full_name ?? p.id);
                  return (
                    <Link key={p.id} href={`/profile/${p.id}`}
                      className="block rounded-2xl p-4 active:opacity-80 transition-opacity"
                      style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                             style={{ background: ac.bg, color: ac.text }}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold" style={{ color: "var(--c-text1)" }}>{display}</p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--c-text2)" }}>
                            {[p.role, p.company].filter(Boolean).join(", ")}
                          </p>
                        </div>
                        <MatchRing score={pct} color={ac.text} />
                      </div>
                      {pct >= 60 && (
                        <p className="text-xs mt-2.5 leading-relaxed" style={{ color: "var(--c-text3)" }}>
                          <span className="font-semibold" style={{ color: "var(--c-text2)" }}>Why: </span>{why}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-3 px-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z" stroke="var(--c-text3)" strokeWidth="2" strokeLinejoin="round"/>
                </svg>
                <p className="text-[10px]" style={{ color: "var(--c-text3)" }}>
                  Only opted-in members are shown.{" "}
                  <Link href="/profile#privacy" className="underline" style={{ color: B.teal }}>Privacy settings</Link>
                </p>
              </div>
            </div>
          </Reveal>
        )}

        {/* ── SkyPoints ──────────────────────────── */}
        <Reveal delay={55} variant="scale">
          <Link href="/rewards" className="block active:scale-[0.98] transition-transform">
            <div className="rounded-2xl p-4" style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--c-text3)" }}>SkyPoints</p>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black" style={{ color: "var(--c-text1)" }}>{totalPoints.toLocaleString()}</p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(245,166,35,0.18)", color: B.amber }}>{tierName}</span>
                </div>
                <div className="text-right">
                  {ptsToNext && (
                    <p className="text-sm font-semibold" style={{ color: "var(--c-text1)" }}>
                      {ptsToNext.toLocaleString()} to {tierName === "Bronze" ? "Silver" : tierName === "Silver" ? "Gold" : "Platinum"}
                    </p>
                  )}
                  <p className="text-[11px] mt-0.5" style={{ color: B.teal }}>+50 this flight</p>
                </div>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: 5, background: "var(--c-muted)" }}>
                <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, background: B.amber }} />
              </div>
            </div>
          </Link>
        </Reveal>

        {/* ── Events at destination ────────────────── */}
        {destEvents.length > 0 && (() => {
          const mixed = mixEvents(destEvents);
          return (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-black" style={{ color: "var(--c-text1)" }}>
                  Events at {destCityLabel ?? flightDest}
                </h3>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(124,106,245,0.12)", color: B.purple }}>
                  Next 14 days
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {mixed.map((ev, i) => {
                  const col = eventColor(i);
                  return (
                    <EventInterestCard
                      key={ev.id}
                      id={ev.id}
                      title={ev.title}
                      category={ev.category}
                      start={ev.start}
                      color={col}
                      icon={eventIcon(ev.category, col)}
                      description={ev.description}
                    />
                  );
                })}
              </div>
            </div>
          );
        })()}

      </div>
    </div>
    </PullToRefresh>
  );
}
