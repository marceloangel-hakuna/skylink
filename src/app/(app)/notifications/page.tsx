"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";

// ── Types ─────────────────────────────────────────────────
type NotifType = "connection" | "message" | "atlas" | "crew" | "flight";

type Notification = {
  id: string;
  type: NotifType;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  created_at: string;
  actor_name: string | null;
  actor_avatar_url: string | null;
};

type ConnectionRequest = {
  id: string;
  requester_id: string;
  message: string | null;
  created_at: string;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string | null;
    company: string | null;
  } | null;
};


// ── Helpers ────────────────────────────────────────────────
function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

// ── Notification Icon ─────────────────────────────────────
function NotifIcon({ type, actorName, actorAvatar }: {
  type: NotifType;
  actorName?: string | null;
  actorAvatar?: string | null;
}) {
  // Person-triggered notifications show actor avatar
  const personTypes: NotifType[] = ["connection", "message", "crew"];
  if (personTypes.includes(type) && (actorAvatar || actorName)) {
    return (
      <div className="relative flex-shrink-0">
        {actorAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={actorAvatar} alt={actorName ?? ""} className="w-11 h-11 rounded-2xl object-cover" />
        ) : (
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm text-white"
               style={{ background: "#4A27E8" }}>
            {initials(actorName ?? null)}
          </div>
        )}
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
             style={{ background: "var(--c-card)", border: "1.5px solid var(--c-border)" }}>
          {type === "message" ? "💬" : type === "crew" ? "✈️" : "🤝"}
        </div>
      </div>
    );
  }

  const configs: Record<NotifType, { emoji: string; bg: string; darkClass: string }> = {
    connection: { emoji: "🤝", bg: "#EEF2FF", darkClass: "dark:bg-indigo-900/25" },
    message:    { emoji: "💬", bg: "#F0FDF4", darkClass: "dark:bg-emerald-900/25" },
    atlas:      { emoji: "✦",  bg: "#FFFBEB", darkClass: "dark:bg-amber-900/20"  },
    crew:       { emoji: "✈️", bg: "#F5F3FF", darkClass: "dark:bg-violet-900/25" },
    flight:     { emoji: "🔔", bg: "#FFF7ED", darkClass: "dark:bg-orange-900/20" },
  };
  const { emoji, bg, darkClass } = configs[type];
  return (
    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 ${darkClass}`}
         style={{ background: bg }}>
      {type === "atlas" ? (
        <span className="text-amber-500 font-black text-base">✦</span>
      ) : (
        <span>{emoji}</span>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function NotificationsPage() {
  const [requests, setRequests]   = useState<ConnectionRequest[]>([]);
  const [notifs, setNotifs]       = useState<Notification[]>([]);
  const [loading, setLoading]     = useState(true);
  const [acting, setActing]       = useState<string | null>(null);
  const [tab, setTab]             = useState<"all" | "requests">("all");

  useEffect(() => {
    const sb = createClient();
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Fetch pending connection requests
      const { data: conns } = await sb
        .from("connections")
        .select("id, requester_id, message, created_at")
        .eq("receiver_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (conns?.length) {
        const { data: profiles } = await sb
          .from("profiles")
          .select("id, full_name, avatar_url, role, company")
          .in("id", conns.map((c: { requester_id: string }) => c.requester_id));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pMap: Record<string, any> = Object.fromEntries((profiles ?? []).map((p: { id: string }) => [p.id, p]));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setRequests((conns as any[]).map(c => ({ ...c, profile: pMap[c.requester_id] ?? null })));
      }

      // Fetch stored notifications
      const { data: dbNotifs } = await sb
        .from("notifications")
        .select("id, type, title, body, href, read, created_at, actor_name, actor_avatar_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setNotifs((dbNotifs ?? []) as Notification[]);
      setLoading(false);
    })();
  }, []);

  const respond = async (connId: string, status: "accepted" | "declined") => {
    setActing(connId);
    const sb = createClient();
    await sb.from("connections").update({ status }).eq("id", connId);
    if (status === "accepted") {
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        await sb.from("points").insert({
          user_id: user.id, amount: 100, reason: "Accepted a connection",
        });
      }
    }
    setRequests(prev => prev.filter(r => r.id !== connId));
    setActing(null);
  };

  const markRead = async (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const sb = createClient();
    await sb.from("notifications").update({ read: true }).eq("id", id);
  };

  const unreadCount = notifs.filter(n => !n.read).length + requests.length;

  return (
    <div className="animate-fade-in pb-[110px]">
      {/* ── Header ──────────────────────────────────────── */}
      <div style={{ paddingTop: "max(20px, env(safe-area-inset-top))" }}>
        <div className="flex items-center justify-between px-4 pb-3">
          <div>
            <h1 className="text-2xl font-black" style={{ color: "var(--c-text1)" }}>Alerts</h1>
            {unreadCount > 0 && (
              <p className="text-xs mt-0.5" style={{ color: "var(--c-text2)" }}>
                {unreadCount} unread
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                  style={{ background: "#4A27E8" }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl p-1 mx-4 mb-4" style={{ background: "var(--c-muted)" }}>
          <button onClick={() => setTab("all")}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${tab === "all" ? "shadow-sm" : ""}`}
            style={{ background: tab === "all" ? "var(--c-card)" : "transparent", color: tab === "all" ? "var(--c-text1)" : "var(--c-text3)" }}>
            All
          </button>
          <button onClick={() => setTab("requests")}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all relative ${tab === "requests" ? "shadow-sm" : ""}`}
            style={{ background: tab === "requests" ? "var(--c-card)" : "transparent", color: tab === "requests" ? "var(--c-text1)" : "var(--c-text3)" }}>
            Requests
            {requests.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                    style={{ background: "#4A27E8" }}>
                {requests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────── */}
      {loading && (
        <div className="px-4 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl flex-shrink-0" style={{ background: "var(--c-muted)" }} />
              <div className="flex-1 flex flex-col gap-2 pt-1">
                <div className="h-3.5 rounded-full w-3/4" style={{ background: "var(--c-muted)" }} />
                <div className="h-3 rounded-full w-1/2" style={{ background: "var(--c-muted)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="px-4 flex flex-col gap-3">

          {/* ── All tab ─────────────────────────────────── */}
          {tab === "all" && (
            <>
              {/* Connection requests inline */}
              {requests.map(req => {
                const name  = req.profile?.full_name ?? "Someone";
                const sub   = [req.profile?.role, req.profile?.company].filter(Boolean).join(" @ ") || "SkyLink Member";
                const inits = initials(name);
                return (
                  <div key={req.id} className="rounded-2xl p-4 flex flex-col gap-3"
                       style={{ background: "var(--c-card)", border: "2px solid #4A27E8" }}>
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${req.requester_id}`} className="flex-shrink-0 active:opacity-70 transition-opacity">
                        {req.profile?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={req.profile.avatar_url} alt={name} className="w-11 h-11 rounded-2xl object-cover" />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm text-white"
                               style={{ background: "#4A27E8" }}>
                            {inits}
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#4A27E8" }} />
                          <p className="text-sm font-bold truncate" style={{ color: "var(--c-text1)" }}>{name}</p>
                        </div>
                        <p className="text-xs truncate" style={{ color: "var(--c-text2)" }}>{sub}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--c-text3)" }}>
                          Connection request · {formatTime(req.created_at)}
                        </p>
                      </div>
                    </div>
                    {req.message && (
                      <p className="text-xs italic px-3 py-2.5 rounded-xl leading-relaxed"
                         style={{ background: "var(--c-muted)", color: "var(--c-text2)" }}>
                        &ldquo;{req.message}&rdquo;
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => respond(req.id, "accepted")} disabled={acting === req.id}
                        className="flex-1 py-2.5 rounded-2xl text-white text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50"
                        style={{ background: "#4A27E8" }}>
                        {acting === req.id ? "…" : "Accept"}
                      </button>
                      <button onClick={() => respond(req.id, "declined")} disabled={acting === req.id}
                        className="flex-1 py-2.5 rounded-2xl text-sm font-semibold active:scale-95 transition-transform border"
                        style={{ borderColor: "var(--c-border)", color: "var(--c-text2)" }}>
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* General notifications */}
              {notifs.map(n => {
                const Wrapper = n.href ? Link : "div";
                const wrapperProps = n.href
                  ? { href: n.href, onClick: () => markRead(n.id), className: "block active:opacity-80 transition-opacity" }
                  : { onClick: () => markRead(n.id), className: "cursor-pointer" };

                return (
                  // @ts-expect-error – polymorphic wrapper
                  <Wrapper key={n.id} {...wrapperProps}>
                    <div className="rounded-2xl p-4 flex items-start gap-3"
                         style={{
                           background: "var(--c-card)",
                           border: `1px solid ${n.read ? "var(--c-border)" : "#4A27E8"}`,
                         }}>
                      <NotifIcon type={n.type} actorName={n.actor_name} actorAvatar={n.actor_avatar_url} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#4A27E8" }} />
                            )}
                            <p className={`text-sm truncate ${!n.read ? "font-bold" : "font-semibold"}`}
                               style={{ color: "var(--c-text1)" }}>
                              {n.title}
                            </p>
                          </div>
                          <p className="text-[10px] flex-shrink-0" style={{ color: "var(--c-text3)" }}>
                            {formatTime(n.created_at)}
                          </p>
                        </div>
                        {n.body && (
                          <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: "var(--c-text2)" }}>
                            {n.body}
                          </p>
                        )}
                      </div>
                    </div>
                  </Wrapper>
                );
              })}

              {requests.length === 0 && notifs.length === 0 && (
                <EmptyState
                  icon="🔔"
                  title="All caught up"
                  body="You'll be notified when someone connects, joins your crew, or replies to you."
                  className="py-12"
                />
              )}
            </>
          )}

          {/* ── Requests tab ────────────────────────────── */}
          {tab === "requests" && (
            <>
              {requests.length === 0 ? (
                <EmptyState
                  icon="🤝"
                  title="No pending requests"
                  body="When someone wants to connect with you, they'll appear here."
                  action={{ label: "Discover People", href: "/network" }}
                  className="py-12"
                />
              ) : requests.map(req => {
                const name  = req.profile?.full_name ?? "Someone";
                const sub   = [req.profile?.role, req.profile?.company].filter(Boolean).join(" @ ") || "SkyLink Member";
                const inits = initials(name);
                return (
                  <div key={req.id} className="card flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${req.requester_id}`} className="flex-shrink-0 active:opacity-70 transition-opacity">
                        {req.profile?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={req.profile.avatar_url} alt={name} className="w-12 h-12 rounded-2xl object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm text-white"
                               style={{ background: "#4A27E8" }}>
                            {inits}
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: "var(--c-text1)" }}>{name}</p>
                        <p className="text-xs truncate" style={{ color: "var(--c-text2)" }}>{sub}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--c-text3)" }}>
                          Wants to connect · {formatTime(req.created_at)}
                        </p>
                      </div>
                    </div>
                    {req.message && (
                      <p className="text-xs italic px-3 py-2.5 rounded-xl leading-relaxed"
                         style={{ background: "var(--c-muted)", color: "var(--c-text2)" }}>
                        &ldquo;{req.message}&rdquo;
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => respond(req.id, "accepted")} disabled={acting === req.id}
                        className="flex-1 py-2.5 rounded-2xl text-white text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50"
                        style={{ background: "#4A27E8" }}>
                        {acting === req.id ? "…" : "Accept"}
                      </button>
                      <button onClick={() => respond(req.id, "declined")} disabled={acting === req.id}
                        className="flex-1 py-2.5 rounded-2xl text-sm font-semibold active:scale-95 transition-transform border"
                        style={{ borderColor: "var(--c-border)", color: "var(--c-text2)" }}>
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
