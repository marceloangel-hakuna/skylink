"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────────
type Crew = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  created_by: string | null;
  created_at: string;
};

type Post = {
  id: string;
  crew_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { full_name: string | null; avatar_url: string | null; role: string | null };
  like_count: number;
  liked_by_me: boolean;
};

type Event = {
  id: string;
  crew_id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  created_by: string | null;
  rsvp_count: number;
  rsvp_by_me: boolean;
};

type Member = {
  user_id: string;
  role: string;
  joined_at: string;
  profile?: { full_name: string | null; avatar_url: string | null; role: string | null; company: string | null };
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700", "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",   "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",       "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700", "bg-teal-100 text-teal-700",
];

function avatarColor(name: string) {
  return AVATAR_COLORS[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}
function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function Avatar({ name, url, size = 10 }: { name: string; url?: string | null; size?: number }) {
  const cls = `rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold`;
  const sz  = size === 10 ? "w-10 h-10 text-sm" : size === 12 ? "w-12 h-12 text-sm" : "w-8 h-8 text-xs";
  if (url) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} className={`${cls} ${sz} object-cover`} />
  );
  return (
    <div className={`${cls} ${sz} ${avatarColor(name)}`}>{initials(name)}</div>
  );
}

// ── Feed Tab ───────────────────────────────────────────────────────────────────
function FeedTab({ crewId, userId }: { crewId: string; userId: string }) {
  const supabase = createClient();
  const [posts, setPosts]       = useState<Post[]>([]);
  const [loading, setLoading]   = useState(true);
  const [content, setContent]   = useState("");
  const [posting, setPosting]   = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("crew_posts")
      .select("id, crew_id, user_id, content, created_at")
      .eq("crew_id", crewId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (!data?.length) { setLoading(false); return; }

    const profileIds = Array.from(new Set(data.map(p => p.user_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role")
      .in("id", profileIds);
    const pMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

    const { data: likes } = await supabase
      .from("crew_post_likes")
      .select("post_id, user_id")
      .in("post_id", data.map(p => p.id));

    const likesByPost: Record<string, string[]> = {};
    for (const l of likes ?? []) {
      if (!likesByPost[l.post_id]) likesByPost[l.post_id] = [];
      likesByPost[l.post_id].push(l.user_id);
    }

    setPosts(data.map(p => ({
      ...p,
      profile: pMap[p.user_id],
      like_count: (likesByPost[p.id] ?? []).length,
      liked_by_me: (likesByPost[p.id] ?? []).includes(userId),
    })));
    setLoading(false);
  }, [crewId, supabase, userId]);

  useEffect(() => { load(); }, [load]);

  async function submitPost() {
    if (!content.trim()) return;
    setPosting(true);
    await supabase.from("crew_posts").insert({ crew_id: crewId, user_id: userId, content: content.trim() });
    setContent("");
    await load();
    setPosting(false);
  }

  async function toggleLike(post: Post) {
    if (post.liked_by_me) {
      await supabase.from("crew_post_likes").delete().eq("post_id", post.id).eq("user_id", userId);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, like_count: p.like_count - 1, liked_by_me: false } : p));
    } else {
      await supabase.from("crew_post_likes").insert({ post_id: post.id, user_id: userId });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, like_count: p.like_count + 1, liked_by_me: true } : p));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Compose */}
      <div className="rounded-2xl p-4 border" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
        <textarea
          value={content} onChange={e => setContent(e.target.value)}
          placeholder="Share something with the crew…"
          rows={3}
          className="w-full text-sm resize-none focus:outline-none placeholder:text-zinc-400"
          style={{ background: "transparent", color: "var(--c-text1)" }}
        />
        <div className="flex justify-end mt-2">
          <button onClick={submitPost} disabled={!content.trim() || posting}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white active:scale-95 transition-transform disabled:opacity-40"
            style={{ background: "#4A27E8" }}>
            {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-4 border animate-pulse" style={{ background: "var(--c-card)", borderColor: "var(--c-border)", height: 100 }} />
        ))
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12">
          <span className="text-3xl">💬</span>
          <p className="text-sm" style={{ color: "var(--c-text3)" }}>Be the first to post in this crew!</p>
        </div>
      ) : (
        posts.map(post => {
          const name = post.profile?.full_name ?? "Member";
          return (
            <div key={post.id} className="rounded-2xl p-4 border" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
              <div className="flex items-center gap-2.5 mb-3">
                <Link href={`/profile/${post.user_id}`}>
                  <Avatar name={name} url={post.profile?.avatar_url} size={10} />
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: "var(--c-text1)" }}>{name}</p>
                  <p className="text-[11px]" style={{ color: "var(--c-text3)" }}>
                    {post.profile?.role ?? "Member"} · {timeAgo(post.created_at)}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--c-text1)" }}>{post.content}</p>
              <div className="flex items-center gap-1 mt-3">
                <button onClick={() => toggleLike(post)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium active:scale-95 transition-all"
                  style={{
                    background: post.liked_by_me ? "rgba(74,39,232,0.08)" : "var(--c-muted)",
                    color: post.liked_by_me ? "#4A27E8" : "var(--c-text3)",
                    border: post.liked_by_me ? "1px solid rgba(74,39,232,0.2)" : "1px solid transparent",
                  }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill={post.liked_by_me ? "currentColor" : "none"}>
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                      stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                  </svg>
                  {post.like_count > 0 && <span>{post.like_count}</span>}
                  {!post.liked_by_me && <span>Like</span>}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Events Tab ─────────────────────────────────────────────────────────────────
function EventsTab({ crewId, userId }: { crewId: string; userId: string }) {
  const supabase = createClient();
  const [events, setEvents]   = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvping, setRsvping] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("crew_events")
      .select("id, crew_id, title, description, event_date, location, created_by")
      .eq("crew_id", crewId)
      .order("event_date", { ascending: true });

    if (!data?.length) { setLoading(false); return; }

    const { data: rsvps } = await supabase
      .from("crew_event_rsvps")
      .select("event_id, user_id")
      .in("event_id", data.map(e => e.id));

    const rsvpsByEvent: Record<string, string[]> = {};
    for (const r of rsvps ?? []) {
      if (!rsvpsByEvent[r.event_id]) rsvpsByEvent[r.event_id] = [];
      rsvpsByEvent[r.event_id].push(r.user_id);
    }

    setEvents(data.map(e => ({
      ...e,
      rsvp_count: (rsvpsByEvent[e.id] ?? []).length,
      rsvp_by_me: (rsvpsByEvent[e.id] ?? []).includes(userId),
    })));
    setLoading(false);
  }, [crewId, supabase, userId]);

  useEffect(() => { load(); }, [load]);

  async function toggleRsvp(event: Event) {
    setRsvping(event.id);
    if (event.rsvp_by_me) {
      await supabase.from("crew_event_rsvps").delete().eq("event_id", event.id).eq("user_id", userId);
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, rsvp_count: e.rsvp_count - 1, rsvp_by_me: false } : e));
    } else {
      await supabase.from("crew_event_rsvps").insert({ event_id: event.id, user_id: userId });
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, rsvp_count: e.rsvp_count + 1, rsvp_by_me: true } : e));
    }
    setRsvping(null);
  }

  if (loading) return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-4 border animate-pulse" style={{ background: "var(--c-card)", borderColor: "var(--c-border)", height: 140 }} />
      ))}
    </div>
  );

  if (!events.length) return (
    <div className="flex flex-col items-center gap-2 py-12">
      <span className="text-3xl">📅</span>
      <p className="text-sm" style={{ color: "var(--c-text3)" }}>No upcoming events yet</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {events.map(evt => {
        const isPast = new Date(evt.event_date) < new Date();
        return (
          <div key={evt.id} className="rounded-2xl p-4 border" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
                   style={{ background: "rgba(74,39,232,0.08)" }}>
                📍
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ color: "var(--c-text1)" }}>{evt.title}</p>
                {evt.description && (
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--c-text2)" }}>{evt.description}</p>
                )}
                <div className="flex flex-col gap-0.5 mt-2">
                  <p className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--c-text2)" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                    {fmtDate(evt.event_date)}
                  </p>
                  {evt.location && (
                    <p className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--c-text2)" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="1.8"/>
                        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/>
                      </svg>
                      {evt.location}
                    </p>
                  )}
                  <p className="text-xs" style={{ color: "var(--c-text3)" }}>
                    {evt.rsvp_count} going
                  </p>
                </div>
              </div>
            </div>

            {!isPast && (
              <button onClick={() => toggleRsvp(evt)} disabled={rsvping === evt.id}
                className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-all disabled:opacity-50"
                style={evt.rsvp_by_me
                  ? { background: "rgba(52,211,153,0.1)", color: "#059669", border: "1px solid rgba(52,211,153,0.3)" }
                  : { background: "#4A27E8", color: "white" }}>
                {rsvping === evt.id ? "…" : evt.rsvp_by_me ? "Going ✓ (cancel RSVP)" : "RSVP — I'm going!"}
              </button>
            )}
            {isPast && (
              <div className="mt-3 py-2 text-center text-xs font-medium rounded-xl"
                   style={{ background: "var(--c-muted)", color: "var(--c-text3)" }}>
                Event passed
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Members Tab ────────────────────────────────────────────────────────────────
function MembersTab({ crewId }: { crewId: string }) {
  const supabase = createClient();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("crew_members")
        .select("user_id, role, joined_at")
        .eq("crew_id", crewId)
        .order("joined_at", { ascending: true });

      if (!data?.length) { setLoading(false); return; }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, company")
        .in("id", data.map(m => m.user_id));
      const pMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

      setMembers(data.map(m => ({ ...m, profile: pMap[m.user_id] })));
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crewId]);

  if (loading) return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-4 border animate-pulse" style={{ background: "var(--c-card)", borderColor: "var(--c-border)", height: 72 }} />
      ))}
    </div>
  );

  if (!members.length) return (
    <div className="flex flex-col items-center gap-2 py-12">
      <span className="text-3xl">👥</span>
      <p className="text-sm" style={{ color: "var(--c-text3)" }}>No members yet</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      {members.map(m => {
        const name = m.profile?.full_name ?? "Member";
        return (
          <Link key={m.user_id} href={`/profile/${m.user_id}`}
            className="flex items-center gap-3 p-3.5 rounded-2xl border active:opacity-80 transition-opacity"
            style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
            <Avatar name={name} url={m.profile?.avatar_url} size={10} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: "var(--c-text1)" }}>{name}</p>
              <p className="text-xs truncate" style={{ color: "var(--c-text2)" }}>
                {[m.profile?.role, m.profile?.company].filter(Boolean).join(" @ ") || "SkyLink Member"}
              </p>
            </div>
            {m.role === "admin" && (
              <span className="text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 px-2 py-1 rounded-full flex-shrink-0">
                Admin
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function CrewDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const router   = useRouter();

  const [crew, setCrew]         = useState<Crew | null>(null);
  const [userId, setUserId]     = useState("");
  const [isMember, setIsMember] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [joining, setJoining]   = useState(false);
  const [tab, setTab]           = useState<"feed" | "events" | "members">("feed");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: crewData } = await supabase
        .from("crews")
        .select("id, name, description, icon, created_by, created_at")
        .eq("id", params.id)
        .single();

      if (!crewData) { router.push("/crews"); return; }
      setCrew(crewData);

      const { data: members, count } = await supabase
        .from("crew_members")
        .select("user_id", { count: "exact" })
        .eq("crew_id", params.id);

      setMemberCount(count ?? 0);
      setIsMember((members ?? []).some(m => m.user_id === user.id));
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function joinCrew() {
    setJoining(true);
    await supabase.from("crew_members").insert({ crew_id: params.id, user_id: userId, role: "member" });
    setIsMember(true);
    setMemberCount(prev => prev + 1);
    setJoining(false);
  }

  async function leaveCrew() {
    setJoining(true);
    await supabase.from("crew_members").delete().eq("crew_id", params.id).eq("user_id", userId);
    setIsMember(false);
    setMemberCount(prev => Math.max(0, prev - 1));
    setJoining(false);
  }

  if (loading || !crew) {
    return (
      <div className="flex items-center justify-center py-32">
        <svg className="animate-spin w-7 h-7 text-brand" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>
    );
  }

  const TABS = [
    { key: "feed",    label: "Feed"    },
    { key: "events",  label: "Events"  },
    { key: "members", label: "Members" },
  ] as const;

  return (
    <div className="animate-fade-in pb-6">

      {/* Header */}
      <div className="px-4 pt-4" style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}>
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: "var(--c-muted)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="var(--c-text1)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <span className="text-sm font-semibold" style={{ color: "var(--c-text2)" }}>Sky Crews</span>
        </div>

        {/* Crew info */}
        <div className="rounded-3xl p-5 mb-4 text-white overflow-hidden relative"
             style={{ background: "linear-gradient(135deg, #3418C8 0%, #4A27E8 60%, #6B4AF0 100%)" }}>
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full bg-white/5" />
          <div className="relative">
            <div className="text-4xl mb-3">{crew.icon}</div>
            <h1 className="text-xl font-black mb-1">{crew.name}</h1>
            {crew.description && (
              <p className="text-white/70 text-sm leading-relaxed mb-3">{crew.description}</p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-white/60 text-xs">{memberCount} member{memberCount !== 1 ? "s" : ""}</p>
              {isMember ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold bg-white/20 text-white px-3 py-1 rounded-full">
                    Joined ✓
                  </span>
                  <button onClick={leaveCrew} disabled={joining}
                    className="text-[11px] font-medium text-white/70 active:opacity-60 transition-opacity disabled:opacity-40"
                    >
                    Leave
                  </button>
                </div>
              ) : (
                <button onClick={joinCrew} disabled={joining}
                  className="text-sm font-bold bg-white text-brand px-4 py-1.5 rounded-full active:scale-95 transition-transform disabled:opacity-60">
                  {joining ? "Joining…" : "Join Crew"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl p-1 mb-4" style={{ background: "var(--c-muted)" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${t.key === tab ? "shadow-sm" : ""}`}
              style={{
                background: t.key === tab ? "var(--c-card)" : "transparent",
                color: t.key === tab ? "var(--c-text1)" : "var(--c-text3)",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4">
        {tab === "feed"    && <FeedTab    crewId={params.id} userId={userId} />}
        {tab === "events"  && <EventsTab  crewId={params.id} userId={userId} />}
        {tab === "members" && <MembersTab crewId={params.id} />}
      </div>
    </div>
  );
}
