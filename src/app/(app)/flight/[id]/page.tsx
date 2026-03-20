"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

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

type Message = {
  id: string; author: string; initials: string; color: string;
  text: string; time: string; isMe: boolean;
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

const INITIAL_MESSAGES: Message[] = [
  { id: "1", author: "Sarah Chen",    initials: "SC", color: "bg-violet-100 text-violet-700", text: "Hey everyone! Anyone heading to the TechCrunch conference?", time: "10:32 AM", isMe: false },
  { id: "2", author: "Marcus Rivera", initials: "MR", color: "bg-pink-100 text-pink-700",     text: "Yes! First time there — any tips on sessions to catch?",       time: "10:34 AM", isMe: false },
  { id: "3", author: "Me",            initials: "ME", color: "bg-brand text-white",            text: "Definitely the AI panel at 2pm, it's always packed 🔥",        time: "10:36 AM", isMe: true  },
];

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
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                 style={{ background: "rgba(74, 39, 232, 0.1)" }}>
              ✈️
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
              <span className="text-xl">🟢</span>
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
              <span className="text-xl">🟡</span>
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
              <span className="text-xl">👻</span>
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
  const configs = {
    available: {
      bg:     "rgba(16, 185, 129, 0.08)",
      border: "rgba(16, 185, 129, 0.3)",
      dot:    "#10B981",
      icon:   "🟢",
      label:  "Available for Networking",
      sub:    "SkyLink members on this flight can see you",
      other:  [
        { s: "not_available" as NetworkingStatus, label: "Mark Busy" },
        { s: "invisible"     as NetworkingStatus, label: "Go Private" },
      ],
    },
    not_available: {
      bg:     "rgba(234, 179, 8, 0.08)",
      border: "rgba(234, 179, 8, 0.3)",
      dot:    "#EAB308",
      icon:   "🟡",
      label:  "Visible but Busy",
      sub:    "Others can see you but know you're not available",
      other:  [
        { s: "available" as NetworkingStatus, label: "Go Available" },
        { s: "invisible" as NetworkingStatus, label: "Go Private"   },
      ],
    },
    invisible: {
      bg:     "var(--c-muted)",
      border: "var(--c-border)",
      dot:    "#94A3B8",
      icon:   "👻",
      label:  "Private Mode",
      sub:    "You're invisible to other members on this flight",
      other:  [
        { s: "available"     as NetworkingStatus, label: "Go Available" },
        { s: "not_available" as NetworkingStatus, label: "Mark Busy"    },
      ],
    },
  };

  const cfg = configs[status];

  return (
    <div className="rounded-2xl p-4" style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}` }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{cfg.icon}</span>
          <div>
            <p className="text-sm font-black" style={{ color: "var(--c-text1)" }}>{cfg.label}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--c-text3)" }}>{cfg.sub}</p>
          </div>
        </div>
        {updating && (
          <svg className="animate-spin w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        )}
      </div>

      <div className="flex gap-2">
        {cfg.other.map(({ s, label }) => (
          <button
            key={s}
            onClick={() => onUpdate(s)}
            disabled={updating}
            className="flex-1 text-xs font-semibold py-2 rounded-xl transition-all active:scale-[0.97] disabled:opacity-40"
            style={{ background: "var(--c-card)", color: "var(--c-text2)", border: "1px solid var(--c-border)" }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  userFlight, flightData, networkingStatus, onStatusUpdate, updatingStatus, onDelete,
}: {
  userFlight: UserFlight | null;
  flightData: FlightData | null;
  networkingStatus: NetworkingStatus;
  onStatusUpdate: (s: NetworkingStatus) => void;
  updatingStatus: boolean;
  onDelete: () => void;
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
  const arrGate     = flightData?.arr_gate;
  const delayed     = flightData?.delayed ?? 0;
  const airline     = flightData?.airline ?? "—";
  const airStatus   = flightData?.status ?? userFlight?.status ?? "scheduled";

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    scheduled: { bg: "#EEF2FF", text: "#4338CA", label: "Scheduled" },
    active:    { bg: "#D1FAE5", text: "#059669", label: "In Flight"  },
    landed:    { bg: "#F0FDF4", text: "#166534", label: "Landed"     },
    cancelled: { bg: "#FEF2F2", text: "#DC2626", label: "Cancelled"  },
  };
  const sc = statusColors[airStatus] ?? statusColors.scheduled;

  return (
    <div className="px-4 py-5 flex flex-col gap-4">

      {/* ── Networking Status Card ────────────── */}
      <StatusCard
        status={networkingStatus}
        onUpdate={onStatusUpdate}
        updating={updatingStatus}
      />

      {/* ── Route Card ───────────────────────── */}
      <div className="rounded-3xl p-5 text-white overflow-hidden relative"
           style={{ background: "linear-gradient(135deg, #3418C8 0%, #4A27E8 60%, #6B4AF0 100%)" }}>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-12 -left-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative">
          {/* Status badge */}
          <div className="flex justify-end mb-3">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full capitalize"
                  style={{ background: sc.bg, color: sc.text }}>
              {sc.label}
              {delayed > 0 ? ` · +${delayed}m` : ""}
            </span>
          </div>

          {/* Airport codes */}
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-[38px] font-black tracking-tight leading-none">{origin}</p>
              <p className="text-white/60 text-xs mt-1">{depCity}</p>
            </div>
            <div className="flex flex-col items-center pb-4 px-2">
              <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
                <path d="M2 8H38M30 2L38 8L30 14" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-white/50 text-[10px] mt-1.5">{duration}</p>
            </div>
            <div className="text-right">
              <p className="text-[38px] font-black tracking-tight leading-none">{destination}</p>
              <p className="text-white/60 text-xs mt-1">{arrCity}</p>
            </div>
          </div>

          {/* Times row */}
          <div className="flex items-center justify-between pt-3 border-t border-white/15">
            <div>
              <p className="text-white/50 text-[10px] uppercase tracking-wider">Departs</p>
              <p className="text-sm font-bold">{depTime}</p>
            </div>
            <div className="text-center">
              <p className="text-white/50 text-[10px] uppercase tracking-wider">Airline</p>
              <p className="text-sm font-bold font-mono">{airline}</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[10px] uppercase tracking-wider">Arrives</p>
              <p className="text-sm font-bold">{arrTime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Gate / Terminal Info ──────────────── */}
      {(terminal || gate || arrTerminal || arrGate) && (
        <div className="grid grid-cols-2 gap-3">
          {(terminal || gate) && (
            <div className="rounded-2xl p-3.5" style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--c-text3)" }}>Departure</p>
              <p className="text-base font-black" style={{ color: "var(--c-text1)" }}>
                {[terminal && `T${terminal}`, gate && `Gate ${gate}`].filter(Boolean).join(" · ")}
              </p>
            </div>
          )}
          {(arrTerminal || arrGate) && (
            <div className="rounded-2xl p-3.5" style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--c-text3)" }}>Arrival</p>
              <p className="text-base font-black" style={{ color: "var(--c-text1)" }}>
                {[arrTerminal && `T${arrTerminal}`, arrGate && `Gate ${arrGate}`].filter(Boolean).join(" · ")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Flight Stats ─────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Duration",  value: duration,                    emoji: "⏱" },
          { label: "Flight",    value: userFlight?.flight_number ?? "—", emoji: "✈" },
          { label: "Date",      value: userFlight?.departure_date ?? flightData?.departure_date ?? "TBD", emoji: "📅" },
          { label: "Delayed",   value: delayed > 0 ? `+${delayed} min` : "On time", emoji: delayed > 0 ? "⚠️" : "✓" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl flex items-center gap-3 p-3.5"
               style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                 style={{ background: "rgba(74, 39, 232, 0.08)" }}>
              {s.emoji}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--c-text3)" }}>{s.label}</p>
              <p className="text-sm font-bold truncate" style={{ color: "var(--c-text1)" }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Atlas Networking Score ────────────── */}
      <div className="rounded-2xl p-4 atlas-insight-card" style={{ border: "1px solid var(--c-border)" }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="atlas-icon text-sm">✦</span>
          <span className="text-sm font-black atlas-label">Atlas Insight</span>
          <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full atlas-badge">AI</span>
        </div>
        <p className="text-xs atlas-text-secondary leading-relaxed">
          {networkingStatus === "available"
            ? "You're visible! Other SkyLink members on this flight can discover and connect with you."
            : networkingStatus === "not_available"
            ? "You're visible but marked as busy. Others can see your profile but know you prefer not to be approached."
            : "You're in private mode. Go Available to discover who's networking on this flight."}
        </p>
      </div>

      {/* ── Delete Flight ─────────────────────── */}
      <button
        onClick={onDelete}
        className="w-full py-3 text-sm font-medium rounded-2xl active:scale-[0.98] transition-all mt-2"
        style={{ color: "#EF4444", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.14)" }}
      >
        Delete Flight
      </button>

    </div>
  );
}

// ─── People Tab ───────────────────────────────────────────────────────────────

function PeopleTab({
  people, loading, networkingStatus, onConnect,
}: {
  people: Person[];
  loading: boolean;
  networkingStatus: NetworkingStatus;
  onConnect: (id: string) => void;
}) {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Your own visibility banner
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
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "var(--c-muted)" }}>✈️</div>
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
          <div key={person.id} className="rounded-2xl flex items-center gap-3 p-3.5"
               style={{
                 background: "var(--c-card)",
                 border: person.isMe ? "1.5px solid #4A27E8" : "1px solid var(--c-border)",
               }}>
            <button
              onClick={() => !person.isMe && setSelectedPerson(person)}
              className={`flex items-center gap-3 flex-1 min-w-0 text-left ${!person.isMe ? "active:opacity-70 transition-opacity" : ""}`}
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
            </button>

            {person.isMe ? (
              <span className="flex-shrink-0 text-[10px] font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(74,39,232,0.08)", color: "#4A27E8" }}>
                You
              </span>
            ) : (
              <button
                onClick={() => onConnect(person.id)}
                className="flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-full transition-all active:scale-95"
                style={person.connected
                  ? { border: "1px solid #34D399", color: "#059669", background: "rgba(52,211,153,0.1)" }
                  : { background: "#4A27E8", color: "white" }}
              >
                {person.connected ? "Connected ✓" : "Connect"}
              </button>
            )}
          </div>
        );
      })}

      {/* Person detail sheet */}
      {selectedPerson && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[55] backdrop-blur-sm" onClick={() => setSelectedPerson(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-[60] rounded-t-3xl"
               style={{ background: "var(--c-card)", paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px) + 16px)", boxShadow: "0 -8px 40px rgba(0,0,0,0.2)" }}>
            <div className="pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--c-border)" }} />
            </div>
            <div className="px-5 pt-4 pb-2 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  {selectedPerson.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedPerson.avatar_url} alt={selectedPerson.name}
                         className="w-16 h-16 rounded-2xl object-cover" />
                  ) : (
                    <div className={`w-16 h-16 rounded-2xl ${personAvatarColor(selectedPerson.id)} flex items-center justify-center text-xl font-black`}>
                      {personInitials(selectedPerson.name)}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[var(--c-card)]"
                        style={{ background: selectedPerson.networking_status === "available" ? "#10B981" : "#EAB308" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-black" style={{ color: "var(--c-text1)" }}>{selectedPerson.name}</p>
                  {(selectedPerson.role || selectedPerson.company) && (
                    <p className="text-sm" style={{ color: "var(--c-text2)" }}>
                      {[selectedPerson.role, selectedPerson.company].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: selectedPerson.networking_status === "available" ? "rgba(16,185,129,0.1)" : "rgba(234,179,8,0.1)",
                          color: selectedPerson.networking_status === "available" ? "#059669" : "#B45309",
                        }}>
                    {selectedPerson.networking_status === "available" ? "🟢 Available" : "🟡 Busy"}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { onConnect(selectedPerson.id); setSelectedPerson(null); }}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold active:scale-95 transition-transform"
                  style={{ background: selectedPerson.connected ? "var(--c-muted)" : "#4A27E8", color: selectedPerson.connected ? "var(--c-text2)" : "white" }}
                >
                  {selectedPerson.connected ? "Connected ✓" : "Connect"}
                </button>
                <button
                  onClick={() => setSelectedPerson(null)}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold active:scale-95 transition-transform"
                  style={{ background: "var(--c-muted)", color: "var(--c-text2)", border: "1px solid var(--c-border)" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────

function ChatTab({
  messages, inputText, setInputText, onSend, messagesEndRef, flightLabel,
}: {
  messages: Message[];
  inputText: string;
  setInputText: (s: string) => void;
  onSend: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  flightLabel: string;
}) {
  return (
    <>
      <div className="px-4 pt-4 flex flex-col gap-3" style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px) + 72px)" }}>
        <div className="flex justify-center">
          <span className="text-[11px] text-zinc-400 bg-white dark:bg-[#18172A] rounded-full px-3 py-1 shadow-sm border border-surface-border dark:border-[#2E2C4A]">
            {flightLabel}
          </span>
        </div>

        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2 ${msg.isMe ? "flex-row-reverse" : ""}`}>
            {!msg.isMe && (
              <div className={`w-8 h-8 rounded-xl ${msg.color} flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-1`}>
                {msg.initials}
              </div>
            )}
            <div className={`max-w-[75%] flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}>
              {!msg.isMe && (
                <p className="text-[10px] text-zinc-400 font-semibold mb-1 ml-0.5">{msg.author}</p>
              )}
              <div className={`rounded-2xl px-3.5 py-2.5 ${msg.isMe ? "rounded-tr-sm" : "rounded-tl-sm bg-white dark:bg-[#211F35] shadow-sm border border-surface-border dark:border-[#2E2C4A]"}`}
                   style={msg.isMe ? { background: "#4A27E8" } : undefined}>
                <p className="text-sm leading-relaxed" style={{ color: msg.isMe ? "white" : "var(--c-text1)" }}>{msg.text}</p>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1 mx-0.5">{msg.time}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-[430px] border-t px-4 py-3 z-30"
           style={{ bottom: "calc(64px + env(safe-area-inset-bottom, 0px))", background: "var(--c-card)", borderColor: "var(--c-border)" }}>
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
            disabled={!inputText.trim()}
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
  const params  = useParams();
  const router  = useRouter();
  const rawSlug = (params.id as string) ?? "";

  // ── State ──────────────────────────────────────────────────────────────────
  const [userFlight,       setUserFlight]       = useState<UserFlight | null>(null);
  const [flightData,       setFlightData]       = useState<FlightData | null>(null);
  const [loading,          setLoading]          = useState(true);
  const [networkingStatus, setNetworkingStatus] = useState<NetworkingStatus>("invisible");
  const [updatingStatus,   setUpdatingStatus]   = useState(false);
  const [showPrompt,       setShowPrompt]       = useState(false);
  const [showDelete,       setShowDelete]       = useState(false);
  const [deleting,         setDeleting]         = useState(false);
  const [activeTab,        setActiveTab]        = useState<Tab>("overview");
  const [people,           setPeople]           = useState<Person[]>([]);
  const [peopleLoading,    setPeopleLoading]    = useState(false);
  const [userId,           setUserId]           = useState<string>("");
  const [messages,         setMessages]         = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText,        setInputText]        = useState("");

  const supabase      = useRef(createClient());
  const channelRef    = useRef<RealtimeChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Load user flight + AirLabs data ───────────────────────────────────────
  const load = useCallback(async () => {
    const sb = supabase.current;
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    setUserId(user.id);

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

    // Fetch all users on same flight; filter invisible ones out client-side (but always include self)
    const { data: flightmates } = await sb
      .from("user_flights")
      .select("user_id, networking_status")
      .eq("flight_number", userFlight.flight_number)
      .in("status", ["upcoming", "active", "completed"]);

    // Always include self, exclude others who are invisible
    const visible = (flightmates ?? []).filter(
      f => f.user_id === userId || f.networking_status !== "invisible"
    );

    if (!visible.length) { setPeople([]); setPeopleLoading(false); return; }

    const ids       = visible.map(f => f.user_id);
    const statusMap = Object.fromEntries(visible.map(f => [f.user_id, f.networking_status as NetworkingStatus]));

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
      networking_status: (p.id === userId ? networkingStatus : statusMap[p.id]) ?? "available" as NetworkingStatus,
      connected:         connectedIds.has(p.id),
      isMe:              p.id === userId,
    }));

    // Put self first, then others
    all.sort((a, b) => (a.isMe ? -1 : b.isMe ? 1 : 0));
    setPeople(all);
    setPeopleLoading(false);
  }, [userFlight, userId, networkingStatus]);

  // Load people when switching to people tab
  useEffect(() => {
    if (activeTab === "people") loadPeople();
  }, [activeTab, loadPeople]);

  // Reload people list when OUR status changes (so list updates immediately if we become invisible)
  useEffect(() => {
    if (activeTab === "people") loadPeople();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkingStatus]);

  // ── Realtime chat ──────────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase.current
      .channel(`flight-chat:${rawSlug}`)
      .on("broadcast", { event: "message" }, ({ payload }) => {
        setMessages(prev => [...prev, { ...(payload as Message), isMe: false }]);
      })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.current.removeChannel(channel); };
  }, [rawSlug]);

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
    if (!inputText.trim()) return;
    const now = new Date();
    const outgoing: Message = {
      id:       Date.now().toString(),
      author:   "Me",
      initials: "ME",
      color:    "bg-brand text-white",
      text:     inputText.trim(),
      time:     now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMe:     true,
    };
    setMessages(prev => [...prev, outgoing]);
    setInputText("");
    if (channelRef.current) {
      await channelRef.current.send({ type: "broadcast", event: "message", payload: outgoing });
    }
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
    <div className="animate-fade-in" style={{
      paddingBottom: activeTab === "chat" ? 0 : "calc(64px + env(safe-area-inset-bottom, 0px) + 8px)"
    }}>

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
        />
      )}
      {activeTab === "people" && (
        <PeopleTab
          people={people}
          loading={peopleLoading}
          networkingStatus={networkingStatus}
          onConnect={handleConnect}
        />
      )}
      {activeTab === "chat" && (
        <ChatTab
          messages={messages}
          inputText={inputText}
          setInputText={setInputText}
          onSend={handleSend}
          messagesEndRef={messagesEndRef}
          flightLabel={flightLabel}
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
