"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

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

// ── Placeholder notifications ─────────────────────────────
const PLACEHOLDER_NOTIFS: Omit<Notification, "id">[] = [
  {
    type: "atlas",
    title: "Atlas found a match for you",
    body: "Sarah Chen (CTO, Vertex AI) is on your flight and shares 3 interests. 94% match.",
    href: "/network",
    read: false,
    created_at: new Date(Date.now() - 12 * 60000).toISOString(),
  },
  {
    type: "flight",
    title: "Flight AA 2317 is now boarding",
    body: "Gate B14 · San Francisco → New York · Departs in 45 min",
    href: "/flight/aa-2317",
    read: false,
    created_at: new Date(Date.now() - 40 * 60000).toISOString(),
  },
  {
    type: "crew",
    title: "New member in AI Builders crew",
    body: "Marcus Rivera joined your sky crew. 8 members now flying SFO → JFK.",
    href: "/network",
    read: true,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    type: "message",
    title: "You have an unread message",
    body: "James Liu: \"Would love to grab coffee once we land — thoughts?\"",
    href: "/chat",
    read: true,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    type: "atlas",
    title: "Atlas insight from your last flight",
    body: "Jake Stone from DL 455 is actively seeking seed-stage SaaS. Consider reaching out.",
    href: "/flight",
    read: true,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    type: "flight",
    title: "You earned 200 SkyPoints",
    body: "For adding flight AA 2317. You're 300 pts away from Gold tier.",
    href: "/rewards",
    read: true,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

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
function NotifIcon({ type }: { type: NotifType }) {
  const configs: Record<NotifType, { emoji: string; bg: string }> = {
    connection: { emoji: "🤝", bg: "#EEF2FF" },
    message:    { emoji: "💬", bg: "#F0FDF4" },
    atlas:      { emoji: "✦",  bg: "#FFFBEB" },
    crew:       { emoji: "✈️", bg: "#F5F3FF" },
    flight:     { emoji: "🔔", bg: "#FFF7ED" },
  };
  const { emoji, bg } = configs[type];
  return (
    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
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
        const pMap = Object.fromEntries((profiles ?? []).map((p: { id: string }) => [p.id, p]));
        setRequests(conns.map((c: ConnectionRequest) => ({ ...c, profile: pMap[c.requester_id] ?? null })));
      }

      // Fetch stored notifications
      const { data: dbNotifs } = await sb
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      // Merge DB notifs with placeholders (show placeholders only if no DB notifs)
      const merged = (dbNotifs?.length)
        ? (dbNotifs as Notification[])
        : PLACEHOLDER_NOTIFS.map((n, i) => ({ ...n, id: `ph-${i}` }));
      setNotifs(merged);
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
    if (id.startsWith("ph")) {
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      return;
    }
    const sb = createClient();
    await sb.from("notifications").update({ read: true }).eq("id", id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifs.filter(n => !n.read).length + requests.length;

  return (
    <div className="animate-fade-in pb-[80px]">
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
        <div className="flex bg-zinc-100 dark:bg-[#1A1829] rounded-2xl p-1 mx-4 mb-4">
          <button onClick={() => setTab("all")}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${tab === "all" ? "text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500"}`}
            style={tab === "all" ? { background: "var(--c-card)" } : {}}>
            All
          </button>
          <button onClick={() => setTab("requests")}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all relative ${tab === "requests" ? "text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500"}`}
            style={tab === "requests" ? { background: "var(--c-card)" } : {}}>
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
                      <NotifIcon type={n.type} />
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
                <div className="flex flex-col items-center gap-3 py-20 text-center">
                  <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
                       style={{ background: "var(--c-muted)" }}>🔔</div>
                  <p className="text-sm font-bold" style={{ color: "var(--c-text1)" }}>All caught up</p>
                  <p className="text-xs" style={{ color: "var(--c-text2)" }}>No new alerts right now</p>
                </div>
              )}
            </>
          )}

          {/* ── Requests tab ────────────────────────────── */}
          {tab === "requests" && (
            <>
              {requests.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-20 text-center">
                  <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
                       style={{ background: "var(--c-muted)" }}>🤝</div>
                  <p className="text-sm font-bold" style={{ color: "var(--c-text1)" }}>No pending requests</p>
                  <p className="text-xs" style={{ color: "var(--c-text2)" }}>When someone wants to connect, they'll appear here</p>
                  <Link href="/network"
                    className="mt-1 text-xs font-semibold px-4 py-2 rounded-full text-white"
                    style={{ background: "#4A27E8" }}>
                    Discover People
                  </Link>
                </div>
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
