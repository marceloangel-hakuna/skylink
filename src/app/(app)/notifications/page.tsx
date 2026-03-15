"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

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

export default function NotificationsPage() {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState<string | null>(null);

  useEffect(() => {
    const sb = createClient();
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;

      // Pending requests where I am the receiver
      const { data: conns } = await sb
        .from("connections")
        .select("id, requester_id, message, created_at")
        .eq("receiver_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (!conns?.length) { setLoading(false); return; }

      const { data: profiles } = await sb
        .from("profiles")
        .select("id, full_name, avatar_url, role, company")
        .in("id", conns.map(c => c.requester_id));

      const pMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
      setRequests(conns.map(c => ({ ...c, profile: pMap[c.requester_id] ?? null })));
      setLoading(false);
    })();
  }, []);

  const respond = async (connId: string, status: "accepted" | "declined") => {
    setActing(connId);
    const sb = createClient();
    await sb.from("connections").update({ status }).eq("id", connId);
    setRequests(prev => prev.filter(r => r.id !== connId));
    setActing(null);
  };

  return (
    <div className="animate-fade-in pb-[80px]">
      {/* Header */}
      <div
        className="px-4 pb-4 border-b border-[var(--c-border)]"
        style={{ paddingTop: "max(20px, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black" style={{ color: "var(--c-text1)" }}>Alerts</h1>
            {requests.length > 0 && (
              <p className="text-xs mt-0.5" style={{ color: "var(--c-text2)" }}>
                {requests.length} pending request{requests.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {requests.length > 0 && (
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
              style={{ background: "#4A27E8" }}
            >
              {requests.length}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3">
        {/* ── Loading skeleton ── */}
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card animate-pulse flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl flex-shrink-0" style={{ background: "var(--c-muted)" }} />
            <div className="flex-1 flex flex-col gap-2 pt-1">
              <div className="h-3.5 rounded-full w-3/4" style={{ background: "var(--c-muted)" }} />
              <div className="h-3 rounded-full w-1/2"   style={{ background: "var(--c-muted)" }} />
            </div>
          </div>
        ))}

        {/* ── Empty state ── */}
        {!loading && requests.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
                 style={{ background: "var(--c-muted)" }}>🔔</div>
            <p className="text-sm font-bold" style={{ color: "var(--c-text1)" }}>All caught up</p>
            <p className="text-xs" style={{ color: "var(--c-text2)" }}>
              No pending connection requests
            </p>
            <Link
              href="/network"
              className="mt-1 text-xs font-semibold px-4 py-2 rounded-full text-white"
              style={{ background: "#4A27E8" }}
            >
              Discover People
            </Link>
          </div>
        )}

        {/* ── Request cards ── */}
        {!loading && requests.map(req => {
          const name = req.profile?.full_name ?? "Someone";
          const sub  = [req.profile?.role, req.profile?.company].filter(Boolean).join(" @ ") || "SkyLink Member";
          const inits = initials(name);
          return (
            <div key={req.id} className="card flex flex-col gap-3">
              {/* Person row */}
              <div className="flex items-center gap-3">
                {req.profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={req.profile.avatar_url} alt={name}
                    className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" />
                ) : (
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
                    style={{ background: "#4A27E8" }}
                  >
                    {inits}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--c-text1)" }}>
                    {name}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--c-text2)" }}>{sub}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--c-text3)" }}>
                    Wants to connect · {formatTime(req.created_at)}
                  </p>
                </div>
              </div>

              {/* Optional intro message */}
              {req.message && (
                <p
                  className="text-xs italic px-3 py-2.5 rounded-xl leading-relaxed"
                  style={{ background: "var(--c-muted)", color: "var(--c-text2)" }}
                >
                  &ldquo;{req.message}&rdquo;
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => respond(req.id, "accepted")}
                  disabled={acting === req.id}
                  className="flex-1 py-2.5 rounded-2xl text-white text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50"
                  style={{ background: "#4A27E8" }}
                >
                  {acting === req.id ? "…" : "Accept"}
                </button>
                <button
                  onClick={() => respond(req.id, "declined")}
                  disabled={acting === req.id}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-semibold active:scale-95 transition-transform border"
                  style={{ borderColor: "var(--c-border)", color: "var(--c-text2)" }}
                >
                  Decline
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
