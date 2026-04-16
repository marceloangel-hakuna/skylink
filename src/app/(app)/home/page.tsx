import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import AtlasHomeSuggestion from "@/components/AtlasHomeSuggestion";
import { Reveal } from "@/components/Reveal";
import { EmptyState } from "@/components/EmptyState";
import PullToRefresh from "@/components/PullToRefresh";
import PeopleNearYou from "@/components/PeopleNearYou";
import { CREW_MINI_THEMES, resolveCrewThemeKey } from "@/app/(app)/crews/crewMiniThemes";
import { avatarColor, initials as getInitials } from "@/lib/utils/avatarColor";

export const dynamic = "force-dynamic";

// ── Helpers ──────────────────────────────────────────────────────────────────

type ProfileForAtlas = {
  id: string;
  full_name: string | null;
  role: string | null;
  company: string | null;
  bio: string | null;
  interests: unknown;
};

function matchScore(viewer: ProfileForAtlas, candidate: { id: string; full_name: string | null; role: string | null; company: string | null; bio: string | null; interests: unknown }): number {
  let score = 72;
  if (viewer.company && candidate.company &&
      viewer.company.toLowerCase() === candidate.company.toLowerCase()) score += 20;
  if (viewer.role && candidate.role) {
    const vWords = viewer.role.toLowerCase().split(/\s+/);
    const cWords = candidate.role.toLowerCase().split(/\s+/);
    if (vWords.some(w => cWords.includes(w) && w.length > 3)) score += 6;
  }
  const vInt = Array.isArray(viewer.interests) ? viewer.interests as string[] : [];
  const cInt = Array.isArray(candidate.interests) ? candidate.interests as string[] : [];
  const overlap = vInt.filter(i => cInt.includes(i)).length;
  score += Math.min(overlap * 3, 8);
  const variation = (candidate.id.charCodeAt(0) + candidate.id.charCodeAt(candidate.id.length - 1)) % 11 - 5;
  return Math.min(98, Math.max(65, score + variation));
}

function whyMatch(candidate: { role: string | null; company: string | null }): string {
  const parts = [candidate.role, candidate.company].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Similar background";
}

// ── Circular Match Ring ───────────────────────────────────────────────────────

