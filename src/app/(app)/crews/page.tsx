"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { CrewIcon, PlusIcon, renderCrewIcon } from "@/components/icons/AppIcons";
import { CREW_MINI_THEMES, resolveCrewThemeKey } from "./crewMiniThemes";

type Crew = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  header_style: string | null;
  created_by: string | null;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
};


export default function CrewsPage() {
  const supabase = createClient();
  const router   = useRouter();

  const [crews, setCrews]         = useState<Crew[]>([]);
  const [myCrews, setMyCrews]     = useState<Set<string>>(new Set());
  const [loading, setLoading]     = useState(true);
  const [joining, setJoining]     = useState<string | null>(null);
  const [tab, setTab]             = useState<"all" | "mine">("all");
  const [userId, setUserId]       = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Fetch all crews
      const { data: crewsData } = await supabase
        .from("crews")
        .select("id, name, description, icon, header_style, created_by, created_at")
        .order("created_at", { ascending: false });

      // Fetch member counts and membership status
      const { data: membersData } = await supabase
        .from("crew_members")
        .select("crew_id, user_id");

      const membersByCrewId: Record<string, string[]> = {};
      const userCrewIds = new Set<string>();
      for (const m of membersData ?? []) {
        if (!membersByCrewId[m.crew_id]) membersByCrewId[m.crew_id] = [];
        membersByCrewId[m.crew_id].push(m.user_id);
        if (m.user_id === user.id) userCrewIds.add(m.crew_id);
      }

      setMyCrews(userCrewIds);
      setCrews((crewsData ?? []).map(c => ({
        ...c,
        member_count: (membersByCrewId[c.id] ?? []).length,
        is_member: userCrewIds.has(c.id),
      })));
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function joinCrew(crewId: string) {
    if (!userId) return;
    setJoining(crewId);
    await supabase.from("crew_members").insert({ crew_id: crewId, user_id: userId, role: "member" });
    setMyCrews(prev => { const next = new Set(Array.from(prev)); next.add(crewId); return next; });
    setCrews(prev => prev.map(c => c.id === crewId ? { ...c, is_member: true, member_count: (c.member_count ?? 0) + 1 } : c));
    setJoining(null);
    router.push(`/crews/${crewId}`);
  }

  async function leaveCrew(crewId: string) {
    if (!userId) return;
    setJoining(crewId);
    await supabase.from("crew_members").delete().eq("crew_id", crewId).eq("user_id", userId);
    setMyCrews(prev => { const next = new Set(Array.from(prev)); next.delete(crewId); return next; });
    setCrews(prev => prev.map(c => c.id === crewId ? { ...c, is_member: false, member_count: Math.max(0, (c.member_count ?? 1) - 1) } : c));
    setJoining(null);
  }

  const displayed = tab === "mine" ? crews.filter(c => myCrews.has(c.id)) : crews;

  return (
    <div className="animate-fade-in pb-[110px]">

      {/* Header */}
      <div className="px-4 flex items-center justify-between"
           style={{ paddingTop: "max(20px, env(safe-area-inset-top))" }}>
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--c-text1)" }}>Sky Crews</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--c-text3)" }}>Communities for frequent flyers</p>
        </div>
        <Link href="/crews/create"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, #3418C8 0%, #4A27E8 100%)" }}>
          <PlusIcon size={14} color="white" strokeWidth={2.5} />
          Create
        </Link>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4">
        <div className="flex rounded-2xl p-1" style={{ background: "var(--c-muted)" }}>
          {(["all", "mine"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${t === tab ? "shadow-sm" : ""}`}
              style={{
                background: t === tab ? "var(--c-card)" : "transparent",
                color: t === tab ? "var(--c-text1)" : "var(--c-text3)",
              }}>
              {t === "mine" ? `My Crews${myCrews.size ? ` (${myCrews.size})` : ""}` : "Browse All"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mt-4 flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 border animate-pulse"
                 style={{ background: "var(--c-card)", borderColor: "var(--c-border)", height: 100 }} />
          ))
        ) : displayed.length === 0 ? (
          tab === "mine" ? (
            <EmptyState
              icon={<CrewIcon size={32} color="#4A27E8" />}
              title="No crews yet"
              body="Join a crew built around your interests, or create one for your community."
              action={{ label: "Browse All Crews", onClick: () => setTab("all") }}
            />
          ) : (
            <EmptyState
              icon={<CrewIcon size={32} color="#4A27E8" />}
              title="No crews available"
              body="Be the first to create a crew and build your community of frequent flyers."
              action={{ label: "Create a Crew", href: "/crews/create" }}
            />
          )
        ) : (
          displayed.map(crew => (
            <div key={crew.id}
              className="rounded-2xl border overflow-hidden"
              style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>

              {/* Tappable area → detail page */}
              <Link href={`/crews/${crew.id}`} className="flex items-start gap-3 p-4 active:opacity-80 transition-opacity">
                {(() => {
                  const mini = CREW_MINI_THEMES[resolveCrewThemeKey(crew.id, crew.header_style)] ?? CREW_MINI_THEMES.city;
                  return (
                    <div className="w-12 h-12 rounded-2xl flex-shrink-0 overflow-hidden relative"
                         style={{ background: mini.bg, border: `1px solid ${mini.border}` }}>
                      <div className="absolute right-0 top-0 w-8 h-full pointer-events-none opacity-90">
                        {mini.mini}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span style={{ color: mini.accent }}>{renderCrewIcon(crew.icon, 20)}</span>
                      </div>
                    </div>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: "var(--c-text1)" }}>{crew.name}</p>
                  {crew.description && (
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--c-text2)" }}>
                      {crew.description}
                    </p>
                  )}
                  <p className="text-[11px] mt-1.5 font-medium" style={{ color: "var(--c-text3)" }}>
                    {crew.member_count ?? 0} member{crew.member_count !== 1 ? "s" : ""}
                  </p>
                </div>
                {myCrews.has(crew.id) && (
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-full flex-shrink-0 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/60">
                    Joined ✓
                  </span>
                )}
              </Link>

              {/* CTA row */}
              <div className="px-4 pb-4 flex gap-2">
                {myCrews.has(crew.id) ? (
                  <>
                    <Link href={`/crews/${crew.id}`}
                      className="flex-1 py-2.5 text-center rounded-xl text-sm font-semibold text-white active:scale-95 transition-transform"
                      style={{ background: "#4A27E8" }}>
                      View Crew
                    </Link>
                    <button onClick={() => leaveCrew(crew.id)} disabled={joining === crew.id}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold border active:scale-95 transition-transform disabled:opacity-50"
                      style={{ borderColor: "var(--c-border)", color: "var(--c-text3)" }}>
                      Leave
                    </button>
                  </>
                ) : (
                  <button onClick={() => joinCrew(crew.id)} disabled={joining === crew.id}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-brand border active:scale-95 transition-transform disabled:opacity-50"
                    style={{ borderColor: "#4A27E8", borderWidth: 1.5 }}>
                    {joining === crew.id ? "Joining…" : "Join Crew"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
