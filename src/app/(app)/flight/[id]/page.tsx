"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  PlaneIcon, EyeOffIcon, MessageBubbleIcon,
} from "@/components/icons/AppIcons";
import { avatarColor, initials as getInitials } from "@/lib/utils/avatarColor";
import type { DestEvent } from "@/app/api/events/destination/route";

// ─── Types ────────────────────────────────────────────────────────────────────

type NetworkingStatus = "invisible" | "available" | "not_available";

type UserFlight = {
  id: string;
  flight_number: string;
  origin: string | null;
  destination: string | null;
  departure_date: string | null;
  status: "upcoming" | "active" | "completed";
  networking_score: number;
  notes: string | null;
  networking_status: NetworkingStatus;
  created_at: string;
};

type FlightData = {
  found: boolean;
  flight_iata?: string;
  origin?: string;
  destination?: string;
  dep_city?: string;
  arr_city?: string;
  departure_date?: string;
  departure_time?: string;
  arrival_time?: string;
  status?: string;
  airline?: string;
  duration?: number;
  delayed?: number;
  dep_terminal?: string;
  dep_gate?: string;
  arr_terminal?: string;
  arr_gate?: string;
};

type Tab = "overview" | "people" | "chat";

type FlightMessage = {
  id: string;
  flight_number: string;
  departure_date: string | null;
  sender_id: string;
  content: string;
  created_at: string;
  _pending?: boolean;
  _failed?: boolean;
  _tempId?: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  company: string | null;
};

// ─── Real person type ─────────────────────────────────────────────────────────

type Person = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  avatar_url: string | null;
  networking_status: NetworkingStatus;
  connected: boolean;
  isMe?: boolean;
};

const PEOPLE_AVATAR_COLORS = [
  "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
];
function personAvatarColor(id: string) {
  return PEOPLE_AVATAR_COLORS[(id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % PEOPLE_AVATAR_COLORS.length];
}
function personInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

const OFFLINE_QUEUE_PREFIX = "skylink_fq_";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(min?: number) {
  if (!min) return null;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

// ─── Boarding Prompt Sheet ────────────────────────────────────────────────────

function BoardingPrompt({
  onChoose, onDismiss,
}: {
  onChoose: (s: NetworkingStatus) => void;
  onDismiss: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm" onClick={onDismiss} />
      <div className="fixed bottom-0 left-0 right-0 z-[60] rounded-t-3xl animate-slide-up"
           style={{
             background: "var(--c-card)",
             paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px) + 16px)",
             boxShadow: "0 -8px 40px rgba(0,0,0,0.25)",
           }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--c-border)" }} />
        </div>

        <div className="px-5 pt-4 pb-2 flex flex-col gap-5">
          {/* Icon + headline */}
          <div className="flex flex-col items-center text-center gap-2 pt-1">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                 style={{ background: "rgba(74, 39, 232, 0.1)", color: "var(--color-brand-fg)" }}>
              <PlaneIcon size={28} />
            </div>
            <h2 className="text-lg font-black" style={{ color: "var(--c-text1)" }}>
              Ready to board?
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--c-text2)", maxWidth: "280px" }}>
              You&apos;re in <strong>Private Mode</strong> by default. Let other SkyLink members on this flight know you&apos;re open to connecting.
            </p>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => onChoose("available")}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl active:scale-[0.98] transition-transform"
              style={{ background: "rgba(16, 185, 129, 0.08)", border: "1.5px solid rgba(16, 185, 129, 0.3)" }}
            >
              <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: "#10B981" }} />
              <div className="text-left">
                <p className="text-sm font-bold" style={{ color: "#059669" }}>I&apos;m Available</p>
                <p className="text-xs" style={{ color: "var(--c-text3)" }}>Visible to SkyLink members on this flight</p>
              </div>
            </button>

            <button
              onClick={() => onChoose("not_available")}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl active:scale-[0.98] transition-transform"
              style={{ background: "rgba(234, 179, 8, 0.08)", border: "1.5px solid rgba(234, 179, 8, 0.3)" }}
            >
              <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: "#EAB308" }} />
              <div className="text-left">
                <p className="text-sm font-bold" style={{ color: "#B45309" }}>Busy This Flight</p>
                <p className="text-xs" style={{ color: "var(--c-text3)" }}>Visible but marked as not available</p>
              </div>
            </button>

            <button
              onClick={onDismiss}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl active:scale-[0.98] transition-transform"
              style={{ background: "var(--c-muted)", border: "1.5px solid var(--c-border)" }}
            >
              <EyeOffIcon size={20} color="var(--c-text3)" />
              <div className="text-left">
                <p className="text-sm font-bold" style={{ color: "var(--c-text2)" }}>Stay Private</p>
                <p className="text-xs" style={{ color: "var(--c-text3)" }}>Keep me invisible on this flight</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Status Card ──────────────────────────────────────────────────────────────

function StatusCard({
  status, onUpdate, updating,
}: {
  status: NetworkingStatus;
  onUpdate: (s: NetworkingStatus) => void;
  updating: boolean;
}) {
  // Compact pill — shown when user has already opted into a visible status
  if (status === "available") {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl"
           style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#10B981", boxShadow: "0 0 6px #10B981" }} />
          <span className="text-xs font-semibold" style={{ color: "#059669" }}>Available for networking</span>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => onUpdate("not_available")} disabled={updating}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-xl active:scale-95 transition-transform disabled:opacity-40"
                  style={{ background: "var(--c-muted)", color: "var(--c-text3)", border: "1px solid var(--c-border)" }}>
            Busy
          </button>
          <button onClick={() => onUpdate("invisible")} disabled={updating}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-xl active:scale-95 transition-transform disabled:opacity-40"
                  style={{ background: "var(--c-muted)", color: "var(--c-text3)", border: "1px solid var(--c-border)" }}>
            Private
          </button>
        </div>
      </div>
    );
  }

  if (status === "not_available") {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl"
           style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#EAB308" }} />
          <span className="text-xs font-semibold" style={{ color: "#B45309" }}>Visible · Busy</span>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => onUpdate("available")} disabled={updating}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-xl active:scale-95 transition-transform disabled:opacity-40"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#059669", border: "1px solid rgba(16,185,129,0.2)" }}>
            Available
          </button>
          <button onClick={() => onUpdate("invisible")} disabled={updating}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-xl active:scale-95 transition-transform disabled:opacity-40"
                  style={{ background: "var(--c-muted)", color: "var(--c-text3)", border: "1px solid var(--c-border)" }}>
            Private
          </button>
        </div>
      </div>
    );
  }

  // Invisible/private — show the full prompt to encourage going available
  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--c-muted)", border: "1px solid var(--c-border)" }}>
      <div className="flex items-center gap-2.5 mb-3">
        <EyeOffIcon size={18} color="var(--c-text3)" />
        <div>
          <p className="text-sm font-black" style={{ color: "var(--c-text1)" }}>Private Mode</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--c-text3)" }}>Other SkyLink members can&apos;t see you on this flight</p>
        </div>
        {updating && (
          <svg className="animate-spin w-4 h-4 flex-shrink-0 ml-auto" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={() => onUpdate("available")} disabled={updating}
                className="flex-1 text-xs font-semibold py-2.5 rounded-xl transition-all active:scale-[0.97] disabled:opacity-40"
                style={{ background: "rgba(16,185,129,0.12)", color: "#059669", border: "1px solid rgba(16,185,129,0.25)" }}>
          Go Available
        </button>
        <button onClick={() => onUpdate("not_available")} disabled={updating}
                className="flex-1 text-xs font-semibold py-2.5 rounded-xl transition-all active:scale-[0.97] disabled:opacity-40"
                style={{ background: "var(--c-card)", color: "var(--c-text2)", border: "1px solid var(--c-border)" }}>
          Mark Busy
        </button>
      </div>
    </div>
  );
}

