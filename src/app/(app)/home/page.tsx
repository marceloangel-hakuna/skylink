import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import AtlasHomeSuggestion from "@/components/AtlasHomeSuggestion";
import { Reveal } from "@/components/Reveal";
import { EmptyState } from "@/components/EmptyState";
import PullToRefresh from "@/components/PullToRefresh";

export const dynamic = "force-dynamic";

// Matches crew theme backgrounds in crews/[id]/page.tsx
const CREW_ICON_BG: Record<string, string> = {
  "11111111-0000-0000-0000-000000000001": "#FFEDD5", // SFO↔NYC — amber
  "11111111-0000-0000-0000-000000000002": "#DBEAFE", // AI Founders — blue
  "11111111-0000-0000-0000-000000000003": "#D1FAE5", // LatAm Tech — emerald
  "11111111-0000-0000-0000-000000000004": "#FEF9C3", // Silicon Valley — golden
};

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
];

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
  const [{ data: flights }, { count: unreadCount }, { data: viewerProfileRow }, { data: pointsRows }] = await Promise.all([
    supabase.from("user_flights").select("flight_number, origin, destination, departure_date").eq("user_id", uid).in("status", ["upcoming", "active"]).order("departure_date", { ascending: true, nullsFirst: false }).limit(1),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("receiver_id", uid).is("read_at", null),
    supabase.from("profiles").select("id, full_name, role, company, bio, interests").eq("id", uid).single(),
    supabase.from("points").select("amount").eq("user_id", uid),
  ]);

  // Fetch featured crews with member counts
  const { data: featuredCrews } = await supabase
    .from("crews")
    .select("id, name, icon")
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

  // Enrich with live AirLabs data so we always show real origin/destination
  let flightOrigin = activeFlight?.origin ?? null;
  let flightDest   = activeFlight?.destination ?? null;
  let flightDate   = activeFlight?.departure_date ?? null;

  if (flightNumber) {
    try {
      const airLabsKey = process.env.AIRLABS_API_KEY;
      if (airLabsKey) {
        const fn = flightNumber.replace(/\s+/g, "");
        let airData: { dep_iata?: string; arr_iata?: string; dep_time?: string } | null = null;

        // Try real-time first, then schedules
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

          // Silently update the DB record so the flight list also shows correct data
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

  // Find other users on the same flight for Atlas matching
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

  return (
    <PullToRefresh>
    <div className="animate-fade-in pb-[80px]">

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

        <div className="flex items-center gap-2">
          <Link href="/chat"
            className="relative w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
            style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
                stroke="#4A27E8" strokeWidth="1.8" strokeLinejoin="round"/>
            </svg>
            {(unreadCount ?? 0) > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-sm">
                {(unreadCount ?? 0) > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-5">

        {/* ── Flight Card ───────────────────────────────── */}
        <div className="stagger-1">
        {hasActiveFlight ? (
          <Link href={`/flight/${(flightNumber ?? "").toLowerCase().replace(/\s+/g, "-")}`} className="block active:scale-[0.98] transition-transform">
            <div className="rounded-3xl p-5 text-white overflow-hidden relative"
                 style={{ background: "linear-gradient(135deg, #3418C8 0%, #4A27E8 60%, #6B4AF0 100%)" }}>
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
              <div className="absolute -bottom-12 -left-6 w-32 h-32 rounded-full bg-white/5" />

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">Upcoming Flight</p>
                    <p className="text-lg font-black mt-0.5">{flightNumber}</p>
                  </div>
                  {flightDate && (
                    <span className="bg-white/15 text-white text-[11px] font-semibold px-3 py-1 rounded-full">
                      {new Date(flightDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>

                <div className="flex items-end justify-between mb-1">
                  <div>
                    <p className="text-4xl font-black tracking-tight">{flightOrigin ?? "—"}</p>
                    <p className="text-white/60 text-xs mt-0.5">Origin</p>
                  </div>
                  <div className="flex-1 mx-3 mb-3">
                    <svg viewBox="0 0 160 50" fill="none" className="w-full">
                      <path d="M8 42 Q80 4 152 42" stroke="white" strokeOpacity="0.25"
                            strokeWidth="1.5" fill="none" strokeDasharray="4 3"/>
                      <path d="M8 42 Q80 16 152 42" stroke="white" strokeWidth="2"
                            fill="none" strokeLinecap="round" strokeDasharray="0"/>
                      <g transform="translate(80,20)">
                        <path d="M-7 0 L3 -3 L5 0 L3 3 Z
                                 M-7 -1 L-3 -5 L-2 -1 Z
                                 M-7  1 L-3  5 L-2  1 Z" fill="white"/>
                      </g>
                      <circle cx="8"   cy="42" r="3" fill="white" fillOpacity="0.6"/>
                      <circle cx="152" cy="42" r="3" fill="white" fillOpacity="0.3"/>
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-black tracking-tight">{flightDest ?? "—"}</p>
                    <p className="text-white/60 text-xs mt-0.5">Destination</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/15 mt-1">
                  <p className="text-white/60 text-xs">Tap to see who&apos;s onboard</p>
                  <span className="bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1">
                    Flight Dashboard
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </Link>
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

        {/* ── People on Your Flight ─────────────────────── */}
        {(flightmateProfiles ?? []).length > 0 && (
        <Reveal delay={40}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">People on Your Flight</h3>
            <Link href="/network" className="text-xs text-brand font-semibold">See all</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {(flightmateProfiles ?? []).map((p, i) => {
              const name = p.full_name ?? "Traveler";
              const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <Link key={p.id} href={`/profile/${p.id}`}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[72px] active:opacity-70 transition-opacity">
                  <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-sm font-black shadow-sm`}>
                    {p.avatar_url
                      ? <img src={p.avatar_url} alt={name} className="w-full h-full rounded-2xl object-cover" />
                      : initials}
                  </div>
                  <p className="text-[11px] font-semibold text-zinc-800 dark:text-[var(--c-text1)] text-center leading-tight">
                    {name.split(" ")[0]}
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-[var(--c-text2)] text-center leading-tight">{p.role ?? ""}</p>
                </Link>
              );
            })}
          </div>
        </Reveal>
        )}

        {/* ── SkyPoints ─────────────────────────────────── */}
        <Reveal delay={60} variant="scale">
        <Link href="/rewards" className="block active:scale-[0.98] transition-transform">
          <div className="rounded-2xl p-4 flex items-center gap-4 skypoints-mini-card"
               style={{ background: "linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)", border: "1px solid #FBCFE8" }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: "#FCE7F3" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="#F73D8A" stroke="#F73D8A" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide dark:text-pink-400" style={{ color: "#DB2777" }}>SkyPoints</p>
              <p className="text-2xl font-black leading-none dark:text-pink-300" style={{ color: "#9D174D" }}>{totalPoints.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full dark:bg-pink-900/40 dark:text-pink-300" style={{ background: "#FCE7F3", color: "#BE185D" }}>{tierName}</span>
              {ptsToNext && (
                <p className="text-[10px] mt-1 dark:text-pink-400" style={{ color: "#DB2777" }}>{ptsToNext.toLocaleString()} to next tier</p>
              )}
            </div>
          </div>
        </Link>
        </Reveal>

        {/* ── Sky Crews ─────────────────────────────────── */}
        <Reveal delay={80}>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">Sky Crews</h3>
            <Link href="/crews" className="text-xs text-brand font-semibold">Browse all</Link>
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
            <div className="flex flex-col gap-3">
              {featuredCrewsWithMeta.map((crew, i) => (
                <Reveal key={crew.id} delay={i * 60}>
                <Link href={`/crews/${crew.id}`}
                  className="card flex items-center gap-3 active:scale-[0.98] transition-transform">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 crew-icon-bg"
                       style={{ background: CREW_ICON_BG[crew.id] ?? "#EDE9FE" }}>
                    {crew.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-800 dark:text-[var(--c-text1)]">{crew.name}</p>
                    <p className="text-xs text-zinc-400 dark:text-[var(--c-text2)]">{crew.member_count} member{crew.member_count !== 1 ? "s" : ""}</p>
                  </div>
                  {crew.is_member ? (
                    <span className="text-[10px] font-bold text-emerald-600 border border-emerald-200 bg-emerald-50 rounded-full px-2.5 py-1 flex-shrink-0 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/60">Joined</span>
                  ) : (
                    <span className="text-xs font-semibold text-brand border border-brand/30 rounded-full px-3 py-1.5 flex-shrink-0">Join</span>
                  )}
                </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
        </Reveal>

      </div>
    </div>
    </PullToRefresh>
  );
}