function MatchRing({ pct }: { pct: number }) {
  const r = 25;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={58} height={58} viewBox="0 0 58 58" className="absolute inset-0"
         style={{ transform: "rotate(-90deg)" }}>
      <circle cx="29" cy="29" r={r} fill="none" stroke="rgba(74,39,232,0.12)" strokeWidth="3.5" />
      <circle cx="29" cy="29" r={r} fill="none" stroke="#4CAF79" strokeWidth="3.5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

// ── Tier Progress Bar ─────────────────────────────────────────────────────────

function TierProgressBar({ totalPoints, tierName, nextTierPts, ptsToNext }: {
  totalPoints: number;
  tierName: string;
  nextTierPts: number | null;
  ptsToNext: number | null;
}) {
  const tierThresholds = [0, 500, 1500, 5000];
  const tierNames = ["Bronze", "Silver", "Gold", "Platinum"];
  const currentTierIdx = tierNames.indexOf(tierName);
  const prevThreshold = tierThresholds[currentTierIdx] ?? 0;
  const nextThreshold = nextTierPts ?? totalPoints;
  const rangeSize = nextThreshold - prevThreshold;
  const progress = rangeSize > 0 ? Math.min(1, (totalPoints - prevThreshold) / rangeSize) : 1;

  return (
    <Link href="/rewards" className="block active:scale-[0.98] transition-transform">
      <div className="rounded-2xl p-4" style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(234,179,8,0.12)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="#EAB308" strokeWidth="0"/>
              </svg>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--c-text3)" }}>SkyPoints</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(234,179,8,0.12)", color: "#B45309" }}>
            {tierName}
          </span>
        </div>

        <p className="text-2xl font-black leading-none mb-3" style={{ color: "var(--c-text1)" }}>
          {totalPoints.toLocaleString()}
          <span className="text-sm font-semibold ml-1" style={{ color: "var(--c-text3)" }}>pts</span>
        </p>

        {/* Progress bar */}
        <div className="rounded-full overflow-hidden mb-1.5" style={{ height: 6, background: "var(--c-muted)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progress * 100}%`, background: "linear-gradient(90deg, #EAB308, #F59E0B)" }} />
        </div>

        {ptsToNext ? (
          <p className="text-[10px]" style={{ color: "var(--c-text3)" }}>
            <span className="font-semibold" style={{ color: "var(--c-text2)" }}>{ptsToNext.toLocaleString()} pts</span> to {tierNames[(currentTierIdx + 1)] ?? "max"}
          </p>
        ) : (
          <p className="text-[10px] font-semibold" style={{ color: "#EAB308" }}>Platinum — top tier! ✦</p>
        )}
      </div>
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", user.id)
      .single();
    if (!profile?.onboarding_complete) redirect("/onboarding");
  }

  const uid = user?.id ?? "";
  const [{ data: flights }, { data: viewerProfileRow }, { data: pointsRows }] = await Promise.all([
    supabase.from("user_flights").select("flight_number, origin, destination, departure_date").eq("user_id", uid).in("status", ["upcoming", "active"]).order("departure_date", { ascending: true, nullsFirst: false }).limit(1),
    supabase.from("profiles").select("id, full_name, role, company, bio, interests").eq("id", uid).single(),
    supabase.from("points").select("amount").eq("user_id", uid),
  ]);

  // Fetch featured crews with member counts
  const { data: featuredCrews } = await supabase
    .from("crews")
    .select("id, name, icon, header_style")
    .limit(4);

  const { data: crewMemberships } = (featuredCrews ?? []).length > 0
    ? await supabase.from("crew_members").select("crew_id, user_id").in("crew_id", (featuredCrews ?? []).map(c => c.id))
    : { data: [] };

  const memberCountMap: Record<string, number> = {};
  const joinedCrewIds = new Set<string>();
  for (const m of crewMemberships ?? []) {
    memberCountMap[m.crew_id] = (memberCountMap[m.crew_id] ?? 0) + 1;
    if (m.user_id === uid) joinedCrewIds.add(m.crew_id);
  }

  const featuredCrewsWithMeta = (featuredCrews ?? []).map(c => ({
    ...c,
    member_count: memberCountMap[c.id] ?? 0,
    is_member: joinedCrewIds.has(c.id),
  }));

  const hasActiveFlight = (flights?.length ?? 0) > 0;
  const activeFlight   = flights?.[0] ?? null;
  const flightNumber   = activeFlight?.flight_number ?? null;

  // Enrich with live AirLabs data
  let flightOrigin = activeFlight?.origin ?? null;
  let flightDest   = activeFlight?.destination ?? null;
  let flightDate   = activeFlight?.departure_date ?? null;

  if (flightNumber) {
    try {
      const airLabsKey = process.env.AIRLABS_API_KEY;
      if (airLabsKey) {
        const fn = flightNumber.replace(/\s+/g, "");
        let airData: { dep_iata?: string; arr_iata?: string; dep_time?: string } | null = null;

        const liveRes = await fetch(
          `https://airlabs.co/api/v9/flight?api_key=${airLabsKey}&flight_iata=${fn}`,
          { cache: "no-store" },
        );
        if (liveRes.ok) {
          const liveJson = await liveRes.json();
          if (liveJson?.response?.dep_iata) airData = liveJson.response;
        }
        if (!airData) {
          const schedRes = await fetch(
            `https://airlabs.co/api/v9/schedules?api_key=${airLabsKey}&flight_iata=${fn}`,
            { cache: "no-store" },
          );
          if (schedRes.ok) {
            const schedJson = await schedRes.json();
            if (schedJson?.response?.[0]?.dep_iata) airData = schedJson.response[0];
          }
        }

        if (airData?.dep_iata) {
          flightOrigin = airData.dep_iata;
          flightDest   = airData.arr_iata ?? flightDest;
          if (airData.dep_time) flightDate = airData.dep_time.split(" ")[0] ?? flightDate;

          supabase
            .from("user_flights")
            .update({ origin: flightOrigin, destination: flightDest, ...(airData.dep_time ? { departure_date: flightDate } : {}) })
            .eq("flight_number", flightNumber)
            .eq("user_id", uid)
            .then(() => {});
        }
      }
    } catch {
      // AirLabs unavailable — fall back to stored values
    }
  }

  const totalPoints = (pointsRows ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0);
  const tierName    = totalPoints >= 5000 ? "Platinum" : totalPoints >= 1500 ? "Gold" : totalPoints >= 500 ? "Silver" : "Bronze";
  const nextTierPts = totalPoints >= 5000 ? null : totalPoints >= 1500 ? 5000 : totalPoints >= 500 ? 1500 : 500;
  const ptsToNext   = nextTierPts ? nextTierPts - totalPoints : null;

  // Flightmates for Atlas matching
  const { data: flightmates } = flightNumber
    ? await supabase
        .from("user_flights")
        .select("user_id")
        .eq("flight_number", flightNumber)
        .neq("user_id", uid)
        .limit(5)
    : { data: [] };

  const flightmateIds = (flightmates ?? []).map(f => f.user_id);
  const { data: flightmateProfiles } = flightmateIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, company, bio, interests")
        .in("id", flightmateIds)
    : { data: [] };

  const viewerForAtlas = viewerProfileRow ?? {
    id: uid,
    full_name: user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null,
    role: null, company: null, bio: null, interests: null,
  };

  const meta      = user?.user_metadata ?? {};
  const fullName  = meta.full_name ?? meta.name ?? "Traveler";
  const firstName = fullName.split(" ")[0];
  const avatarUrl = meta.avatar_url ?? meta.picture ?? null;

  const flightSlug = flightNumber ? flightNumber.replace(/\s+/g, "").toLowerCase() : null;

  return (
    <PullToRefresh>
    <div className="animate-fade-in pb-[110px]">

      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="flex items-center px-4 pb-3 gap-3"
           style={{ paddingTop: "max(20px, env(safe-area-inset-top))" }}>
        <Link href="/profile" className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white dark:ring-white/20 shadow-sm active:scale-90 transition-transform">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-brand flex items-center justify-center text-white font-bold text-base">
              {firstName[0]}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-bold text-zinc-900 dark:text-[var(--c-text1)] leading-tight">Hey, {firstName} 👋</p>
          <p className="text-xs text-zinc-500 dark:text-[var(--c-text2)] mt-0.5 flex items-center gap-1.5">
            {hasActiveFlight ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 animate-pulse" />
                {flightNumber ?? ""}{flightOrigin && flightDest ? ` · ${flightOrigin} → ${flightDest}` : ""}
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 flex-shrink-0" />
                No active flight
              </>
            )}
          </p>
        </div>

        {/* Notification + Search icons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/notifications"
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: "var(--c-muted)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="var(--c-text2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="var(--c-text2)" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </Link>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-5">

        {/* ── Flight Card ───────────────────────────────── */}
        <div className="stagger-1">
        {hasActiveFlight ? (
          <div className="rounded-3xl overflow-hidden relative"
               style={{ background: "linear-gradient(135deg, #3418C8 0%, #4A27E8 60%, #6B4AF0 100%)" }}>
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -bottom-12 -left-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative p-5">
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">Upcoming Flight</p>
                  <p className="text-lg font-black mt-0.5 text-white">{flightNumber}</p>
                </div>
                {flightDate && (
                  <span className="bg-white/15 text-white text-[11px] font-semibold px-3 py-1 rounded-full">
                    {new Date(flightDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>

              {/* Route */}
              <div className="flex items-end justify-between mb-1">
                <div>
                  <p className="text-4xl font-black tracking-tight text-white">{flightOrigin ?? "—"}</p>
                  <p className="text-white/60 text-xs mt-0.5">Origin</p>
                </div>
                <div className="flex-1 mx-3 mb-3">
                  <svg viewBox="0 0 160 50" fill="none" className="w-full">
                    <path d="M8 42 Q80 4 152 42" stroke="white" strokeOpacity="0.25"
                          strokeWidth="1.5" fill="none" strokeDasharray="4 3"/>
                    <path d="M8 42 Q80 16 152 42" stroke="white" strokeWidth="2"
                          fill="none" strokeLinecap="round"/>
                    <g transform="translate(80,20)">
                      <path d="M-7 0 L3 -3 L5 0 L3 3 Z M-7 -1 L-3 -5 L-2 -1 Z M-7 1 L-3 5 L-2 1 Z" fill="white"/>
                    </g>
                    <circle cx="8"   cy="42" r="3" fill="white" fillOpacity="0.8"/>
                    <circle cx="152" cy="42" r="3" fill="white" fillOpacity="0.4"/>
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black tracking-tight text-white">{flightDest ?? "—"}</p>
                  <p className="text-white/60 text-xs mt-0.5">Destination</p>
                </div>
              </div>

              {/* Quick action buttons */}
              <div className="flex gap-2 mt-4">
                <Link href={flightSlug ? `/flight/${flightSlug}` : "/flight"}
                  className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl active:scale-[0.97] transition-transform"
                  style={{ background: "rgba(255,255,255,0.15)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="white" strokeWidth="2"/>
                    <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="white" strokeWidth="2"/>
                    <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="white" strokeWidth="2"/>
                    <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="white" strokeWidth="2"/>
                  </svg>
                  <span className="text-[10px] font-semibold text-white/90">Dashboard</span>
                </Link>
                <Link href={flightSlug ? `/flight/${flightSlug}?tab=people` : "/flight"}
                  className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl active:scale-[0.97] transition-transform"
                  style={{ background: "rgba(255,255,255,0.15)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="9" cy="7" r="4" stroke="white" strokeWidth="2"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[10px] font-semibold text-white/90">People</span>
                </Link>
                <button
                  className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl active:scale-[0.97] transition-transform"
                  style={{ background: "rgba(255,255,255,0.15)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="5" width="20" height="14" rx="2" stroke="white" strokeWidth="2"/>
                    <path d="M16 5V3M8 5V3M16 19v2M8 19v2M2 10h20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[10px] font-semibold text-white/90">Pass</span>
                </button>
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

        {/* ── Atlas AI Card ─────────────────────────────── */}
        <div className="stagger-2">
        <AtlasHomeSuggestion
          viewerProfile={viewerForAtlas}
          candidates={flightmateProfiles ?? []}
        />
        </div>

        {/* ── People on Your Flight · AI Matched ────────── */}
        {(flightmateProfiles ?? []).length > 0 && (
        <Reveal delay={40}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="section-title leading-none">People on your flight</h3>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--c-text3)" }}>AI matched · {(flightmateProfiles ?? []).length} found</p>
            </div>
            <Link href="/network" className="text-xs text-brand font-semibold">See all</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {(flightmateProfiles ?? []).map((p) => {
              const name = p.full_name ?? "Traveler";
              const initials = getInitials(name);
              const color = avatarColor(name);
              const pct = matchScore(viewerForAtlas, p);
              const why = whyMatch(p);
              return (
                <Link key={p.id} href={`/profile/${p.id}`}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[76px] active:opacity-70 transition-opacity">
                  {/* Avatar with match ring */}
                  <div className="relative w-[58px] h-[58px]">
                    <MatchRing pct={pct} />
                    <div className="absolute inset-[5px] rounded-full overflow-hidden">
                      {p.avatar_url
                        ? <img src={p.avatar_url} alt={name} className="w-full h-full object-cover rounded-full" />
                        : <div className={`w-full h-full rounded-full ${color} flex items-center justify-center text-xs font-black`}>{initials}</div>}
                    </div>
                    {/* Match % badge */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-black px-1.5 rounded-full text-white"
                         style={{ background: "#4CAF79", whiteSpace: "nowrap" }}>
                      {pct}%
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-center leading-tight mt-1.5" style={{ color: "var(--c-text1)" }}>
                    {name.split(" ")[0]}
                  </p>
                  <p className="text-[9px] text-center leading-tight truncate w-full px-1" style={{ color: "var(--c-text3)" }}>{why}</p>
                </Link>
              );
            })}
          </div>

          {/* Privacy notice */}
          <div className="flex items-center gap-1.5 mt-3 px-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z" stroke="var(--c-text3)" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
            <p className="text-[10px]" style={{ color: "var(--c-text3)" }}>Visible only to SkyLink members on your flight</p>
          </div>
        </Reveal>
        )}

        {/* ── People Near You ───────────────────────────── */}
        <div className="stagger-3 -mx-4">
          <PeopleNearYou />
        </div>

        {/* ── SkyPoints ─────────────────────────────────── */}
        <Reveal delay={60} variant="scale">
          <TierProgressBar
            totalPoints={totalPoints}
            tierName={tierName}
            nextTierPts={nextTierPts}
            ptsToNext={ptsToNext}
          />
        </Reveal>

        {/* ── Sky Crews ─────────────────────────────────── */}
        <Reveal delay={80}>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">Sky Crews</h3>
            <Link href="/crews" className="text-xs text-brand font-semibold">Browse</Link>
          </div>
          {featuredCrewsWithMeta.length === 0 ? (
            <EmptyState
              icon="🚀"
              title="No crews yet"
              body="Join a crew built around your interests, or create one for your community."
              action={{ label: "Browse Crews", href: "/crews" }}
              className="py-8"
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {featuredCrewsWithMeta.map((crew, i) => {
                const mini = CREW_MINI_THEMES[resolveCrewThemeKey(crew.id, crew.header_style)] ?? CREW_MINI_THEMES.city;
                return (
                <Reveal key={crew.id} delay={i * 60}>
                <Link href={`/crews/${crew.id}`}
                  className="rounded-2xl overflow-hidden active:scale-[0.97] transition-transform"
                  style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
                  {/* Themed thumbnail */}
                  <div className="relative h-20 overflow-hidden"
                       style={{ background: mini.bg }}>
                    <div className="absolute inset-0 opacity-90">
                      {mini.mini}
                    </div>
                    {crew.is_member && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold text-emerald-600 border border-emerald-200 bg-emerald-50 rounded-full px-2 py-0.5 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-900/60">
                        Joined
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-bold leading-tight" style={{ color: "var(--c-text1)" }}>{crew.name}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--c-text3)" }}>{crew.member_count} member{crew.member_count !== 1 ? "s" : ""}</p>
                  </div>
                </Link>
                </Reveal>
                );
              })}
            </div>
          )}
        </div>
        </Reveal>

      </div>
    </div>
    </PullToRefresh>
  );
}
