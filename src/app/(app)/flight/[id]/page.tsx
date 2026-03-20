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

// ─── Placeholder people (until real passenger discovery is built) ──────────────

const PLACEHOLDER_PEOPLE = [
  { id: "1", name: "Sarah Chen",    role: "CTO",             company: "Finbridge",   initials: "SC", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",   match: 94, seat: "3A",  connected: false, mutual: 2 },
  { id: "2", name: "Marcus Rivera", role: "VC Partner",      company: "Sequoia",     initials: "MR", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",           match: 88, seat: "5C",  connected: false, mutual: 4 },
  { id: "3", name: "Priya Patel",   role: "Founder",         company: "Nexa AI",     initials: "PP", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",       match: 82, seat: "8B",  connected: true,  mutual: 1 },
  { id: "4", name: "James Liu",     role: "Head of Product", company: "Stripe",      initials: "JL", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", match: 76, seat: "12D", connected: false, mutual: 3 },
];

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
  userFlight, flightData, networkingStatus, onStatusUpdate, updatingStatus,
}: {
  userFlight: UserFlight | null;
  flightData: FlightData | null;
  networkingStatus: NetworkingStatus;
  onStatusUpdate: (s: NetworkingStatus) => void;
  updatingStatus: boolean;
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

    </div>
  );
}

// ─── People Tab ───────────────────────────────────────────────────────────────

type Person = typeof PLACEHOLDER_PEOPLE[number];

function PeopleTab({
  people, networkingStatus, onConnect,
}: {
  people: Person[];
  networkingStatus: NetworkingStatus;
  onConnect: (id: string) => void;
}) {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  if (networkingStatus === "invisible") {
    return (
      <div className="px-4 py-10 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
             style={{ background: "var(--c-muted)" }}>
          👻
        </div>
        <div>
          <p className="text-base font-black mb-1" style={{ color: "var(--c-text1)" }}>
            You&apos;re in Private Mode
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--c-text2)", maxWidth: "260px" }}>
            Set your status to <strong>Available</strong> on the Overview tab to see and be seen by SkyLink members on this flight.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      {/* Stats */}
      <div className="flex gap-3">
        <div className="rounded-2xl flex-1 text-center py-3" style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
          <p className="text-2xl font-black" style={{ color: "#34D399" }}>{people.filter(p => p.connected).length}</p>
          <p className="text-[10px] font-semibold mt-0.5" style={{ color: "var(--c-text3)" }}>Connected</p>
        </div>
        <div className="rounded-2xl flex-1 text-center py-3" style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
          <p className="text-2xl font-black" style={{ color: "#4A27E8" }}>{people.length}</p>
          <p className="text-[10px] font-semibold mt-0.5" style={{ color: "var(--c-text3)" }}>Available</p>
        </div>
        <div className="rounded-2xl flex-1 text-center py-3" style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
          <p className="text-2xl font-black" style={{ color: "#EAB308" }}>6</p>
          <p className="text-[10px] font-semibold mt-0.5" style={{ color: "var(--c-text3)" }}>Top Matches</p>
        </div>
      </div>

      {/* Notice */}
      <div className="rounded-xl px-3 py-2.5" style={{ background: "var(--c-muted)" }}>
        <p className="text-xs" style={{ color: "var(--c-text3)" }}>
          Showing SkyLink members who set themselves as <strong>Available</strong> on this flight.
        </p>
      </div>

      {/* People list */}
      {people.map(person => {
        const matchCls = person.match >= 85
          ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"
          : person.match >= 70
          ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
          : "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-[var(--c-muted)] dark:text-[var(--c-text2)]";

        return (
          <div key={person.id} className="rounded-2xl flex items-center gap-3 p-3.5"
               style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
            <button
              onClick={() => setSelectedPerson(person)}
              className="flex items-center gap-3 flex-1 min-w-0 text-left active:opacity-70 transition-opacity"
            >
              <div className={`w-12 h-12 rounded-2xl ${person.color} flex items-center justify-center text-sm font-black flex-shrink-0`}>
                {person.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--c-text1)" }}>{person.name}</p>
                  <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${matchCls}`}>
                    {person.match}%
                  </span>
                </div>
                <p className="text-xs truncate" style={{ color: "var(--c-text2)" }}>{person.role} · {person.company}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--c-text3)" }}>
                  Seat {person.seat}{person.mutual > 0 ? ` · ${person.mutual} mutual` : ""}
                </p>
              </div>
            </button>

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
        );
      })}

      {/* Person sheet */}
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
                <div className={`w-16 h-16 rounded-2xl ${selectedPerson.color} flex items-center justify-center text-xl font-black flex-shrink-0`}>
                  {selectedPerson.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-black" style={{ color: "var(--c-text1)" }}>{selectedPerson.name}</p>
                  <p className="text-sm" style={{ color: "var(--c-text2)" }}>{selectedPerson.role} · {selectedPerson.company}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                      {selectedPerson.match}% match
                    </span>
                    <span className="text-[11px]" style={{ color: "var(--c-text3)" }}>Seat {selectedPerson.seat}</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl px-3 py-2.5 atlas-insight-card">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="atlas-icon text-sm">✦</span>
                  <span className="text-[10px] font-black uppercase tracking-widest atlas-label">Atlas Match</span>
                </div>
                <p className="text-xs atlas-text-primary leading-relaxed">
                  Strong overlap in fintech and venture — great conversation starter about their recent work at {selectedPerson.company}.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { onConnect(selectedPerson.id); setSelectedPerson(null); }}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white active:scale-95 transition-transform"
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
  const [userFlight,      setUserFlight]      = useState<UserFlight | null>(null);
  const [flightData,      setFlightData]      = useState<FlightData | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [networkingStatus, setNetworkingStatus] = useState<NetworkingStatus>("invisible");
  const [updatingStatus,  setUpdatingStatus]  = useState(false);
  const [showPrompt,      setShowPrompt]      = useState(false);
  const [activeTab,       setActiveTab]       = useState<Tab>("overview");
  const [people,          setPeople]          = useState(PLACEHOLDER_PEOPLE);
  const [messages,        setMessages]        = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText,       setInputText]       = useState("");

  const supabase      = useRef(createClient());
  const channelRef    = useRef<RealtimeChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Load user flight + AirLabs data ───────────────────────────────────────
  const load = useCallback(async () => {
    const sb = supabase.current;
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    // Find matching flight by normalizing slug → flight number
    const normalized = rawSlug.replace(/-/g, "").toUpperCase();
    const { data: flights } = await sb
      .from("user_flights")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["upcoming", "active"]);

    const match = (flights ?? []).find((f: UserFlight) =>
      f.flight_number.replace(/[\s-]/g, "").toUpperCase() === normalized
    ) as UserFlight | undefined;

    if (match) {
      setUserFlight(match);
      const ns = (match.networking_status ?? "invisible") as NetworkingStatus;
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
          if (fd.found) setFlightData(fd);
        }
      } catch {
        // non-critical — show what we have from Supabase
      }
    }

    setLoading(false);
  }, [rawSlug]);

  useEffect(() => { load(); }, [load]);

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
    setUpdatingStatus(true);
    const { error } = await supabase.current
      .from("user_flights")
      .update({ networking_status: s })
      .eq("id", userFlight.id);
    if (!error) setNetworkingStatus(s);
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

  const handleConnect = (id: string) => {
    setPeople(prev => prev.map(p => p.id === id ? { ...p, connected: !p.connected } : p));
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
    { id: "overview", label: "Overview"             },
    { id: "people",   label: `People ${people.length}` },
    { id: "chat",     label: "Chat"                 },
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
        <div className="flex items-center gap-3 px-4 pt-3 pb-2.5">
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
        />
      )}
      {activeTab === "people" && (
        <PeopleTab
          people={people}
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
    </div>
  );
}
