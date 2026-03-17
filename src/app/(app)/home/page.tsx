import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import AtlasHomeSuggestion from "@/components/AtlasHomeSuggestion";

export const dynamic = "force-dynamic";

// Matches crew theme backgrounds in crews/[id]/page.tsx
const CREW_ICON_BG: Record<string, string> = {
  "11111111-0000-0000-0000-000000000001": "#FFEDD5", // SFO↔NYC — amber
  "11111111-0000-0000-0000-000000000002": "#DBEAFE", // AI Founders — blue
  "11111111-0000-0000-0000-000000000003": "#D1FAE5", // LatAm Tech — emerald
  "11111111-0000-0000-0000-000000000004": "#FEF9C3", // Silicon Valley — golden
};

const PEOPLE_NEARBY = [
  { name: "Sarah Chen",    role: "CTO",             match: 94, initials: "SC", color: "bg-violet-100 text-violet-700"  },
  { name: "Marcus Rivera", role: "VC Partner",      match: 88, initials: "MR", color: "bg-pink-100   text-pink-700"    },
  { name: "Priya Patel",   role: "Founder",         match: 82, initials: "PP", color: "bg-amber-100  text-amber-700"   },
  { name: "James Liu",     role: "Head of Product", match: 76, initials: "JL", color: "bg-emerald-100 text-emerald-700"},
  { name: "Aisha Okonkwo", role: "Angel Investor",  match: 71, initials: "AO", color: "bg-sky-100    text-sky-700"     },
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
    supabase.from("flights").select("flight_number").eq("user_id", uid).limit(1),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("receiver_id", uid).is("read_at", null),
    supabase.from("profiles").select("id, full_name, role, company, bio, interests").eq("id", uid).single(),
    supabase.from("points").select("amount").eq("user_id", uid),
  ]);

  // Fetch featured crews with member counts
  const { data: featuredCrews } = await supabase
    .from("crews")
    .select("id, name, icon")
    .limit(3);

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

  // Fall back to demo data when no real flight exists in DB yet
  const flightNumber = flights?.[0]?.flight_number ?? "AA 2317";

  const totalPoints = (pointsRows ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0);
  const tierName    = totalPoints >= 5000 ? "Platinum" : totalPoints >= 1500 ? "Gold" : totalPoints >= 500 ? "Silver" : "Bronze";
  const nextTierPts = totalPoints >= 5000 ? null : totalPoints >= 1500 ? 5000 : totalPoints >= 500 ? 1500 : 500;
  const ptsToNext   = nextTierPts ? nextTierPts - totalPoints : null;

  // Find other users on the same flight for Atlas matching
  const { data: flightmates } = await supabase
    .from("flights")
    .select("user_id")
    .eq("flight_number", flightNumber)
    .neq("user_id", uid)
    .limit(5);

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
    <div className="animate-fade-in pb-6">

      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="flex items-center px-4 pb-3 gap-3"
           style={{ paddingTop: "max(20px, env(safe-area-inset-top))" }}>
        <Link href="/profile" className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm active:scale-90 transition-transform">
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
          <p className="text-[17px] font-bold text-zinc-900 dark:text-zinc-50 leading-tight">Hey, {firstName} 👋</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 animate-pulse" />
            {`${flightNumber} · SFO → JFK · In flight`}
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
        <Link href="/flight/aa-2317" className="block active:scale-[0.98] transition-transform">
          <div className="rounded-3xl p-5 text-white overflow-hidden relative"
               style={{ background: "linear-gradient(135deg, #3418C8 0%, #4A27E8 60%, #6B4AF0 100%)" }}>
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-12 -left-6 w-32 h-32 rounded-full bg-white/5" />

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">Active Flight</p>
                  <p className="text-lg font-black mt-0.5">{flightNumber ?? "AA 2317"}</p>
                </div>
                <span className="bg-white/15 text-white text-[11px] font-semibold px-3 py-1 rounded-full">
                  Business
                </span>
              </div>

              <div className="flex items-end justify-between mb-1">
                <div>
                  <p className="text-4xl font-black tracking-tight">SFO</p>
                  <p className="text-white/60 text-xs mt-0.5">San Francisco</p>
                </div>
                <div className="flex-1 mx-3 mb-3">
                  <svg viewBox="0 0 160 50" fill="none" className="w-full">
                    {/* Full route arc — dashed */}
                    <path d="M8 42 Q80 4 152 42" stroke="white" strokeOpacity="0.25"
                          strokeWidth="1.5" fill="none" strokeDasharray="4 3"/>
                    {/* Progress arc — first half of same bezier (De Casteljau t=0.5):
                        control pt = lerp(P0,P1,0.5) = (44,23), end = (80,23) */}
                    <path d="M8 42 Q44 23 80 23" stroke="white" strokeWidth="2"
                          fill="none" strokeLinecap="round"/>
                    {/* Plane at midpoint (80,23) — tangent is horizontal at t=0.5 */}
                    <g transform="translate(80,23)">
                      <path d="M-7 0 L3 -3 L5 0 L3 3 Z
                               M-7 -1 L-3 -5 L-2 -1 Z
                               M-7  1 L-3  5 L-2  1 Z" fill="white"/>
                    </g>
                    <circle cx="8"   cy="42" r="3" fill="white" fillOpacity="0.6"/>
                    <circle cx="152" cy="42" r="3" fill="white" fillOpacity="0.3"/>
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black tracking-tight">JFK</p>
                  <p className="text-white/60 text-xs mt-0.5">New York</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/15 mt-1">
                <div className="flex gap-5">
                  <div>
                    <p className="text-white/50 text-[10px] uppercase tracking-wider">ETA</p>
                    <p className="text-sm font-bold">4:32 PM</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-[10px] uppercase tracking-wider">Remaining</p>
                    <p className="text-sm font-bold">5h 12m</p>
                  </div>
                </div>
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

        {/* ── Atlas AI Card ─────────────────────────────── */}
        <AtlasHomeSuggestion
          viewerProfile={viewerForAtlas}
          candidates={flightmateProfiles ?? []}
        />

        {/* ── People Near You ───────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">People Near You</h3>
            <Link href="/network" className="text-xs text-brand font-semibold">See all</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {PEOPLE_NEARBY.map((p) => (
              <div key={p.name} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[72px]">
                <div className="relative">
                  <div className={`w-14 h-14 rounded-2xl ${p.color} flex items-center justify-center text-sm font-black shadow-sm`}>
                    {p.initials}
                  </div>
                  <span className="absolute -bottom-1 -right-1 text-[9px] bg-emerald-400 text-white font-bold rounded-full px-1 py-px leading-tight shadow-sm">
                    {p.match}%
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-100 text-center leading-tight">
                  {p.name.split(" ")[0]}
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center leading-tight">{p.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SkyPoints ─────────────────────────────────── */}
        <Link href="/rewards" className="block active:scale-[0.98] transition-transform">
          <div className="rounded-2xl p-4 flex items-center gap-4"
               style={{ background: "linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)", border: "1px solid #FBCFE8" }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: "#FCE7F3" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="#F73D8A" stroke="#F73D8A" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#DB2777" }}>SkyPoints</p>
              <p className="text-2xl font-black leading-none" style={{ color: "#9D174D" }}>{totalPoints.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#FCE7F3", color: "#BE185D" }}>{tierName}</span>
              {ptsToNext && (
                <p className="text-[10px] mt-1" style={{ color: "#DB2777" }}>{ptsToNext.toLocaleString()} to next tier</p>
              )}
            </div>
          </div>
        </Link>

        {/* ── Sky Crews ─────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">Sky Crews</h3>
            <Link href="/crews" className="text-xs text-brand font-semibold">Browse all</Link>
          </div>
          <div className="flex flex-col gap-3">
            {featuredCrewsWithMeta.map((crew) => (
              <Link key={crew.id} href={`/crews/${crew.id}`}
                className="card flex items-center gap-3 active:scale-[0.98] transition-transform">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                     style={{ background: CREW_ICON_BG[crew.id] ?? "#EDE9FE" }}>
                  {crew.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{crew.name}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">{crew.member_count} member{crew.member_count !== 1 ? "s" : ""}</p>
                </div>
                {crew.is_member ? (
                  <span className="text-[10px] font-bold text-emerald-600 border border-emerald-200 bg-emerald-50 rounded-full px-2.5 py-1 flex-shrink-0">Joined</span>
                ) : (
                  <span className="text-xs font-semibold text-brand border border-brand/30 rounded-full px-3 py-1.5 flex-shrink-0">Join</span>
                )}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