// ─── Industry inference ───────────────────────────────────────────────────────

function inferIndustry(role: string | null): string {
  if (!role) return "Other";
  const r = role.toLowerCase();
  if (/design|ux|ui|product design/.test(r)) return "Design";
  if (/engineer|dev|software|tech|data/.test(r)) return "Engineering";
  if (/vc|venture|invest|fund|finance|capital/.test(r)) return "Finance";
  if (/product|pm|program/.test(r)) return "Product";
  if (/market|growth|brand/.test(r)) return "Marketing";
  if (/found|ceo|cto|coo|exec/.test(r)) return "Executive";
  return "Other";
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  userFlight, flightData, networkingStatus, onStatusUpdate, updatingStatus, onDelete,
  networkingOverview, people, destEvents, destCity, flightSlug,
}: {
  userFlight: UserFlight | null;
  flightData: FlightData | null;
  networkingStatus: NetworkingStatus;
  onStatusUpdate: (s: NetworkingStatus) => void;
  updatingStatus: boolean;
  onDelete: () => void;
  networkingOverview: string | "loading" | null;
  people: Person[];
  destEvents: DestEvent[] | "loading" | null;
  destCity: string | null;
  flightSlug: string;
}) {
  const origin      = flightData?.origin      ?? userFlight?.origin      ?? "—";
  const destination = flightData?.destination  ?? userFlight?.destination  ?? "—";
  const depCity     = flightData?.dep_city     ?? origin;
  const arrCity     = flightData?.arr_city     ?? destination;
  const depTime     = flightData?.departure_time ?? "—";
  const arrTime     = flightData?.arrival_time   ?? "—";
  const duration    = fmtDuration(flightData?.duration) ?? "—";
  const terminal    = flightData?.dep_terminal;
  const gate        = flightData?.dep_gate;
  const arrTerminal = flightData?.arr_terminal;
  const delayed     = flightData?.delayed ?? 0;
  const airline     = flightData?.airline ?? "—";
  const airStatus   = flightData?.status ?? userFlight?.status ?? "scheduled";

  // People stats
  const others      = people.filter(p => !p.isMe);
  const available   = others.filter(p => p.networking_status === "available").length;
  const connections = others.filter(p => p.connected).length;
  const total       = others.length;

  // Nearby (same section — simplified as connections + some random nearby estimate)
  const nearby = Math.max(0, Math.floor(available * 0.4));

  // Industry breakdown from roles
  const industryCounts: Record<string, number> = {};
  for (const p of others) {
    const ind = inferIndustry(p.role);
    industryCounts[ind] = (industryCounts[ind] ?? 0) + 1;
  }
  const industryEntries = Object.entries(industryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const INDUSTRY_COLORS: Record<string, string> = {
    "Design":      "#7C6AF5",
    "Engineering": "#2DD4A8",
    "Finance":     "#F5A623",
    "Product":     "#60A5FA",
    "Marketing":   "#E8567F",
    "Executive":   "#A78BFA",
    "Other":       "#5C6170",
  };

  const statusConfig: Record<string, { label: string; dot: string; badge: string; badgeText: string }> = {
    scheduled: { label: "Scheduled",  dot: "#7C6AF5", badge: "rgba(124,106,245,0.15)",  badgeText: "#9B8BFF" },
    active:    { label: "In Flight",  dot: "#2DD4A8", badge: "rgba(45,212,168,0.15)",   badgeText: "#2DD4A8" },
    landed:    { label: "Landed",     dot: "#2DD4A8", badge: "rgba(45,212,168,0.15)",   badgeText: "#2DD4A8" },
    cancelled: { label: "Cancelled",  dot: "#EF4444", badge: "rgba(239,68,68,0.15)",    badgeText: "#FCA5A5" },
    upcoming:  { label: "Upcoming",   dot: "#7C6AF5", badge: "rgba(124,106,245,0.15)",  badgeText: "#9B8BFF" },
    completed: { label: "Completed",  dot: "#94A3B8", badge: "rgba(148,163,184,0.12)", badgeText: "#CBD5E1" },
  };
  const sc = statusConfig[airStatus] ?? statusConfig.scheduled;

  // Timeline events
  const timelineEvents = [
    { label: "Check-in open",        time: "—",      done: true,  active: false, sub: "Completed" },
    { label: "Bag drop",             time: "—",      done: true,  active: false, sub: "Completed" },
    { label: "Boarding",             time: depTime,  done: airStatus !== "scheduled" && airStatus !== "upcoming", active: airStatus === "scheduled" || airStatus === "upcoming", sub: gate ? `Gate ${gate} · Group A` : undefined, matchCount: available },
    { label: "Takeoff",              time: depTime,  done: airStatus === "active" || airStatus === "landed" || airStatus === "completed", active: false, sub: undefined, matchCount: undefined },
    { label: "In-flight networking", time: "—",      done: false, active: airStatus === "active", sub: "Wi-Fi enabled · Chat available", matchCount: undefined },
    { label: "Landing",              time: arrTime,  done: airStatus === "landed" || airStatus === "completed", active: false, sub: arrTerminal ? `Terminal ${arrTerminal}` : undefined, matchCount: undefined },
  ];

  return (
    <div className="px-4 py-5 flex flex-col gap-4">

      {/* ── Networking Status Card ────────────── */}
      <StatusCard
        status={networkingStatus}
        onUpdate={onStatusUpdate}
        updating={updatingStatus}
      />

      {/* ── Main Flight Card ──────────────────── */}
      <div className="rounded-3xl overflow-hidden" style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
        <div className="p-5">
          {/* Top: flight number + status */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "var(--c-text3)" }}>Flight</p>
              <p className="text-base font-black" style={{ color: "var(--c-text1)" }}>{userFlight?.flight_number ?? "—"}</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: sc.badge, color: sc.badgeText }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle" style={{ background: sc.dot }} />
              {sc.label}{delayed > 0 ? ` · +${delayed}m` : ""}
            </span>
          </div>

          {/* IATA codes with arc */}
          <div className="flex items-end gap-2 mb-4">
            {/* Origin */}
            <div className="flex-shrink-0" style={{ minWidth: 76 }}>
              <p className="text-[50px] font-black tracking-tight leading-none" style={{ color: "var(--c-text1)" }}>{origin}</p>
              {(terminal || depCity) && (
                <p className="text-xs mt-0.5" style={{ color: "var(--c-text2)" }}>{terminal ? `Terminal ${terminal}` : depCity}</p>
              )}
              <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--c-text2)" }}>{depTime}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--c-text3)" }}>{depCity}</p>
            </div>

            {/* Arc */}
            <div className="relative flex-1 flex flex-col items-center justify-start" style={{ height: 68 }}>
              <svg width="100%" height="44" viewBox="0 0 200 44" preserveAspectRatio="none" fill="none" style={{ overflow: "visible" }}>
                <path d="M 4 40 Q 100 4 196 40" stroke="rgba(124,106,245,0.30)" strokeWidth="1.5" strokeDasharray="5 4" fill="none"/>
                <circle cx="4"   cy="40" r="3" fill="rgba(124,106,245,0.4)"/>
                <circle cx="196" cy="40" r="3" fill="rgba(124,106,245,0.4)"/>
              </svg>
              <div className="absolute" style={{ top: -2, left: "50%", transform: "translateX(-50%)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                     style={{ background: "rgba(124,106,245,0.15)", border: "1px solid rgba(124,106,245,0.3)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#7C6AF5">
                    <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"/>
                  </svg>
                </div>
              </div>
              <p className="text-[10px] font-medium mt-1" style={{ color: "var(--c-text3)" }}>{duration}</p>
            </div>

            {/* Destination */}
            <div className="flex-shrink-0 text-right" style={{ minWidth: 76 }}>
              <p className="text-[50px] font-black tracking-tight leading-none" style={{ color: "var(--c-text1)" }}>{destination}</p>
              {(arrTerminal || arrCity) && (
                <p className="text-xs mt-0.5" style={{ color: "var(--c-text2)" }}>{arrTerminal ? `Terminal ${arrTerminal}` : arrCity}</p>
              )}
              <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--c-text2)" }}>{arrTime}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--c-text3)" }}>{arrCity}</p>
            </div>
          </div>

          {/* Mini info cards: Aircraft · Gate · Seat */}
          <div className="grid grid-cols-3 gap-2 pt-4" style={{ borderTop: "1px solid var(--c-border)" }}>
            {[
              { label: "Aircraft", value: airline, href: null, icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z" fill="currentColor"/></svg>
              )},
              { label: "Gate", value: gate ?? "—", href: null, icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M3 9h18M9 21V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              )},
              { label: "Seat", value: "14C", href: `/flight/${flightSlug}/seatmap`, icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/></svg>
              )},
            ].map(({ label, value, href, icon }) => {
              const inner = (
                <>
                  <div className="flex justify-center mb-1" style={{ color: href ? "#7C6AF5" : "var(--c-text3)" }}>{icon}</div>
                  <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: "var(--c-text3)" }}>{label}</p>
                  <p className="text-xs font-black" style={{ color: href ? "#7C6AF5" : "var(--c-text1)" }}>{value}</p>
                  {href && <p className="text-[8px] mt-0.5" style={{ color: "#7C6AF5" }}>View map ›</p>}
                </>
              );
              return href ? (
                <Link key={label} href={href}
                  className="rounded-2xl p-3 text-center active:scale-95 transition-transform"
                  style={{ background: "rgba(124,106,245,0.08)", border: "1px solid rgba(124,106,245,0.2)" }}>
                  {inner}
                </Link>
              ) : (
                <div key={label} className="rounded-2xl p-3 text-center" style={{ background: "var(--c-muted)" }}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── People Stat Cards ─────────────────── */}
      {total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Networking",  sublabel: "Matches on board", value: available,    color: "#2DD4A8" },
            { label: "Your row",    sublabel: "Matches nearby",   value: nearby,       color: "#7C6AF5" },
            { label: "Connections", sublabel: "Mutual contacts",  value: connections,  color: "#F5A623" },
          ].map(({ label, sublabel, value, color }) => (
            <div key={label} className="rounded-2xl p-3.5 flex flex-col gap-1"
                 style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
              <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--c-text3)" }}>{label}</p>
              <p className="text-2xl font-black leading-none" style={{ color }}>{value}</p>
              <p className="text-[9px] leading-tight mt-0.5" style={{ color: "var(--c-text3)" }}>{sublabel}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Networking Breakdown (Industry) ───── */}
      {industryEntries.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <p className="text-sm font-black" style={{ color: "var(--c-text1)" }}>Networking breakdown</p>
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(124,106,245,0.15)", color: "#7C6AF5" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#7C6AF5" }} />
              AI insights
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {industryEntries.map(([ind, count]) => {
              const color = INDUSTRY_COLORS[ind] ?? "#5C6170";
              const pct = total > 0 ? count / total : 0;
              return (
                <div key={ind} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <p className="text-xs w-16 flex-shrink-0 font-medium" style={{ color: "var(--c-text2)" }}>{ind}</p>
                  <div className="flex-1 rounded-xl overflow-hidden" style={{ height: 28, background: "var(--c-muted)" }}>
                    <div className="h-full rounded-xl transition-all" style={{ width: `${pct * 100}%`, background: color, minWidth: 4 }} />
                  </div>
                  <p className="text-sm font-black w-6 text-right flex-shrink-0" style={{ color: "var(--c-text2)" }}>{count}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Flight Timeline ───────────────────── */}
      <div className="rounded-2xl p-4" style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--c-text3)" }}>Flight Timeline</p>
        <div className="flex flex-col gap-0">
          {timelineEvents.map((ev, i) => (
            <div key={ev.label} className="flex items-start gap-3">
              {/* Dot + line */}
              <div className="flex flex-col items-center flex-shrink-0" style={{ width: 20 }}>
                {ev.active ? (
                  <div className="relative flex-shrink-0" style={{ width: 20, height: 20 }}>
                    <div className="absolute inset-0 rounded-full" style={{ background: "rgba(124,106,245,0.25)", border: "2px solid #7C6AF5", boxShadow: "0 0 10px rgba(124,106,245,0.5)" }} />
                    <div className="absolute inset-[4px] rounded-full" style={{ background: "#7C6AF5" }} />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full flex-shrink-0"
                       style={{
                         background: ev.done ? "#2DD4A8" : "var(--c-muted)",
                         border: `2px solid ${ev.done ? "#2DD4A8" : "var(--c-border)"}`,
                       }} />
                )}
                {i < timelineEvents.length - 1 && (
                  <div className="flex-1 mt-0.5 mb-0.5" style={{ width: 2, minHeight: 24, background: ev.done ? "rgba(45,212,168,0.4)" : "var(--c-border)" }} />
                )}
              </div>
              {/* Content */}
              <div className="flex-1 pb-5">
                <div className="flex items-center justify-between">
                  <p className={`font-semibold ${ev.active ? "text-sm" : "text-xs"}`} style={{ color: ev.active ? "var(--c-text1)" : ev.done ? "var(--c-text2)" : "var(--c-text3)" }}>
                    {ev.label}
                  </p>
                  {ev.done ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(45,212,168,0.12)", color: "#2DD4A8" }}>Completed</span>
                  ) : ev.active && ev.time !== "—" ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(124,106,245,0.15)", color: "#7C6AF5" }}>{ev.time}</span>
                  ) : (
                    <p className="text-[11px]" style={{ color: "var(--c-text3)" }}>{ev.time}</p>
                  )}
                </div>
                {ev.sub && (
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--c-text3)" }}>{ev.sub}</p>
                )}
                {ev.matchCount !== undefined && ev.matchCount > 0 && (
                  <div className="flex items-center justify-between mt-2 px-3 py-2 rounded-xl"
                       style={{ background: "var(--c-muted)", border: "1px solid var(--c-border)" }}>
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="9" cy="7" r="3" stroke="#7C6AF5" strokeWidth="1.8"/>
                        <path d="M3 20C3 17.24 5.69 15 9 15s6 2.24 6 5" stroke="#7C6AF5" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                      <span className="text-xs font-semibold" style={{ color: "var(--c-text1)" }}>
                        {ev.matchCount} match{ev.matchCount !== 1 ? "es" : ""} boarding with you
                      </span>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="var(--c-text3)" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── AI Networking Tip ─────────────────── */}
      <div className="rounded-2xl p-4 atlas-insight-card" style={{ border: "1px solid var(--c-border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="atlas-icon text-base">✦</span>
          <span className="text-base font-black atlas-label">AI networking tip</span>
          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full atlas-badge">AI</span>
        </div>
        <div className="rounded-2xl p-3.5 mb-3" style={{ background: "rgba(124,106,245,0.06)" }}>
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 atlas-icon" style={{ background: "rgba(124,106,245,0.12)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="3" width="20" height="5" rx="1" stroke="currentColor" strokeWidth="1.8"/>
                <rect x="2" y="11" width="20" height="5" rx="1" stroke="currentColor" strokeWidth="1.8"/>
                <rect x="2" y="19" width="20" height="5" rx="1" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
            </div>
            <div className="flex-1">
              {networkingOverview === "loading" ? (
                <div className="flex flex-col gap-1.5">
                  <div className="h-3 rounded-full animate-pulse w-full atlas-skeleton" />
                  <div className="h-3 rounded-full animate-pulse w-4/5 atlas-skeleton" />
                  <div className="h-3 rounded-full animate-pulse w-3/5 atlas-skeleton" />
                </div>
              ) : networkingOverview ? (
                <p className="text-xs atlas-text-secondary leading-relaxed">{networkingOverview}</p>
              ) : (
                <p className="text-xs atlas-text-secondary leading-relaxed">
                  {networkingStatus === "available"
                    ? "You appear to be networking. Consider connecting with matches before takeoff — early conversations tend to lead to stronger professional connections."
                    : networkingStatus === "not_available"
                    ? "You're marked as busy. Others can see your profile but may not initiate contact. You can change this anytime."
                    : "You're in private mode. Setting yourself as available may help you discover who's networking on this flight."}
                </p>
              )}
            </div>
          </div>
        </div>
        <p className="text-[10px] atlas-text-secondary opacity-60">
          🔒 Based on public profiles and your preferences
        </p>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--c-text3)" }}>Quick Actions</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Boarding Pass",
              href: `/flight/${flightSlug}/pass`,
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M16 5V3M8 5V3M16 19v2M8 19v2M2 10h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              ),
              color: "#2DD4A8",
              bg: "rgba(45,212,168,0.1)",
            },
            {
              label: "Lounge",
              href: null,
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 7H4C2.9 7 2 7.9 2 9v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                  <path d="M16 7V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M12 12v3M8 12v1M16 12v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              ),
              color: "#7C6AF5",
              bg: "rgba(124,106,245,0.1)",
            },
            {
              label: "Share Trip",
              href: null,
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="18" cy="5"  r="3" stroke="currentColor" strokeWidth="1.8"/>
                  <circle cx="6"  cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                  <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              ),
              color: "#E8567F",
              bg: "rgba(232,86,127,0.1)",
            },
          ].map(({ label, href, icon, color, bg }) => {
            const content = (
              <>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: bg, color }}>
                  {icon}
                </div>
                <p className="text-[10px] font-semibold text-center leading-tight" style={{ color: "var(--c-text2)" }}>{label}</p>
              </>
            );
            return href ? (
              <Link key={label} href={href}
                    className="rounded-2xl flex flex-col items-center gap-2 py-4 active:scale-[0.96] transition-transform"
                    style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
                {content}
              </Link>
            ) : (
              <button key={label}
                      className="rounded-2xl flex flex-col items-center gap-2 py-4 active:scale-[0.96] transition-transform"
                      style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
                {content}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Destination Events ────────────────── */}
      {(destEvents === "loading" || (Array.isArray(destEvents) && destEvents.length > 0)) && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text3)" }}>
              Events in {destCity ?? destination}
            </p>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(76,175,121,0.12)", color: "#4CAF79" }}>PredictHQ</span>
          </div>

          {destEvents === "loading" ? (
            <div className="flex flex-col gap-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "var(--c-muted)" }} />
              ))}
            </div>
          ) : destEvents.length === 0 ? (
            <div className="rounded-2xl p-4 text-center" style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
              <p className="text-xs" style={{ color: "var(--c-text3)" }}>No major events found near your arrival date.</p>
            </div>
          ) : (() => {
            // Tech-first sort, rotating palette
            const EVENT_PALETTE = ["#7C6AF5", "#2DD4A8", "#E8567F", "#F5A623", "#60A5FA"];
            const TECH_CATS = new Set(["conferences", "expos", "academic", "community"]);
            const sorted = [...destEvents].sort((a, b) => {
              const at = TECH_CATS.has(a.category) ? 0 : 1;
              const bt = TECH_CATS.has(b.category) ? 0 : 1;
              return at - bt || b.rank - a.rank;
            }).slice(0, 5);

            function evIcon(cat: string, color: string) {
              if (cat === "concerts" || cat === "festivals" || cat === "performing-arts") return (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18V5l12-2v13M9 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              );
              if (cat === "sports") return (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
                  <path d="M12 3c0 4.97-4.03 9-9 9M12 21c0-4.97 4.03-9 9-9M3 12h18" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              );
              if (cat === "conferences" || cat === "expos" || cat === "academic") return (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="1.8"/>
                  <path d="M8 4V2M16 4V2M3 10h18" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              );
              if (cat === "community") return (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
                  <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.8"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              );
              return (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              );
            }

            return (
              <div className="flex flex-col gap-2">
                {sorted.map((ev, i) => {
                  const col = EVENT_PALETTE[i % EVENT_PALETTE.length];
                  const dateStr = new Date(ev.start).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  return (
                    <div key={ev.id} className="rounded-2xl p-3.5 flex items-center gap-3"
                         style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                           style={{ background: `${col}18` }}>
                        {evIcon(ev.category, col)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold leading-tight line-clamp-1" style={{ color: "var(--c-text1)" }}>{ev.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--c-text3)" }}>
                          {dateStr} · <span className="capitalize">{ev.category.replace(/-/g, " ")}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Delete Flight ─────────────────────── */}
      <button
        onClick={onDelete}
        className="w-full py-3 text-sm font-medium rounded-2xl active:scale-[0.98] transition-all mt-1"
        style={{ color: "#EF4444", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.14)" }}
      >
        Delete Flight
      </button>

    </div>
  );
}

// ─── People Tab ───────────────────────────────────────────────────────────────

function PeopleTab({
  people, loading, networkingStatus, onConnect, flightSlug,
}: {
  people: Person[];
  loading: boolean;
  networkingStatus: NetworkingStatus;
  onConnect: (id: string) => void;
  flightSlug: string;
}) {
  const router = useRouter();
  const flightBackHref = `/flight/${flightSlug}?tab=people`;

  const visibilityBanner = {
    available:    { dot: "#10B981", label: "You're visible as Available", bg: "rgba(16,185,129,0.07)", border: "rgba(16,185,129,0.25)" },
    not_available:{ dot: "#EAB308", label: "You're visible as Busy",      bg: "rgba(234,179,8,0.07)",  border: "rgba(234,179,8,0.25)"  },
    invisible:    { dot: "#94A3B8", label: "You're invisible to others",   bg: "var(--c-muted)",        border: "var(--c-border)"       },
  }[networkingStatus];

  return (
    <div className="px-4 py-5 flex flex-col gap-4">

      {/* Your visibility banner */}
      <div className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
           style={{ background: visibilityBanner.bg, border: `1px solid ${visibilityBanner.border}` }}>
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: visibilityBanner.dot }} />
        <p className="text-xs font-medium" style={{ color: "var(--c-text2)" }}>{visibilityBanner.label}</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-2xl h-[72px] animate-pulse" style={{ background: "var(--c-muted)" }} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && people.length === 0 && (
        <div className="py-10 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--c-muted)", color: "var(--color-brand-fg)" }}><PlaneIcon size={28} /></div>
          <p className="text-sm font-black" style={{ color: "var(--c-text1)" }}>No one visible yet</p>
          <p className="text-xs" style={{ color: "var(--c-text2)", maxWidth: "240px" }}>
            Other SkyLink members will appear here once they set themselves as Available on this flight.
          </p>
        </div>
      )}

      {/* People list */}
      {!loading && people.map(person => {
        const color     = personAvatarColor(person.id);
        const ini       = personInitials(person.name);
        const statusDot = person.networking_status === "available" ? "#10B981" : "#EAB308";
        const statusTip = person.networking_status === "available" ? "Available" : "Busy";

        return (
          <div
            key={person.id}
            onClick={() => !person.isMe && router.push(`/profile/${person.id}?from=${encodeURIComponent(flightBackHref)}`)}
            className={`rounded-2xl flex items-center gap-3 p-3.5 ${!person.isMe ? "active:opacity-75 transition-opacity cursor-pointer" : ""}`}
            style={{
              background: "var(--c-card)",
              border: person.isMe ? "1.5px solid #4A27E8" : "1px solid var(--c-border)",
            }}
          >
            {/* Avatar with status dot */}
            <div className="relative flex-shrink-0">
              {person.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={person.avatar_url} alt={person.name}
                     className="w-12 h-12 rounded-2xl object-cover" />
              ) : (
                <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-sm font-black`}>
                  {ini}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--c-card)]"
                    style={{ background: statusDot }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-sm font-bold truncate" style={{ color: "var(--c-text1)" }}>
                  {person.name}{person.isMe ? " (You)" : ""}
                </p>
                <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: person.networking_status === "available" ? "rgba(16,185,129,0.1)" : "rgba(234,179,8,0.1)",
                        color:      person.networking_status === "available" ? "#059669" : "#B45309",
                      }}>
                  {statusTip}
                </span>
              </div>
              {(person.role || person.company) && (
                <p className="text-xs truncate" style={{ color: "var(--c-text2)" }}>
                  {[person.role, person.company].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>

            {/* Right-side action */}
            {person.isMe ? (
              <span className="flex-shrink-0 text-[10px] font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(74,39,232,0.08)", color: "var(--color-brand-fg)" }}>
                You
              </span>
            ) : (
              <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                {person.connected && (
                  <button
                    onClick={() => router.push(`/chat/${person.id}?from=${encodeURIComponent(flightBackHref)}`)}
                    className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                    style={{ background: "rgba(74,39,232,0.1)" }}
                    aria-label="Send message"
                  >
                    <MessageBubbleIcon size={15} color="#4A27E8" />
                  </button>
                )}
                <button
                  onClick={() => onConnect(person.id)}
                  className="flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-full transition-all active:scale-95"
                  style={person.connected
                    ? { border: "1px solid #34D399", color: "#059669", background: "rgba(52,211,153,0.1)" }
                    : { background: "#4A27E8", color: "white" }}
                >
                  {person.connected ? "Connected ✓" : "Connect"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────

function shouldShowTs(curr: FlightMessage, prev: FlightMessage | undefined): boolean {
  if (!prev) return true;
  return new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60_000;
}

function shouldShowSenderName(curr: FlightMessage, prev: FlightMessage | undefined, myId: string): boolean {
  if (curr.sender_id === myId) return false;
  if (!prev) return true;
  return prev.sender_id !== curr.sender_id;
}

function ChatTab({
  messages, inputText, setInputText, onSend, messagesEndRef,
  flightNumber, flightLabel, myId, profileCache, loading, sending,
  passengerCount, onShowPeople,
}: {
  messages: FlightMessage[];
  inputText: string;
  setInputText: (s: string) => void;
  onSend: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  flightNumber: string;
  flightLabel: string;
  myId: string;
  profileCache: React.MutableRefObject<Map<string, Profile>>;
  loading: boolean;
  sending: boolean;
  passengerCount: number;
  onShowPeople: () => void;
}) {
  return (
    <>
      {/* Messages scroll area */}
      <div className="px-4 pt-3 flex flex-col gap-0.5" style={{ paddingBottom: "calc(var(--nav-height) + 68px)", background: "var(--background)" }}>
        {/* Passenger count pill */}
        <div className="flex justify-center mb-2">
          <button
            onClick={onShowPeople}
            className="flex items-center gap-1.5 text-[11px] rounded-full px-3 py-1 shadow-sm active:scale-95 transition-transform"
            style={{ background: "var(--c-card)", color: "var(--c-text3)", border: "1px solid var(--c-border)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>{passengerCount > 0 ? `${passengerCount} passenger${passengerCount !== 1 ? "s" : ""}` : flightLabel}</span>
            {passengerCount > 0 && <span style={{ color: "var(--color-brand)", fontWeight: 700 }}>· See all</span>}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-brand)", borderTopColor: "transparent" }} />
          </div>
        )}

        {/* Empty state */}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(74,39,232,0.12), rgba(107,74,240,0.08))" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z" fill="var(--color-brand)" />
              </svg>
            </div>
            <p className="text-sm font-bold" style={{ color: "var(--c-text1)" }}>Flight {flightNumber} Chat</p>
            <p className="text-xs leading-relaxed max-w-[220px]" style={{ color: "var(--c-text3)" }}>
              All passengers on this flight can chat here. Be the first to say hello! ✈️
            </p>
          </div>
        )}

        {/* Message list */}
        {!loading && messages.map((msg, i) => {
          const isMe = msg.sender_id === myId;
          const prev = messages[i - 1];
          const showTs = shouldShowTs(msg, prev);
          const showSender = shouldShowSenderName(msg, prev, myId);
          const senderProfile = profileCache.current.get(msg.sender_id);
          const senderName = senderProfile?.full_name ?? null;
          const color = avatarColor(senderName);
          const inits = getInitials(senderName);
          const isContinuation = !isMe && !showSender && !showTs;

          return (
            <div key={msg.id}>
              {showTs && (
                <div className="flex justify-center my-3">
                  <span className="text-[10px] rounded-full px-2.5 py-1" style={{ background: "var(--c-card)", color: "var(--c-text3)", border: "1px solid var(--c-border)" }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )}
              {showSender && !isMe && (
                <p className="text-[11px] font-semibold ml-10 mb-0.5 mt-2" style={{ color: "var(--c-text3)" }}>
                  {senderName ?? "Passenger"}
                </p>
              )}
              <div className={`flex items-end gap-2 mb-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
                {!isMe && (
                  <div className="flex-shrink-0 w-7 self-end">
                    {(showSender || showTs) ? (
                      senderProfile?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={senderProfile.avatar_url} alt={senderName ?? ""} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${color}`}>{inits}</div>
                      )
                    ) : isContinuation ? (
                      <div className="w-7" />
                    ) : (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${color}`}>{inits}</div>
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                    ${isMe ? "rounded-br-sm text-white" : "rounded-bl-sm shadow-sm"}
                    ${msg._pending ? "opacity-70" : ""}
                    ${msg._failed ? "opacity-50" : ""}`}
                  style={isMe
                    ? { background: "#4A27E8" }
                    : { background: "var(--c-card)", color: "var(--c-text1)", border: "1px solid var(--c-border)" }
                  }
                >
                  {msg.content}
                  {msg._pending && <span className="ml-1.5 text-[11px]">⏳</span>}
                  {msg._failed && <span className="ml-1.5 text-[11px]">⚠️</span>}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input bar — fixed above the nav */}
      <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-[430px] border-t px-4 py-3 z-40"
           style={{ bottom: "var(--nav-height)", background: "var(--c-card)", borderColor: "var(--c-border)" }}>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
            placeholder="Message the flight…"
            className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none border border-transparent focus:border-brand/30 transition-colors"
            style={{ background: "var(--c-muted)", color: "var(--c-text1)" }}
          />
          <button
            onClick={onSend}
            disabled={!inputText.trim() || sending}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform disabled:opacity-40"
            style={{ background: "#4A27E8" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FlightDashboardPage() {
  const params       = useParams();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const rawSlug      = (params.id as string) ?? "";

  // Restore tab from URL (e.g. when navigating back from profile/chat)
  const initialTab   = (searchParams.get("tab") as Tab | null) ?? "overview";

  // ── State ──────────────────────────────────────────────────────────────────
  const [userFlight,       setUserFlight]       = useState<UserFlight | null>(null);
  const [flightData,       setFlightData]       = useState<FlightData | null>(null);
  const [loading,          setLoading]          = useState(true);
  const [networkingStatus, setNetworkingStatus] = useState<NetworkingStatus>("invisible");
  const [updatingStatus,   setUpdatingStatus]   = useState(false);
  const [showPrompt,       setShowPrompt]       = useState(false);
  const [showDelete,       setShowDelete]       = useState(false);
  const [deleting,         setDeleting]         = useState(false);
  const [activeTab,        setActiveTab]        = useState<Tab>(initialTab);
  const [people,            setPeople]            = useState<Person[]>([]);
  const [peopleLoading,     setPeopleLoading]     = useState(false);
  const [userId,            setUserId]            = useState<string>("");
  const [messages,          setMessages]          = useState<FlightMessage[]>([]);
  const [inputText,         setInputText]         = useState("");
  const [chatLoading,       setChatLoading]       = useState(false);
  const [chatSending,       setChatSending]       = useState(false);
  const [isChatOnline,      setIsChatOnline]      = useState(true);
  const [networkingOverview, setNetworkingOverview] = useState<string | "loading" | null>(null);
  const [destEvents,         setDestEvents]         = useState<DestEvent[] | "loading" | null>(null);
  const [destCity,           setDestCity]           = useState<string | null>(null);
  const eventsFetched      = useRef(false);

  const supabase           = useRef(createClient());
  const chatChannelRef     = useRef<RealtimeChannel | null>(null);
  const peopleChannelRef   = useRef<RealtimeChannel | null>(null);
  const messagesEndRef     = useRef<HTMLDivElement>(null);
  const overviewFetched    = useRef(false);
  const profileCache       = useRef<Map<string, Profile>>(new Map());
  const myIdRef            = useRef<string>("");
  const chatInitDone       = useRef(false);

  // ── Load user flight + AirLabs data ───────────────────────────────────────
  const load = useCallback(async () => {
    const sb = supabase.current;
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    myIdRef.current = user.id;

    // Find matching flight by normalizing slug → flight number
    const normalized = rawSlug.replace(/-/g, "").toUpperCase();
    const { data: flights } = await sb
      .from("user_flights")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["upcoming", "active", "completed"]);

    const match = (flights ?? []).find((f: UserFlight) =>
      f.flight_number.replace(/[\s-]/g, "").toUpperCase() === normalized
    ) as UserFlight | undefined;

    if (match) {
      setUserFlight(match);
      const stored = localStorage.getItem(`skylink_nstatus_${match.id}`) as NetworkingStatus | null;
      const ns = (match.networking_status ?? stored ?? "invisible") as NetworkingStatus;
      setNetworkingStatus(ns);

      // Show boarding prompt if still invisible and not dismissed
      const promptKey = `skylink_prompt_${match.id}`;
      if (ns === "invisible" && !localStorage.getItem(promptKey)) {
        setShowPrompt(true);
      }

      // Fetch real-time flight data from AirLabs
      try {
        const flightNum = match.flight_number.replace(/\s+/g, "");
        const res = await fetch(`/api/flight/lookup?flight=${encodeURIComponent(flightNum)}`);
        if (res.ok) {
          const fd: FlightData = await res.json();
          if (fd.found) {
            setFlightData(fd);
            // Auto-complete the flight when AirLabs confirms it has landed
            if (fd.status === "landed" && match.status !== "completed") {
              await sb.from("user_flights").update({ status: "completed" }).eq("id", match.id);
            }
          }
        }
      } catch {
        // non-critical — show what we have from Supabase
      }
    }

    setLoading(false);
  }, [rawSlug]);

  useEffect(() => { load(); }, [load]);

  // ── Load real people on this flight ───────────────────────────────────────
  const loadPeople = useCallback(async () => {
    if (!userFlight || !userId) return;
    setPeopleLoading(true);
    const sb = supabase.current;

    // Use server-side API (service-role key) to bypass RLS and see all users on flight
    let ids: string[] = [];
    let statusMap: Record<string, string> = {};
    try {
      const res = await fetch("/api/flight/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flightNumber: userFlight.flight_number, userId }),
      });
      const data = await res.json();
      ids = data.ids ?? [];
      statusMap = data.statusMap ?? {};
    } catch {
      setPeople([]);
      setPeopleLoading(false);
      return;
    }

    if (!ids.length) { setPeople([]); setPeopleLoading(false); return; }

    const [{ data: profiles }, { data: conns }] = await Promise.all([
      sb.from("profiles").select("id, full_name, avatar_url, role, company").in("id", ids),
      sb.from("connections")
        .select("requester_id, receiver_id")
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq("status", "accepted"),
    ]);

    const connectedIds = new Set((conns ?? []).map((c: { requester_id: string; receiver_id: string }) =>
      c.requester_id === userId ? c.receiver_id : c.requester_id
    ));

    const all = (profiles ?? []).map((p: { id: string; full_name: string | null; avatar_url: string | null; role: string | null; company: string | null }) => ({
      id:                p.id,
      name:              p.full_name ?? "Traveler",
      role:              p.role,
      company:           p.company,
      avatar_url:        p.avatar_url,
      networking_status: (p.id === userId ? networkingStatus : (statusMap[p.id] ?? "available")) as NetworkingStatus,
      connected:         connectedIds.has(p.id),
      isMe:              p.id === userId,
    }));

    all.sort((a, b) => (a.isMe ? -1 : b.isMe ? 1 : 0));
    setPeople(all);
    setPeopleLoading(false);
  }, [userFlight, userId, networkingStatus]);

  // Keep a stable ref so the realtime subscription can always call the latest loadPeople
  const loadPeopleRef = useRef(loadPeople);
  useEffect(() => { loadPeopleRef.current = loadPeople; }, [loadPeople]);

  // Load people when switching to people tab
  useEffect(() => {
    if (activeTab === "people") loadPeople();
  }, [activeTab, loadPeople]);

  // Reload people list when OUR status changes (so list updates immediately if we become invisible)
  useEffect(() => {
    if (activeTab === "people") loadPeople();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkingStatus]);

  // ── Background: load people count on mount so tab label + overview work ───
  useEffect(() => {
    if (userFlight && userId && !loading) loadPeople();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFlight?.id, userId, loading]);

  // ── Realtime: postgres_changes + broadcast for instant people updates ──────
  useEffect(() => {
    if (!userFlight) return;
    const flightNum = userFlight.flight_number.replace(/\s+/g, "").toUpperCase();

    const channel = supabase.current
      .channel(`flight-people:${flightNum}`)
      // postgres_changes covers status updates saved to DB
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "user_flights", filter: `flight_number=eq.${flightNum}` },
        () => { loadPeopleRef.current(); }
      )
      // broadcast covers users who just changed status (fires instantly, no replication lag)
      .on("broadcast", { event: "people_status" }, () => {
        loadPeopleRef.current();
      })
      .subscribe();

    peopleChannelRef.current = channel;
    return () => {
      supabase.current.removeChannel(channel);
      peopleChannelRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFlight?.id]);

  // ── Fetch Atlas networking overview once people are loaded ─────────────────
  useEffect(() => {
    const others = people.filter(p => !p.isMe);
    if (!others.length || !userFlight || !userId || overviewFetched.current) return;
    overviewFetched.current = true;
    setNetworkingOverview("loading");
    fetch("/api/flight/networking-overview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        viewer: people.find(p => p.isMe) ?? { id: userId, name: "You", role: null, company: null },
        people: people.map(p => ({ id: p.id, name: p.name, role: p.role, company: p.company })),
        flightNumber: userFlight.flight_number,
      }),
    })
      .then(r => r.json())
      .then(({ insight }: { insight: string | null }) => setNetworkingOverview(insight ?? null))
      .catch(() => setNetworkingOverview(null));
  }, [people, userFlight, userId]);

  // ── Fetch destination events once flightData has arr_city / destination ────
  useEffect(() => {
    if (eventsFetched.current) return;
    const dest = flightData?.destination ?? userFlight?.destination;
    const city = flightData?.arr_city;
    let rawDate = flightData?.departure_date ?? userFlight?.departure_date;
    // If departure date is in the past (> 1 day), use today
    if (rawDate) {
      const stored = new Date(rawDate + "T00:00:00");
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      if (stored < yesterday) {
        rawDate = new Date().toISOString().split("T")[0];
      }
    }
    const date = rawDate;
    if (!dest || !date) return;
    eventsFetched.current = true;
    setDestEvents("loading");

    const params = new URLSearchParams({ date });
    if (city) params.set("city", city);
    else      params.set("iata", dest);

    fetch(`/api/events/destination?${params}`)
      .then(r => r.json())
      .then(({ events, city: resolvedCity }: { events: DestEvent[]; city?: string }) => {
        setDestEvents(events.length > 0 ? events : []);
        if (resolvedCity) setDestCity(resolvedCity);
      })
      .catch(() => setDestEvents([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flightData?.destination, userFlight?.destination, flightData?.departure_date, userFlight?.departure_date]);

  // ── Online / offline detection ────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => setIsChatOnline(true);
    const handleOffline = () => setIsChatOnline(false);
    setIsChatOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ── Chat init: load messages + realtime subscription ─────────────────────
  useEffect(() => {
    if (!userFlight || !userId || chatInitDone.current) return;
    chatInitDone.current = true;
    const sb = supabase.current;
    const flightNum = userFlight.flight_number.replace(/\s+/g, "").toUpperCase();
    const depDate = userFlight.departure_date ?? "";
    const fKey = `${flightNum}_${depDate}`;

    setChatLoading(true);

    async function initChat() {
      // Cache own profile
      if (!profileCache.current.has(userId)) {
        const { data: prof } = await sb.from("profiles")
          .select("id, full_name, avatar_url, role, company")
          .eq("id", userId).single();
        if (prof) profileCache.current.set(userId, prof);
      }

      // Load existing messages
      const { data: msgs } = await sb.from("flight_messages")
        .select("*")
        .eq("flight_number", flightNum)
        .eq("departure_date", depDate)
        .order("created_at", { ascending: true });

      const fetched = (msgs ?? []) as FlightMessage[];

      // Pre-fetch sender profiles
      const senderIds = Array.from(new Set(
        fetched.map((m: FlightMessage) => m.sender_id).filter((id: string) => id !== userId)
      ));
      if (senderIds.length > 0) {
        const { data: profs } = await sb.from("profiles")
          .select("id, full_name, avatar_url, role, company")
          .in("id", senderIds);
        for (const p of (profs ?? [])) profileCache.current.set(p.id, p);
      }

      setMessages(fetched);
      setChatLoading(false);

      // ── Realtime subscription ─────────────────────────────────────────
      const channel = sb
        .channel(`flight_msg:${fKey}`)
        .on(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "postgres_changes" as any,
          { event: "INSERT", schema: "public", table: "flight_messages", filter: `flight_number=eq.${flightNum}` },
          async (payload: { new: FlightMessage }) => {
            const msg = payload.new;
            if (msg.departure_date !== depDate) return;
            if (msg.sender_id === myIdRef.current) return;

            if (!profileCache.current.has(msg.sender_id)) {
              const { data: prof } = await sb.from("profiles")
                .select("id, full_name, avatar_url, role, company")
                .eq("id", msg.sender_id).single();
              if (prof) profileCache.current.set(prof.id, prof);
            }

            setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        )
        .subscribe();

      chatChannelRef.current = channel;
    }

    initChat();

    return () => {
      if (chatChannelRef.current) {
        sb.removeChannel(chatChannelRef.current);
        chatChannelRef.current = null;
      }
      chatInitDone.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFlight?.id, userId]);

  useEffect(() => {
    if (activeTab === "chat") {
      const t = setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      return () => clearTimeout(t);
    }
  }, [activeTab, messages]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleStatusUpdate = useCallback(async (s: NetworkingStatus) => {
    if (!userFlight) return;
    // Optimistic update so UI responds immediately
    setNetworkingStatus(s);
    localStorage.setItem(`skylink_nstatus_${userFlight.id}`, s);
    setUpdatingStatus(true);
    await supabase.current
      .from("user_flights")
      .update({ networking_status: s })
      .eq("id", userFlight.id);
    setUpdatingStatus(false);
    // Broadcast immediately so other users on the same flight get a real-time refresh
    // (belt-and-suspenders alongside postgres_changes)
    if (peopleChannelRef.current) {
      peopleChannelRef.current.send({
        type: "broadcast",
        event: "people_status",
        payload: { networking_status: s },
      }).catch(() => {});
    }
  }, [userFlight]);

  const handlePromptChoose = useCallback(async (s: NetworkingStatus) => {
    setShowPrompt(false);
    if (userFlight) localStorage.setItem(`skylink_prompt_${userFlight.id}`, "1");
    await handleStatusUpdate(s);
  }, [userFlight, handleStatusUpdate]);

  const handlePromptDismiss = useCallback(() => {
    setShowPrompt(false);
    if (userFlight) localStorage.setItem(`skylink_prompt_${userFlight.id}`, "1");
  }, [userFlight]);

  const handleDelete = useCallback(async () => {
    if (!userFlight) return;
    setDeleting(true);
    await supabase.current.from("user_flights").delete().eq("id", userFlight.id);
    router.replace("/flight");
  }, [userFlight, router]);

  const handleConnect = async (id: string) => {
    const person = people.find(p => p.id === id);
    if (!person || !userId) return;
    // Optimistic toggle
    setPeople(prev => prev.map(p => p.id === id ? { ...p, connected: !p.connected } : p));
    if (!person.connected) {
      await supabase.current.from("connections").upsert({
        requester_id: userId,
        receiver_id:  id,
        status:       "accepted",
      }, { onConflict: "requester_id,receiver_id" });
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !userFlight || !userId || chatSending) return;
    setInputText("");

    const flightNum = userFlight.flight_number.replace(/\s+/g, "").toUpperCase();
    const depDate = userFlight.departure_date ?? "";
    const fKey = `${flightNum}_${depDate}`;
    const storageKey = `${OFFLINE_QUEUE_PREFIX}${fKey}`;

    if (!isChatOnline) {
      try {
        const raw = localStorage.getItem(storageKey);
        const queue: string[] = raw ? JSON.parse(raw) : [];
        queue.push(text);
        localStorage.setItem(storageKey, JSON.stringify(queue));
      } catch { /* ignore */ }
      const tempId = `temp-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: tempId, flight_number: flightNum, departure_date: depDate,
        sender_id: userId, content: text, created_at: new Date().toISOString(),
        _pending: true, _tempId: tempId,
      }]);
      return;
    }

    setChatSending(true);
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId, flight_number: flightNum, departure_date: depDate,
      sender_id: userId, content: text, created_at: new Date().toISOString(),
      _pending: true, _tempId: tempId,
    }]);

    const { data: saved, error } = await supabase.current
      .from("flight_messages")
      .insert({ flight_number: flightNum, departure_date: depDate, sender_id: userId, content: text })
      .select().single();

    if (error) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _pending: false, _failed: true } : m));
      setInputText(text);
    } else if (saved) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...saved } : m));
    }
    setChatSending(false);
  };

  // ── Derived display values ─────────────────────────────────────────────────
  const flightNumber = userFlight?.flight_number ?? rawSlug.replace(/-/g, "").toUpperCase();
  const fromCode     = flightData?.origin      ?? userFlight?.origin      ?? "—";
  const toCode       = flightData?.destination  ?? userFlight?.destination  ?? "—";
  const fromCity     = flightData?.dep_city     ?? fromCode;
  const toCity       = flightData?.arr_city     ?? toCode;
  const arrTime      = flightData?.arrival_time ?? "—";
  const airStatus    = flightData?.status       ?? userFlight?.status ?? "scheduled";

  const statusBadge = {
    scheduled: { bg: "#EEF2FF", text: "#4338CA", label: "Scheduled" },
    active:    { bg: "#D1FAE5", text: "#059669", label: "In Flight"  },
    landed:    { bg: "#F0FDF4", text: "#166534", label: "Landed"     },
    cancelled: { bg: "#FEF2F2", text: "#DC2626", label: "Cancelled"  },
  }[airStatus] ?? { bg: "#EEF2FF", text: "#4338CA", label: "Scheduled" };

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "people",   label: people.length > 0 ? `People (${people.length})` : "People" },
    { id: "chat",     label: "Chat" },
  ];

  const flightLabel = `${flightNumber} · ${fromCode} → ${toCode}`;

  if (loading) {
    return (
      <div className="flex flex-col gap-4 px-4 pt-8">
        <div className="h-12 rounded-2xl animate-pulse" style={{ background: "var(--c-muted)" }} />
        <div className="h-40 rounded-3xl animate-pulse" style={{ background: "var(--c-muted)" }} />
        <div className="h-24 rounded-2xl animate-pulse" style={{ background: "var(--c-muted)" }} />
      </div>
    );
  }

  return (
    <div
      className="animate-fade-in"
      style={{ paddingBottom: activeTab === "chat" ? 0 : "calc(var(--nav-height) + 8px)" }}
    >

      {/* ── Sticky header ──────────────────────── */}
      <div className="sticky top-0 z-30 border-b" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
        {/* Status-bar spacer */}
        <div style={{ height: "max(20px, env(safe-area-inset-top, 20px))" }} />

        <div className="flex items-center gap-3 px-4 pb-2.5">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
            style={{ background: "rgba(74, 39, 232, 0.1)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#4A27E8" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-black" style={{ color: "var(--c-text1)" }}>{flightNumber}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: statusBadge.bg, color: statusBadge.text }}>
                {statusBadge.label}
              </span>
            </div>
            <p className="text-xs truncate" style={{ color: "var(--c-text3)" }}>{fromCity} → {toCity}</p>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--c-text3)" }}>ETA</p>
            <p className="text-sm font-bold" style={{ color: "var(--c-text1)" }}>{arrTime}</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex px-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-xs font-semibold relative transition-colors`}
              style={{ color: activeTab === tab.id ? "#4A27E8" : "var(--c-text3)" }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full" style={{ background: "#4A27E8" }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ────────────────────────── */}
      {activeTab === "overview" && (
        <OverviewTab
          userFlight={userFlight}
          flightData={flightData}
          networkingStatus={networkingStatus}
          onStatusUpdate={handleStatusUpdate}
          updatingStatus={updatingStatus}
          onDelete={() => setShowDelete(true)}
          networkingOverview={networkingOverview}
          people={people}
          destEvents={destEvents}
          destCity={destCity}
          flightSlug={rawSlug}
        />
      )}
      {activeTab === "people" && (
        <PeopleTab
          people={people}
          loading={peopleLoading}
          networkingStatus={networkingStatus}
          onConnect={handleConnect}
          flightSlug={rawSlug}
        />
      )}
      {activeTab === "chat" && (
        <ChatTab
          messages={messages}
          inputText={inputText}
          setInputText={setInputText}
          onSend={handleSend}
          messagesEndRef={messagesEndRef}
          flightNumber={flightNumber}
          flightLabel={flightLabel}
          myId={userId}
          profileCache={profileCache}
          loading={chatLoading}
          sending={chatSending}
          passengerCount={people.length}
          onShowPeople={() => setActiveTab("people")}
        />
      )}

      {/* ── Boarding Prompt ─────────────────────── */}
      {showPrompt && (
        <BoardingPrompt
          onChoose={handlePromptChoose}
          onDismiss={handlePromptDismiss}
        />
      )}

      {/* ── Delete Confirmation Sheet ────────────── */}
      {showDelete && (
        <>
          <div
            className="fixed inset-0 z-[55] bg-black/50"
            onClick={() => !deleting && setShowDelete(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-[60] rounded-t-3xl max-w-[430px] mx-auto"
            style={{
              background: "var(--c-card)",
              paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px) + 16px)",
            }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--c-border)" }} />
            </div>
            <div className="px-5 pt-3 pb-2 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                   style={{ background: "#FEF2F2" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6H5H21M8 6V4C8 3.45 8.45 3 9 3H15C15.55 3 16 3.45 16 4V6M19 6L18 20C18 20.55 17.55 21 17 21H7C6.45 21 6 20.55 6 20L5 6H19Z"
                    stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-base font-bold mb-1" style={{ color: "var(--c-text1)" }}>Remove Flight?</h2>
              <p className="text-sm mb-5" style={{ color: "var(--c-text2)" }}>
                <strong>{flightLabel}</strong> will be removed from your trips. This cannot be undone.
              </p>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full py-3.5 rounded-2xl font-bold text-white mb-2 disabled:opacity-60 active:scale-[0.98] transition-all"
                style={{ background: "#EF4444" }}
              >
                {deleting ? "Removing…" : "Remove Flight"}
              </button>
              <button
                onClick={() => setShowDelete(false)}
                disabled={deleting}
                className="w-full py-3.5 rounded-2xl font-semibold text-sm disabled:opacity-60 active:scale-[0.98] transition-all"
                style={{ background: "var(--c-muted)", color: "var(--c-text2)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
