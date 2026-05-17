"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SheetName = "flights" | "people" | "chat" | "rewards" | "notifications";

// ── Drag-to-dismiss hook ──────────────────────────────────────────────────────
function useDragDismiss(onDismiss: () => void) {
  const ref    = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - startY.current;
    if (dy > 72) onDismiss();
  }, [onDismiss]);

  return { ref, onTouchStart, onTouchEnd };
}

// ── Handle bar ────────────────────────────────────────────────────────────────
function Handle({ onDismiss }: { onDismiss: () => void }) {
  const drag = useDragDismiss(onDismiss);
  return (
    <div
      className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab"
      onTouchStart={drag.onTouchStart}
      onTouchEnd={drag.onTouchEnd}
    >
      <div className="w-9 h-1 rounded-full" style={{ background: "var(--c-border)" }} />
    </div>
  );
}

// ── Sheet wrapper ─────────────────────────────────────────────────────────────
function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 55,
          background: "rgba(0,0,0,0.55)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s ease",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* Sheet panel */}
      <div
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60,
          maxHeight: "88vh",
          background: "var(--c-card)",
          borderRadius: "24px 24px 0 0",
          borderTop: "1px solid var(--c-border)",
          display: "flex", flexDirection: "column",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)",
          willChange: "transform",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        }}
      >
        <Handle onDismiss={onClose} />
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0">
          <h2 className="text-[19px] font-black" style={{ color: "var(--c-text1)", letterSpacing: "-0.03em" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: "var(--c-muted)", color: "var(--c-text2)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-5">
          {children}
        </div>
      </div>
    </>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--c-text3)" strokeWidth={2}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// FLIGHTS SHEET
// ────────────────────────────────────────────────────────────────────────────
type FlightRow = {
  id: string;
  flight_number: string;
  origin: string | null;
  destination: string | null;
  departure_date: string | null;
  status: string;
};

function FlightsContent() {
  const router = useRouter();
  const [flights, setFlights] = useState<FlightRow[] | null>(null);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      sb.from("user_flights")
        .select("id, flight_number, origin, destination, departure_date, status")
        .eq("user_id", user.id)
        .order("departure_date", { ascending: true, nullsFirst: false })
        .limit(10)
        .then(({ data }) => setFlights(data ?? []));
    });
  }, []);

  if (flights === null) return <Spinner />;

  const STATUS_COLOR: Record<string, string> = {
    upcoming: "#7C6AF5",
    active:   "#2DD4A8",
    completed: "var(--c-text3)",
    cancelled: "#E8567F",
  };

  return (
    <div className="pb-4">
      {flights.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
               style={{ background: "var(--c-muted)" }}>✈️</div>
          <p className="text-[15px] font-bold" style={{ color: "var(--c-text1)" }}>No flights yet</p>
          <p className="text-[13px]" style={{ color: "var(--c-text3)" }}>Add your next flight to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {flights.map(f => {
            const color = STATUS_COLOR[f.status] ?? "var(--c-text3)";
            const slug  = f.flight_number.replace(/\s+/g, "").toLowerCase();
            const date  = f.departure_date
              ? new Date(f.departure_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : null;
            return (
              <button
                key={f.id}
                onClick={() => router.push(`/flight/${slug}`)}
                className="w-full text-left rounded-2xl p-4 active:scale-[0.98] transition-transform"
                style={{ background: "var(--c-muted)", border: "1px solid var(--c-border)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[18px] font-black" style={{ color: "var(--c-text1)", letterSpacing: "-0.02em" }}>
                    {f.flight_number}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: `${color}18`, color }}>
                    {f.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[22px] font-black" style={{ color: "var(--c-text1)" }}>{f.origin ?? "—"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-text3)" strokeWidth={2}>
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[22px] font-black" style={{ color: "var(--c-text1)" }}>{f.destination ?? "—"}</span>
                  {date && <span className="ml-auto text-[12px]" style={{ color: "var(--c-text3)" }}>{date}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
      <button
        onClick={() => router.push("/flight")}
        className="w-full mt-4 py-3.5 rounded-2xl text-[14px] font-bold text-white active:scale-[0.98] transition-transform"
        style={{ background: "linear-gradient(135deg, #6B4AF0, #7C6AF5)" }}
      >
        + Add a Flight
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// PEOPLE SHEET
// ────────────────────────────────────────────────────────────────────────────
type PersonRow = {
  id: string;
  full_name: string | null;
  role: string | null;
  company: string | null;
};

function PeopleContent() {
  const router = useRouter();
  const [tab, setTab]         = useState<"flight" | "network">("flight");
  const [flightmates, setFlightmates] = useState<PersonRow[] | null>(null);
  const [connections, setConnections] = useState<PersonRow[] | null>(null);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const uid = user.id;

      // Active flight
      const { data: flights } = await sb
        .from("user_flights")
        .select("flight_number")
        .eq("user_id", uid)
        .in("status", ["upcoming", "active"])
        .order("departure_date", { ascending: true })
        .limit(1);

      const fn = flights?.[0]?.flight_number ?? null;
      if (fn) {
        const { data: fmRows } = await sb
          .from("user_flights")
          .select("user_id")
          .eq("flight_number", fn)
          .neq("user_id", uid)
          .limit(12);
        const ids = (fmRows ?? []).map(r => r.user_id);
        if (ids.length > 0) {
          const { data: profiles } = await sb
            .from("profiles")
            .select("id, full_name, role, company")
            .in("id", ids)
            .not("full_name", "is", null);
          setFlightmates(profiles ?? []);
        } else {
          setFlightmates([]);
        }
      } else {
        setFlightmates([]);
      }

      // Connections
      const { data: connRows } = await sb
        .from("connections")
        .select("requester_id, receiver_id")
        .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`)
        .eq("status", "accepted");
      const peerIds = (connRows ?? []).map(c => c.requester_id === uid ? c.receiver_id : c.requester_id);
      if (peerIds.length > 0) {
        const { data: profiles } = await sb
          .from("profiles")
          .select("id, full_name, role, company")
          .in("id", peerIds)
          .not("full_name", "is", null);
        setConnections(profiles ?? []);
      } else {
        setConnections([]);
      }
    });
  }, []);

  const list = tab === "flight" ? flightmates : connections;
  const loading = list === null;

  function PersonCard({ p }: { p: PersonRow }) {
    const name = p.full_name ?? "Unknown";
    const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
    const sub = [p.role, p.company].filter(Boolean).join(" · ");
    return (
      <button
        onClick={() => router.push(`/profile/${p.id}`)}
        className="w-full flex items-center gap-3 py-3 text-left active:opacity-70 transition-opacity"
        style={{ borderBottom: "1px solid var(--c-border)" }}
      >
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-black flex-shrink-0"
             style={{ background: "rgba(124,106,245,0.15)", color: "#7C6AF5" }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold truncate" style={{ color: "var(--c-text1)" }}>{name}</p>
          {sub && <p className="text-[12px] truncate mt-0.5" style={{ color: "var(--c-text2)" }}>{sub}</p>}
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-text3)" strokeWidth={2}>
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    );
  }

  return (
    <div className="pb-4">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(["flight", "network"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-full text-[12px] font-bold transition-colors"
            style={tab === t
              ? { background: "#7C6AF5", color: "#fff" }
              : { background: "var(--c-muted)", color: "var(--c-text2)", border: "1px solid var(--c-border)" }
            }
          >
            {t === "flight" ? "On Flight" : "My Network"}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <p className="text-[15px] font-bold" style={{ color: "var(--c-text1)" }}>
            {tab === "flight" ? "No one on this flight yet" : "No connections yet"}
          </p>
          <p className="text-[12px]" style={{ color: "var(--c-text3)" }}>
            {tab === "flight" ? "Check back after others join your flight." : "Connect with people on your flights."}
          </p>
        </div>
      ) : (
        <div>{list.map(p => <PersonCard key={p.id} p={p} />)}</div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// CHAT SHEET
// ────────────────────────────────────────────────────────────────────────────
type ConvRow = {
  id: string;
  other_user_id: string;
  other_name: string | null;
  other_role: string | null;
  last_message: string | null;
  updated_at: string;
};

function ChatContent() {
  const router = useRouter();
  const [convs, setConvs] = useState<ConvRow[] | null>(null);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const uid = user.id;

      const { data: rows } = await sb
        .from("conversations")
        .select("id, participant1_id, participant2_id, last_message, updated_at")
        .or(`participant1_id.eq.${uid},participant2_id.eq.${uid}`)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (!rows || rows.length === 0) { setConvs([]); return; }

      const otherIds = rows.map(r => r.participant1_id === uid ? r.participant2_id : r.participant1_id);
      const { data: profiles } = await sb
        .from("profiles")
        .select("id, full_name, role")
        .in("id", otherIds);

      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

      setConvs(rows.map(r => {
        const otherId = r.participant1_id === uid ? r.participant2_id : r.participant1_id;
        const prof = profileMap[otherId];
        return {
          id: r.id,
          other_user_id: otherId,
          other_name: prof?.full_name ?? null,
          other_role: prof?.role ?? null,
          last_message: r.last_message,
          updated_at: r.updated_at,
        };
      }));
    });
  }, []);

  if (convs === null) return <Spinner />;

  function relTime(iso: string) {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return "now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  }

  return (
    <div className="pb-4">
      {convs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
               style={{ background: "var(--c-muted)" }}>💬</div>
          <p className="text-[15px] font-bold" style={{ color: "var(--c-text1)" }}>No conversations yet</p>
          <p className="text-[12px]" style={{ color: "var(--c-text3)" }}>Connect with people on your flight to start chatting.</p>
        </div>
      ) : (
        <div>
          {convs.map(c => {
            const name = c.other_name ?? "Unknown";
            const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
            return (
              <button
                key={c.id}
                onClick={() => router.push(`/chat/${c.other_user_id}`)}
                className="w-full flex items-center gap-3 py-3 text-left active:opacity-70 transition-opacity"
                style={{ borderBottom: "1px solid var(--c-border)" }}
              >
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-black flex-shrink-0"
                     style={{ background: "rgba(96,165,250,0.15)", color: "#60A5FA" }}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-bold" style={{ color: "var(--c-text1)" }}>{name}</p>
                    <span className="text-[11px] flex-shrink-0" style={{ color: "var(--c-text3)" }}>{relTime(c.updated_at)}</span>
                  </div>
                  {c.last_message && (
                    <p className="text-[12px] truncate mt-0.5" style={{ color: "var(--c-text2)" }}>{c.last_message}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
      <button
        onClick={() => router.push("/chat")}
        className="w-full mt-4 py-3 rounded-2xl text-[13px] font-bold active:opacity-70 transition-opacity"
        style={{ background: "var(--c-muted)", color: "var(--c-text2)", border: "1px solid var(--c-border)" }}
      >
        Open full inbox
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// REWARDS SHEET
// ────────────────────────────────────────────────────────────────────────────
type PointRow = { amount: number; reason: string | null; created_at: string };

function RewardsContent() {
  const [rows, setRows]   = useState<PointRow[] | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await sb
        .from("points")
        .select("amount, reason, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      const pts = data ?? [];
      setRows(pts);
      setTotal(pts.reduce((s, r) => s + r.amount, 0));
    });
  }, []);

  if (rows === null) return <Spinner />;

  const tier    = total >= 5000 ? "Platinum" : total >= 1500 ? "Gold" : total >= 500 ? "Silver" : "Bronze";
  const nextPts = total >= 5000 ? null : total >= 1500 ? 5000 : total >= 500 ? 1500 : 500;
  const prev    = total >= 5000 ? 5000 : total >= 1500 ? 1500 : total >= 500 ? 500 : 0;
  const progress = nextPts ? Math.min(1, (total - prev) / (nextPts - prev)) : 1;
  const TIER_COLOR: Record<string, string> = { Bronze: "#F5A623", Silver: "#8590A6", Gold: "#F5A623", Platinum: "#7C6AF5" };
  const tColor = TIER_COLOR[tier] ?? "#F5A623";

  function relTime(iso: string) {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <div className="pb-4">
      {/* Points hero */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: "var(--c-muted)", border: "1px solid var(--c-border)" }}>
        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-[48px] font-black leading-none" style={{ color: "var(--c-text1)", letterSpacing: "-0.04em" }}>
            {total.toLocaleString()}
          </span>
          <span className="text-[13px] font-bold px-3 py-1 rounded-full"
                style={{ background: `${tColor}20`, color: tColor }}>
            {tier}
          </span>
        </div>
        <div className="rounded-full overflow-hidden mb-2" style={{ height: 6, background: "var(--c-border)" }}>
          <div className="h-full rounded-full transition-all duration-700"
               style={{ width: `${progress * 100}%`, background: tColor }} />
        </div>
        {nextPts && (
          <p className="text-[12px]" style={{ color: "var(--c-text3)" }}>
            {(nextPts - total).toLocaleString()} pts to {tier === "Bronze" ? "Silver" : tier === "Silver" ? "Gold" : "Platinum"}
          </p>
        )}
      </div>

      {/* Transaction history */}
      {rows.length > 0 && (
        <>
          <p className="text-[11px] font-black uppercase tracking-wider mb-3" style={{ color: "var(--c-text3)" }}>
            Recent activity
          </p>
          <div>
            {rows.map((r, i) => (
              <div key={i}
                   className="flex items-center justify-between py-3"
                   style={{ borderBottom: "1px solid var(--c-border)" }}>
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: "var(--c-text1)" }}>
                    {r.reason ?? "Points earned"}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--c-text3)" }}>{relTime(r.created_at)}</p>
                </div>
                <span className="text-[16px] font-black" style={{ color: r.amount >= 0 ? "#2DD4A8" : "#E8567F" }}>
                  {r.amount >= 0 ? "+" : ""}{r.amount}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS SHEET
// ────────────────────────────────────────────────────────────────────────────
type NotifRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
};

function NotificationsContent() {
  const [notifs, setNotifs] = useState<NotifRow[] | null>(null);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await sb
        .from("notifications")
        .select("id, type, title, body, read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      setNotifs(data ?? []);

      // Mark all as read
      await sb.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    });
  }, []);

  if (notifs === null) return <Spinner />;

  const TYPE_ICON: Record<string, string> = {
    connection_request: "👋",
    connection_accepted: "🤝",
    message: "💬",
    match: "✦",
    flight: "✈️",
    reward: "⭐",
  };

  function relTime(iso: string) {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <div className="pb-4">
      {notifs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
               style={{ background: "var(--c-muted)" }}>🔔</div>
          <p className="text-[15px] font-bold" style={{ color: "var(--c-text1)" }}>All caught up</p>
          <p className="text-[12px]" style={{ color: "var(--c-text3)" }}>No notifications right now.</p>
        </div>
      ) : (
        <div>
          {notifs.map(n => (
            <div
              key={n.id}
              className="flex items-start gap-3 py-3"
              style={{
                borderBottom: "1px solid var(--c-border)",
                opacity: n.read ? 0.65 : 1,
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0"
                   style={{ background: "var(--c-muted)" }}>
                {TYPE_ICON[n.type] ?? "🔔"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold leading-snug" style={{ color: "var(--c-text1)" }}>{n.title}</p>
                {n.body && <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: "var(--c-text2)" }}>{n.body}</p>}
                <p className="text-[11px] mt-1" style={{ color: "var(--c-text3)" }}>{relTime(n.created_at)}</p>
              </div>
              {!n.read && (
                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#7C6AF5" }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SHEET HOST — mounts in (app)/layout.tsx
// ────────────────────────────────────────────────────────────────────────────
const SHEET_TITLES: Record<SheetName, string> = {
  flights:       "Your Flights",
  people:        "People",
  chat:          "Messages",
  rewards:       "SkyPoints",
  notifications: "Notifications",
};

export default function SheetHost() {
  const [open, setOpen] = useState<SheetName | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      const sheet = (e as CustomEvent<{ sheet: SheetName }>).detail.sheet;
      setOpen(sheet);
    }
    window.addEventListener("openSheet", handler);
    return () => window.removeEventListener("openSheet", handler);
  }, []);

  const close = useCallback(() => setOpen(null), []);

  const sheets: SheetName[] = ["flights", "people", "chat", "rewards", "notifications"];

  return (
    <>
      {sheets.map(name => (
        <Sheet key={name} open={open === name} onClose={close} title={SHEET_TITLES[name]}>
          {open === name && (
            name === "flights"       ? <FlightsContent /> :
            name === "people"        ? <PeopleContent /> :
            name === "chat"          ? <ChatContent /> :
            name === "rewards"       ? <RewardsContent /> :
            name === "notifications" ? <NotificationsContent /> :
            null
          )}
        </Sheet>
      ))}
    </>
  );
}
