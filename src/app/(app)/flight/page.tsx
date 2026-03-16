"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { createPortal } from "react-dom";

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

// ── Placeholder history data ───────────────────────────────
const PAST_FLIGHTS = [
  {
    id: "h1", number: "DL 455", from: "BOS", to: "JFK",
    date: "Mar 8, 2026", score: 82,
    people: [
      { name: "Alex Kim",    role: "Designer",  initials: "AK", color: "bg-indigo-100 text-indigo-700" },
      { name: "Nina Torres", role: "PM",        initials: "NT", color: "bg-rose-100 text-rose-700"     },
      { name: "Carlos Wu",   role: "Engineer",  initials: "CW", color: "bg-teal-100 text-teal-700"     },
      { name: "Lisa Park",   role: "Marketing", initials: "LP", color: "bg-orange-100 text-orange-700" },
    ],
    notes: "Met Alex before boarding — great conversation about design systems.",
    atlas: "You have a strong overlap with Nina Torres on product strategy. Consider following up about the Stripe redesign she mentioned.",
  },
  {
    id: "h2", number: "AA 102", from: "ORD", to: "BOS",
    date: "Mar 2, 2026", score: 94,
    people: [
      { name: "Jake Stone",  role: "Investor", initials: "JS", color: "bg-violet-100 text-violet-700"  },
      { name: "Maya Lee",    role: "Founder",  initials: "ML", color: "bg-emerald-100 text-emerald-700"},
      { name: "Ryan Gold",   role: "Advisor",  initials: "RG", color: "bg-amber-100 text-amber-700"   },
    ],
    notes: "",
    atlas: "Jake Stone mentioned he's actively looking for seed-stage B2B SaaS. You should reach out with your deck.",
  },
  {
    id: "h3", number: "UA 890", from: "LAX", to: "SFO",
    date: "Feb 24, 2026", score: 71,
    people: [
      { name: "Iris Chang",  role: "Data Scientist", initials: "IC", color: "bg-indigo-100 text-indigo-700" },
      { name: "Dave Mills",  role: "Product Lead",   initials: "DM", color: "bg-orange-100 text-orange-700" },
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
  const [flightNum, setFlightNum] = useState("");
  const [origin, setOrigin]       = useState("");
  const [dest, setDest]           = useState("");
  const [date, setDate]           = useState("");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [mounted, setMounted]     = useState(false);
  useEffect(() => setMounted(true), []);

  const submit = async () => {
    if (!flightNum.trim()) { setError("Flight number is required"); return; }
    setSaving(true);
    setError(null);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setSaving(false); return; }

    const row = {
      user_id:         user.id,
      flight_number:   flightNum.trim().toUpperCase(),
      origin:          origin.trim().toUpperCase() || null,
      destination:     dest.trim().toUpperCase() || null,
      departure_date:  date || null,
      status:          "upcoming" as const,
      networking_score: 0,
      notes:           null,
    };

    const { error: dbErr } = await sb.from("user_flights").insert(row);
    if (dbErr) { setError(dbErr.message); setSaving(false); return; }

    // Award +200 points for adding a flight
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
           style={{ background: "var(--c-card)", paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))" }}>

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
            <input
              type="text"
              value={flightNum}
              onChange={e => setFlightNum(e.target.value.toUpperCase())}
              placeholder="e.g. AA 2317"
              maxLength={8}
              autoFocus
              className="w-full px-4 py-3 rounded-2xl text-sm font-mono tracking-widest focus:outline-none focus:ring-2"
              style={{ background: "var(--c-muted)", color: "var(--c-text1)", border: "1px solid var(--c-border)", ["--tw-ring-color" as string]: "#4A27E8" }}
            />
          </div>

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

// ── Flight row card (Upcoming) ─────────────────────────────
function FlightCard({ flight }: { flight: UserFlight }) {
  const slug = flight.flight_number.toLowerCase().replace(/\s+/g, "-");
  return (
    <Link href={`/flight/${slug}`} className="block active:scale-[0.98] transition-transform">
      <div className="rounded-2xl p-4" style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-black" style={{ color: "var(--c-text1)" }}>{flight.flight_number}</span>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                style={flight.status === "active"
                  ? { background: "#D1FAE5", color: "#059669" }
                  : { background: "var(--c-muted)", color: "var(--c-text2)" }}>
            {flight.status === "active" ? "● In Flight" : "Upcoming"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div>
            <p className="text-2xl font-black tracking-tight" style={{ color: "var(--c-text1)" }}>
              {flight.origin ?? "—"}
            </p>
          </div>
          <div className="flex-1 flex items-center justify-center px-2">
            <div className="w-full flex items-center gap-1">
              <div className="flex-1 border-t border-dashed" style={{ borderColor: "var(--c-border)" }} />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
                  fill="var(--c-text3)"/>
              </svg>
              <div className="flex-1 border-t border-dashed" style={{ borderColor: "var(--c-border)" }} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black tracking-tight" style={{ color: "var(--c-text1)" }}>
              {flight.destination ?? "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--c-border)" }}>
          <p className="text-xs" style={{ color: "var(--c-text2)" }}>{formatDate(flight.departure_date)}</p>
          <p className="text-xs font-semibold" style={{ color: "#4A27E8" }}>
            View Dashboard →
          </p>
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
          <div className="mx-4 mb-4 px-3 py-2.5 rounded-xl border border-amber-200 dark:border-amber-900/40"
               style={{ background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-amber-500 text-sm">✦</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Atlas Insight</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">{flight.atlas}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function FlightPage() {
  const [tab, setTab]           = useState<"upcoming" | "history">("upcoming");
  const [flights, setFlights]   = useState<UserFlight[]>([]);
  const [loading, setLoading]   = useState(true);
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
          {/* + FAB — same pattern as Chat's NewConversationButton */}
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
        <div className="flex bg-zinc-100 dark:bg-[#1A1829] rounded-2xl p-1 mx-4 mb-5">
          {(["upcoming", "history"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                tab === t ? "text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500"
              }`}
              style={tab === t ? { background: "var(--c-card)" } : {}}>
              {t === "upcoming" ? "Upcoming" : "History"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Upcoming tab ──────────────────────────────── */}
      {tab === "upcoming" && (
        <div className="px-4 flex flex-col gap-4">
          {/* Active flight hero */}
          <div className="rounded-3xl p-5 text-white overflow-hidden relative"
               style={{ background: "linear-gradient(135deg, #3418C8 0%, #4A27E8 60%, #6B4AF0 100%)" }}>
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-12 -left-6 w-32 h-32 rounded-full bg-white/5" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">Active Flight</p>
                  <p className="text-lg font-black mt-0.5">AA 2317</p>
                </div>
                <span className="bg-white/15 text-white text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  In Flight
                </span>
              </div>
              <div className="flex items-end justify-between mb-1">
                <div>
                  <p className="text-4xl font-black tracking-tight">SFO</p>
                  <p className="text-white/60 text-xs mt-0.5">San Francisco</p>
                </div>
                <div className="flex-1 mx-3 mb-3">
                  <svg viewBox="0 0 160 50" fill="none" className="w-full">
                    <path d="M8 42 Q80 4 152 42" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" fill="none" strokeDasharray="4 3"/>
                    <path d="M8 42 Q44 23 80 23" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                    <g transform="translate(80,23)">
                      <path d="M-7 0 L3 -3 L5 0 L3 3 Z M-7 -1 L-3 -5 L-2 -1 Z M-7 1 L-3 5 L-2 1 Z" fill="white"/>
                    </g>
                    <circle cx="8" cy="42" r="3" fill="white" fillOpacity="0.6"/>
                    <circle cx="152" cy="42" r="3" fill="white" fillOpacity="0.3"/>
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black tracking-tight">JFK</p>
                  <p className="text-white/60 text-xs mt-0.5">New York</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/15 mt-1">
                <div className="flex gap-5">
                  <div>
                    <p className="text-white/50 text-[10px] uppercase tracking-wider">ETA</p>
                    <p className="text-sm font-bold">4:32 PM</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-[10px] uppercase tracking-wider">Remaining</p>
                    <p className="text-sm font-bold">5h 12m</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-[10px] uppercase tracking-wider">On Board</p>
                    <p className="text-sm font-bold">12 members</p>
                  </div>
                </div>
                <Link href="/flight/aa-2317"
                  className="bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95 transition-transform">
                  Dashboard
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Upcoming flights list */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2].map(i => (
                <div key={i} className="rounded-2xl p-4 animate-pulse h-28" style={{ background: "var(--c-muted)" }} />
              ))}
            </div>
          ) : flights.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                   style={{ background: "var(--c-muted)" }}>✈️</div>
              <p className="text-sm font-semibold" style={{ color: "var(--c-text2)" }}>No upcoming flights</p>
              <button onClick={() => setShowModal(true)}
                className="text-xs font-bold px-4 py-2 rounded-full text-white"
                style={{ background: "#4A27E8" }}>
                Add your first flight
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {flights.map(f => <FlightCard key={f.id} flight={f} />)}
            </div>
          )}
        </div>
      )}

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
