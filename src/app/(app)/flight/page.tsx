"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { createPortal } from "react-dom";
import { EmptyState } from "@/components/EmptyState";

// ── Types ─────────────────────────────────────────────────
type UserFlight = {
  id: string;
  flight_number: string;
  origin: string | null;
  destination: string | null;
  departure_date: string | null;
  status: "upcoming" | "active" | "completed";
  networking_score: number;
  notes: string | null;
  created_at: string;
};

type FlightInfo = {
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

// ── Placeholder history data ───────────────────────────────
const PAST_FLIGHTS = [
  {
    id: "h1", number: "DL 455", from: "BOS", to: "JFK",
    date: "Mar 8, 2026", score: 82,
    people: [
      { name: "Alex Kim",    role: "Designer",  initials: "AK", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
      { name: "Nina Torres", role: "PM",        initials: "NT", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"         },
      { name: "Carlos Wu",   role: "Engineer",  initials: "CW", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"         },
      { name: "Lisa Park",   role: "Marketing", initials: "LP", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    ],
    notes: "Met Alex before boarding — great conversation about design systems.",
    atlas: "You have a strong overlap with Nina Torres on product strategy. Consider following up about the Stripe redesign she mentioned.",
  },
  {
    id: "h2", number: "AA 102", from: "ORD", to: "BOS",
    date: "Mar 2, 2026", score: 94,
    people: [
      { name: "Jake Stone",  role: "Investor", initials: "JS", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"    },
      { name: "Maya Lee",    role: "Founder",  initials: "ML", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
      { name: "Ryan Gold",   role: "Advisor",  initials: "RG", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"         },
    ],
    notes: "",
    atlas: "Jake Stone mentioned he's actively looking for seed-stage B2B SaaS. You should reach out with your deck.",
  },
  {
    id: "h3", number: "UA 890", from: "LAX", to: "SFO",
    date: "Feb 24, 2026", score: 71,
    people: [
      { name: "Iris Chang",  role: "Data Scientist", initials: "IC", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
      { name: "Dave Mills",  role: "Product Lead",   initials: "DM", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    ],
    notes: "Short flight, only managed to exchange cards.",
    atlas: "Dave Mills is at a company that uses your tech stack. A warm intro through Iris could be valuable.",
  },
];

// ── Helpers ────────────────────────────────────────────────
function formatDate(d: string | null) {
  if (!d) return "Date TBD";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Score Badge ────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? "#10B981" : score >= 65 ? "#EAB308" : "#94A3B8";
  return (
    <span className="text-xs font-black px-2.5 py-1 rounded-full text-white flex-shrink-0"
          style={{ background: color }}>
      {score}%
    </span>
  );
}

// ── Add Flight Modal ───────────────────────────────────────
function AddFlightModal({ onClose, onAdd }: { onClose: () => void; onAdd: (f: Omit<UserFlight, "id" | "created_at">) => void }) {
  const [flightNum, setFlightNum]   = useState("");
  const [origin, setOrigin]         = useState("");
  const [dest, setDest]             = useState("");
  const [date, setDate]             = useState("");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [mounted, setMounted]       = useState(false);
  const [looking, setLooking]       = useState(false);
  const [flightInfo, setFlightInfo] = useState<FlightInfo | null>(null);
  const lookupTimer                 = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => setMounted(true), []);

  const handleFlightNumChange = (val: string) => {
    const upper = val.toUpperCase().replace(/\s+/g, "");
    setFlightNum(val.toUpperCase());
    setFlightInfo(null);

    if (lookupTimer.current) clearTimeout(lookupTimer.current);

    if (upper.length >= 4) {
      setLooking(true);
      lookupTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/flight/lookup?flight=${encodeURIComponent(upper)}`);
          const data: FlightInfo = await res.json();
          if (data.found) {
            setFlightInfo(data);
            if (data.origin)         setOrigin(data.origin);
            if (data.destination)    setDest(data.destination);
            if (data.departure_date) setDate(data.departure_date);
          } else {
            setFlightInfo({ found: false });
          }
        } catch {
          // silently fail — user can still fill in manually
        } finally {
          setLooking(false);
        }
      }, 700);
    } else {
      setLooking(false);
    }
  };

  const submit = async () => {
    if (!flightNum.trim()) { setError("Flight number is required"); return; }
    setSaving(true);
    setError(null);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setSaving(false); return; }

    const row = {
      user_id:          user.id,
      flight_number:    flightNum.trim().toUpperCase(),
      origin:           origin.trim().toUpperCase() || null,
      destination:      dest.trim().toUpperCase() || null,
      departure_date:   date || null,
      status:           "upcoming" as const,
      networking_score: 0,
      notes:            null,
    };

    const { error: dbErr } = await sb.from("user_flights").insert(row);
    if (dbErr) { setError(dbErr.message); setSaving(false); return; }

    await sb.from("points").insert({ user_id: user.id, amount: 200, reason: `Added flight ${row.flight_number}` });

    onAdd({ ...row });
    setSaving(false);
    onClose();
  };

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center"
         onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-t-3xl w-full max-w-[430px]"
           style={{ background: "var(--c-card)", paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px) + 16px)" }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--c-border)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <h3 className="text-base font-black" style={{ color: "var(--c-text1)" }}>Add a Flight</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "var(--c-muted)", color: "var(--c-text2)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="px-5 flex flex-col gap-4">
          {/* Flight number */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--c-text3)" }}>
              Flight Number *
            </label>
            <div className="relative">
              <input
                type="text"
                value={flightNum}
                onChange={e => handleFlightNumChange(e.target.value)}
                placeholder="e.g. AA2317"
                maxLength={8}
                autoFocus
                className="w-full px-4 py-3 rounded-2xl text-sm font-mono tracking-widest focus:outline-none focus:ring-2 pr-10"
                style={{ background: "var(--c-muted)", color: "var(--c-text1)", border: "1px solid var(--c-border)", ["--tw-ring-color" as string]: "#4A27E8" }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {looking && (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#4A27E8" strokeWidth="3" strokeOpacity="0.3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#4A27E8" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                )}
                {!looking && flightInfo?.found && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#10B981"/>
                    <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Flight found card */}
          {flightInfo?.found && (
            <div className="rounded-2xl p-3.5 flex flex-col gap-2"
                 style={{ background: "rgba(74, 39, 232, 0.07)", border: "1px solid rgba(74, 39, 232, 0.2)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black" style={{ color: "#4A27E8" }}>
                    {flightInfo.origin} → {flightInfo.destination}
                  </span>
                  {flightInfo.status && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                          style={{
                            background: flightInfo.status === "scheduled" ? "#EEF2FF" : "#D1FAE5",
                            color:      flightInfo.status === "scheduled" ? "#4338CA" : "#059669",
                          }}>
                      {flightInfo.status}
                    </span>
                  )}
                </div>
                {flightInfo.airline && (
                  <span className="text-[11px] font-mono font-bold" style={{ color: "var(--c-text3)" }}>
                    {flightInfo.airline}
                  </span>
                )}
              </div>
              {(flightInfo.dep_city || flightInfo.arr_city) && (
                <p className="text-xs" style={{ color: "var(--c-text2)" }}>
                  {flightInfo.dep_city}{flightInfo.dep_city && flightInfo.arr_city ? " → " : ""}{flightInfo.arr_city}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs" style={{ color: "var(--c-text2)" }}>
                {flightInfo.departure_time && <span>Dep {flightInfo.departure_time}</span>}
                {flightInfo.arrival_time   && <span>Arr {flightInfo.arrival_time}</span>}
                {flightInfo.duration       && <span>{Math.floor(flightInfo.duration / 60)}h {flightInfo.duration % 60}m</span>}
                {(flightInfo.delayed ?? 0) > 0 && (
                  <span style={{ color: "#EF4444" }}>+{flightInfo.delayed}m delay</span>
                )}
              </div>
              {(flightInfo.dep_terminal || flightInfo.dep_gate) && (
                <div className="flex gap-3 text-xs" style={{ color: "var(--c-text3)" }}>
                  {flightInfo.dep_terminal && <span>Terminal {flightInfo.dep_terminal}</span>}
                  {flightInfo.dep_gate     && <span>Gate {flightInfo.dep_gate}</span>}
                </div>
              )}
            </div>
          )}

          {/* Not found hint */}
          {flightInfo && !flightInfo.found && (
            <p className="text-xs px-3 py-2 rounded-xl" style={{ background: "var(--c-muted)", color: "var(--c-text3)" }}>
              Flight not found — fill in details manually.
            </p>
          )}

          {/* Route */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[11px] font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--c-text3)" }}>
                From
              </label>
              <input
                type="text"
                value={origin}
                onChange={e => setOrigin(e.target.value.toUpperCase())}
                placeholder="SFO"
                maxLength={3}
                className="w-full px-4 py-3 rounded-2xl text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2"
                style={{ background: "var(--c-muted)", color: "var(--c-text1)", border: "1px solid var(--c-border)", ["--tw-ring-color" as string]: "#4A27E8" }}
              />
            </div>
            <div className="flex items-end pb-3 text-lg" style={{ color: "var(--c-text3)" }}>→</div>
            <div className="flex-1">
              <label className="text-[11px] font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--c-text3)" }}>
                To
              </label>
              <input
                type="text"
                value={dest}
                onChange={e => setDest(e.target.value.toUpperCase())}
                placeholder="JFK"
                maxLength={3}
                className="w-full px-4 py-3 rounded-2xl text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2"
                style={{ background: "var(--c-muted)", color: "var(--c-text1)", border: "1px solid var(--c-border)", ["--tw-ring-color" as string]: "#4A27E8" }}
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--c-text3)" }}>
              Departure Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2"
              style={{ background: "var(--c-muted)", color: "var(--c-text1)", border: "1px solid var(--c-border)", ["--tw-ring-color" as string]: "#4A27E8" }}
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            onClick={submit}
            disabled={saving || !flightNum.trim()}
            className="w-full py-4 rounded-2xl text-white text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 mt-1"
            style={{ background: "linear-gradient(135deg, #4A27E8, #3418C8)" }}
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Adding flight…
              </>
            ) : "Add Flight · +200 pts"}
          </button>
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(modal, document.body) : null;
}

// ── Section Header ─────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  return (
    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
      textTransform: "uppercase", color: "var(--c-text3)", paddingLeft: "2px",
      marginBottom: "6px", marginTop: "4px" }}>
      {label}
    </p>
  );
}

// ── Active Flight Row ──────────────────────────────────────
function ActiveFlightRow({ flight }: { flight: UserFlight }) {
  const slug = flight.flight_number.toLowerCase().replace(/\s+/g, "-");
  return (
    <Link href={`/flight/${slug}`} className="block active:scale-[0.98] transition-transform">
      <div className="rounded-2xl overflow-hidden flex"
           style={{ background: "var(--c-card)", border: "1px solid var(--c-border)", minHeight: "76px" }}>
        {/* Green left accent */}
        <div style={{ width: "3px", flexShrink: 0, background: "#34D399" }} />
        <div className="flex-1 flex items-center px-4 py-3 gap-3">
          {/* Flight info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-black" style={{ color: "var(--c-text1)" }}>{flight.flight_number}</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 dark:bg-emerald-900/30 dark:text-emerald-400"
                    style={{ background: "#D1FAE5", color: "#059669" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                In Flight
              </span>
            </div>
            <p className="text-xs" style={{ color: "var(--c-text2)" }}>
              {flight.origin ?? "—"} → {flight.destination ?? "—"}
              {flight.departure_date ? ` · ${formatDate(flight.departure_date)}` : ""}
            </p>
          </div>
          {/* Chevron */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "var(--c-text3)", flexShrink: 0 }}>
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </Link>
  );
}

// ── Upcoming Flight Row ────────────────────────────────────
function UpcomingFlightRow({ flight }: { flight: UserFlight }) {
  const slug = flight.flight_number.toLowerCase().replace(/\s+/g, "-");
  return (
    <Link href={`/flight/${slug}`} className="block active:scale-[0.98] transition-transform">
      <div className="rounded-2xl flex"
           style={{ background: "var(--c-card)", border: "1px solid var(--c-border)", minHeight: "76px" }}>
        <div className="flex-1 flex items-center px-4 py-3 gap-3">
          {/* Plane icon */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: "var(--c-muted)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
                fill="#4A27E8"/>
            </svg>
          </div>
          {/* Flight info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-black" style={{ color: "var(--c-text1)" }}>{flight.flight_number}</span>
            </div>
            <p className="text-xs" style={{ color: "var(--c-text2)" }}>
              {flight.origin ?? "—"} → {flight.destination ?? "—"}
              {flight.departure_date ? ` · ${formatDate(flight.departure_date)}` : ""}
            </p>
          </div>
          {/* Chevron */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "var(--c-text3)", flexShrink: 0 }}>
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </Link>
  );
}

// ── History card (expandable) ──────────────────────────────
function HistoryCard({ flight }: { flight: typeof PAST_FLIGHTS[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
      {/* Summary row */}
      <button className="w-full p-4 text-left active:opacity-80 transition-opacity" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black" style={{ color: "var(--c-text1)" }}>{flight.number}</span>
              <span className="text-sm font-medium" style={{ color: "var(--c-text2)" }}>
                {flight.from} → {flight.to}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--c-text3)" }}>{flight.date}</p>
          </div>
          <div className="flex items-center gap-2">
            <ScoreBadge score={flight.score} />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                 style={{ color: "var(--c-text3)" }}>
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* Mini avatar strip */}
        <div className="flex items-center gap-1.5 mt-3">
          {flight.people.slice(0, 6).map((p, i) => (
            <div key={i} className={`w-8 h-8 rounded-xl ${p.color} flex items-center justify-center text-[10px] font-black flex-shrink-0`}>
              {p.initials}
            </div>
          ))}
          {flight.people.length > 6 && (
            <span className="text-[11px] font-semibold ml-1" style={{ color: "var(--c-text3)" }}>
              +{flight.people.length - 6}
            </span>
          )}
          <span className="ml-auto text-[11px]" style={{ color: "var(--c-text2)" }}>
            {flight.people.length} met
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div style={{ borderTop: "1px solid var(--c-border)" }}>
          {/* People list */}
          <div className="px-4 pt-3 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "var(--c-text3)" }}>
              People You Met
            </p>
            <div className="flex flex-col gap-2">
              {flight.people.map((p, i) => (
                <Link key={i} href="/network"
                  className="flex items-center gap-3 active:opacity-70 transition-opacity">
                  <div className={`w-9 h-9 rounded-xl ${p.color} flex items-center justify-center text-[10px] font-black flex-shrink-0`}>
                    {p.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: "var(--c-text1)" }}>{p.name}</p>
                    <p className="text-xs" style={{ color: "var(--c-text2)" }}>{p.role}</p>
                  </div>
                  <p className="text-[10px] font-semibold flex-shrink-0" style={{ color: "var(--c-text3)" }}>
                    ✈ {flight.number}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Notes */}
          {flight.notes && (
            <div className="mx-4 mb-3 px-3 py-2.5 rounded-xl" style={{ background: "var(--c-muted)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--c-text3)" }}>Notes</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--c-text2)" }}>{flight.notes}</p>
            </div>
          )}

          {/* Atlas insight */}
          <div className="mx-4 mb-4 px-3 py-2.5 rounded-xl border atlas-insight-card flight-atlas-insight">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="atlas-icon text-sm">✦</span>
              <span className="text-[10px] font-black uppercase tracking-widest atlas-label">Atlas Insight</span>
            </div>
            <p className="text-xs atlas-text-primary leading-relaxed">{flight.atlas}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function FlightPage() {
  const [tab, setTab]             = useState<"upcoming" | "history">("upcoming");
  const [flights, setFlights]     = useState<UserFlight[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const { data } = await sb
      .from("user_flights")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["upcoming", "active"])
      .order("departure_date", { ascending: true });
    setFlights((data ?? []) as UserFlight[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = (f: Omit<UserFlight, "id" | "created_at">) => {
    setFlights(prev => [...prev, { ...f, id: Math.random().toString(), created_at: new Date().toISOString() }]);
  };

  return (
    <div className="animate-fade-in pb-[80px]">
      {/* ── Header ──────────────────────────────────────── */}
      <div style={{ paddingTop: "max(20px, env(safe-area-inset-top))" }}>
        <div className="flex items-center justify-between px-4 pb-3">
          <h1 className="text-2xl font-black" style={{ color: "var(--c-text1)" }}>My Flights</h1>
          <button
            onClick={() => setShowModal(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform shadow-sm"
            style={{ background: "#4A27E8" }}
            aria-label="Add flight"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl p-1 mx-4 mb-5" style={{ background: "var(--c-muted)" }}>
          {(["upcoming", "history"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${tab === t ? "shadow-sm" : ""}`}
              style={{
                background: tab === t ? "var(--c-card)" : "transparent",
                color: tab === t ? "var(--c-text1)" : "var(--c-text3)",
              }}>
              {t === "upcoming" ? "Upcoming" : "History"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Upcoming tab ──────────────────────────────── */}
      {tab === "upcoming" && (() => {
        const activeFlight  = flights.find(f => f.status === "active");
        const upcomingList  = flights.filter(f => f.status === "upcoming");
        const hasAnyFlight  = flights.length > 0;

        if (loading) {
          return (
            <div className="px-4 flex flex-col gap-3">
              {[1, 2].map(i => (
                <div key={i} className="rounded-2xl animate-pulse" style={{ background: "var(--c-muted)", height: "76px" }} />
              ))}
            </div>
          );
        }

        if (!hasAnyFlight) {
          return (
            <EmptyState
              icon="✈️"
              title="Your runway is clear"
              body="Add your next flight to discover who's onboard and make every trip count."
              action={{ label: "Add Your First Flight", onClick: () => setShowModal(true) }}
            />
          );
        }

        return (
          <div className="px-4 flex flex-col gap-1">
            {activeFlight && (
              <>
                <SectionHeader label="In Flight Now" />
                <div className="mb-3">
                  <ActiveFlightRow flight={activeFlight} />
                </div>
              </>
            )}

            <SectionHeader label="Upcoming" />
            {upcomingList.length > 0 ? (
              <div className="flex flex-col gap-3">
                {upcomingList.map(f => <UpcomingFlightRow key={f.id} flight={f} />)}
              </div>
            ) : (
              <p className="text-xs py-6 text-center" style={{ color: "var(--c-text3)" }}>
                No upcoming flights scheduled
              </p>
            )}
          </div>
        );
      })()}

      {/* ── History tab ───────────────────────────────── */}
      {tab === "history" && (
        <div className="px-4 flex flex-col gap-4">
          {/* Lifetime stats */}
          <div className="rounded-2xl p-4 flex gap-5"
               style={{ background: "linear-gradient(135deg, #3418C8 0%, #4A27E8 100%)" }}>
            {[
              { label: "Flights",      value: "14" },
              { label: "Connections",  value: "47" },
              { label: "Avg Score",    value: "82%" },
            ].map(({ label, value }) => (
              <div key={label} className="flex-1 text-center">
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="text-[10px] text-white/60 mt-0.5 font-medium">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {PAST_FLIGHTS.map(f => <HistoryCard key={f.id} flight={f} />)}
          </div>
        </div>
      )}

      {showModal && (
        <AddFlightModal onClose={() => setShowModal(false)} onAdd={handleAdd} />
      )}
    </div>
  );
}
