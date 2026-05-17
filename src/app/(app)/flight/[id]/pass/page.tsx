"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PassData = {
  flightNumber: string;
  origin: string;
  destination: string;
  depCity: string | null;
  arrCity: string | null;
  depTime: string | null;
  arrTime: string | null;
  gate: string | null;
  seat: string | null;
  passengerName: string;
  date: string | null;
  airline: string | null;
  terminal: string | null;
  status: string;
  flightId: string;
};

// Simple repeating barcode lines SVG
function Barcode() {
  const bars = Array.from({ length: 52 }, (_, i) => ({
    x: i * 5,
    w: i % 3 === 0 ? 3 : i % 5 === 0 ? 2 : 1,
    h: i % 7 === 0 ? 52 : i % 4 === 0 ? 44 : 56,
  }));
  return (
    <svg width="260" height="60" viewBox="0 0 260 60" fill="none">
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={(60 - b.h) / 2} width={b.w} height={b.h}
              fill="var(--c-text1)" opacity={0.85} rx="0.5" />
      ))}
    </svg>
  );
}

export default function PassPage() {
  const params  = useParams() as { id: string };
  const router  = useRouter();
  const rawSlug = params.id;

  const [pass, setPass]       = useState<PassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSeat, setEditingSeat] = useState(false);
  const [seatInput, setSeatInput]     = useState("");
  const [savingSeat, setSavingSeat]   = useState(false);
  const supabase = useRef(createClient());

  async function saveSeat() {
    if (!pass) return;
    const val = seatInput.trim().toUpperCase();
    if (!val) return;
    setSavingSeat(true);
    await supabase.current
      .from("user_flights")
      .update({ seat: val })
      .eq("id", pass.flightId);
    setPass({ ...pass, seat: val });
    setEditingSeat(false);
    setSavingSeat(false);
  }

  useEffect(() => {
    async function load() {
      const sb = supabase.current;
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setLoading(false); return; }

      const normalized = rawSlug.replace(/-/g, "").toUpperCase();
      const { data: flights } = await sb
        .from("user_flights")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["upcoming", "active", "completed"]);

      const match = (flights ?? []).find(
        (f: { flight_number: string }) =>
          f.flight_number.replace(/[\s-]/g, "").toUpperCase() === normalized
      );

      const meta = user.user_metadata ?? {};
      const fullName = meta.full_name ?? meta.name ?? "Passenger";

      if (!match) {
        setLoading(false);
        return;
      }

      // Fetch live AirLabs data
      let depCity: string | null  = null;
      let arrCity: string | null  = null;
      let depTime: string | null  = null;
      let arrTime: string | null  = null;
      let gate: string | null     = null;
      let terminal: string | null = null;
      let airline: string | null  = null;

      try {
        const res = await fetch(`/api/flight/lookup?flight=${encodeURIComponent(match.flight_number.replace(/\s+/g,""))}`);
        if (res.ok) {
          const fd = await res.json();
          if (fd.found) {
            depCity   = fd.dep_city   ?? null;
            arrCity   = fd.arr_city   ?? null;
            depTime   = fd.departure_time ?? null;
            arrTime   = fd.arrival_time   ?? null;
            gate      = fd.dep_gate   ?? null;
            terminal  = fd.dep_terminal ?? null;
            airline   = fd.airline    ?? null;
          }
        }
      } catch { /* use DB data */ }

      const dateLabel = match.departure_date
        ? new Date(match.departure_date + "T00:00:00").toLocaleDateString("en-US", {
            weekday: "short", month: "short", day: "numeric", year: "numeric",
          })
        : null;

      setPass({
        flightNumber:  match.flight_number,
        origin:        match.origin        ?? "—",
        destination:   match.destination   ?? "—",
        depCity, arrCity, depTime, arrTime, gate, terminal, airline,
        seat: match.seat ?? null,
        passengerName: fullName,
        flightId: match.id,
        date:          dateLabel,
        status:        match.status,
      });
      setLoading(false);
    }
    load();
  }, [rawSlug]);

  const statusColor = pass?.status === "active" ? "#2DD4A8"
    : pass?.status === "completed" ? "#94A3B8"
    : "#7C6AF5";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="sticky top-0 z-30" style={{ background: "var(--background)", borderBottom: "1px solid var(--c-border)" }}>
        <div style={{ height: "max(20px, env(safe-area-inset-top, 20px))" }} />
        <div className="flex items-center gap-3 px-4 pb-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
            style={{ background: "var(--c-muted)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="var(--c-text1)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <p className="text-base font-black" style={{ color: "var(--c-text1)" }}>
              {pass?.flightNumber ?? "Boarding Pass"}
            </p>
            <p className="text-xs" style={{ color: "var(--c-text2)" }}>Digital boarding confirmation</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 pb-[120px]">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 rounded-3xl animate-pulse" style={{ background: "var(--c-muted)" }} />
            ))}
          </div>
        ) : !pass ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
                 style={{ background: "var(--c-muted)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z"
                      stroke="var(--c-text3)" strokeWidth="1.8" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--c-text2)" }}>Flight not found</p>
            <button onClick={() => router.back()} className="text-sm font-semibold" style={{ color: "#7C6AF5" }}>
              Go back
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">

            {/* ── Main boarding pass card ─────── */}
            <div className="rounded-3xl overflow-hidden relative"
                 style={{
                   background: "var(--c-card)",
                   border: "1px solid var(--c-border)",
                   boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                 }}>

              {/* Purple gradient header strip */}
              <div className="px-5 pt-5 pb-4"
                   style={{ background: "linear-gradient(135deg, rgba(124,106,245,0.12) 0%, rgba(45,212,168,0.06) 100%)", borderBottom: "1px dashed var(--c-border)" }}>
                {/* Airline + flight */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "var(--c-text3)" }}>
                      {pass.airline ?? "Flight"}
                    </p>
                    <p className="text-xl font-black" style={{ color: "var(--c-text1)" }}>{pass.flightNumber}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle" style={{ background: statusColor }} />
                    {pass.status === "active" ? "In Flight" : pass.status === "completed" ? "Completed" : "Scheduled"}
                  </span>
                </div>

                {/* Origin → Destination */}
                <div className="flex items-end gap-3">
                  <div className="flex-shrink-0">
                    <p className="text-[44px] font-black tracking-tight leading-none" style={{ color: "var(--c-text1)" }}>{pass.origin}</p>
                    {pass.depCity && <p className="text-xs mt-0.5" style={{ color: "var(--c-text2)" }}>{pass.depCity}</p>}
                    {pass.depTime && <p className="text-sm font-bold mt-0.5" style={{ color: "var(--c-text1)" }}>{pass.depTime}</p>}
                  </div>

                  {/* Mini arc */}
                  <div className="relative flex-1 flex flex-col items-center" style={{ height: 52 }}>
                    <svg width="100%" height="36" viewBox="0 0 160 36" preserveAspectRatio="none" fill="none">
                      <path d="M 4 32 Q 80 4 156 32" stroke="rgba(124,106,245,0.35)" strokeWidth="1.5" strokeDasharray="5 4" fill="none"/>
                      <circle cx="4"   cy="32" r="2.5" fill="rgba(124,106,245,0.4)"/>
                      <circle cx="156" cy="32" r="2.5" fill="rgba(124,106,245,0.4)"/>
                    </svg>
                    <div className="absolute" style={{ top: -2, left: "50%", transform: "translateX(-50%)" }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center"
                           style={{ background: "rgba(124,106,245,0.15)", border: "1px solid rgba(124,106,245,0.3)" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#7C6AF5">
                          <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="text-[44px] font-black tracking-tight leading-none" style={{ color: "var(--c-text1)" }}>{pass.destination}</p>
                    {pass.arrCity && <p className="text-xs mt-0.5" style={{ color: "var(--c-text2)" }}>{pass.arrCity}</p>}
                    {pass.arrTime && <p className="text-sm font-bold mt-0.5" style={{ color: "var(--c-text1)" }}>{pass.arrTime}</p>}
                  </div>
                </div>
              </div>

              {/* Ticket details */}
              <div className="px-5 py-4">
                {/* Row 1 */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Passenger",  value: pass.passengerName, wide: true },
                    { label: "Date",       value: pass.date ?? "—",   wide: false },
                  ].map(({ label, value }) => (
                    <div key={label} className={label === "Passenger" ? "col-span-2" : "col-span-1"}>
                      <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--c-text3)" }}>{label}</p>
                      <p className="text-sm font-black truncate" style={{ color: "var(--c-text1)" }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {/* Seat — tappable to edit */}
                  <button
                    onClick={() => { setSeatInput(pass.seat ?? ""); setEditingSeat(true); }}
                    className="rounded-2xl py-3 flex flex-col items-center gap-0.5 active:scale-95 transition-transform"
                    style={{ background: pass.seat ? "var(--c-muted)" : "rgba(124,106,245,0.08)", border: pass.seat ? "1px solid var(--c-border)" : "1px dashed rgba(124,106,245,0.4)" }}>
                    <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--c-text3)" }}>Seat</p>
                    <p className="text-base font-black" style={{ color: pass.seat ? "var(--c-text1)" : "#7C6AF5" }}>
                      {pass.seat ?? "Add"}
                    </p>
                  </button>
                  {[
                    { label: "Gate",     value: pass.gate ?? "—" },
                    { label: "Terminal", value: pass.terminal ?? "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-2xl py-3 flex flex-col items-center gap-0.5"
                         style={{ background: "var(--c-muted)", border: "1px solid var(--c-border)" }}>
                      <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--c-text3)" }}>{label}</p>
                      <p className="text-base font-black" style={{ color: "var(--c-text1)" }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Barcode */}
                <div className="flex flex-col items-center gap-2 pt-4" style={{ borderTop: "1px dashed var(--c-border)" }}>
                  <Barcode />
                  <p className="text-[9px] font-mono tracking-widest" style={{ color: "var(--c-text3)" }}>
                    {pass.flightNumber.replace(/\s/g,"")}
                    {pass.origin}{pass.destination}
                    {(pass.seat ?? "").replace(/\s/g,"")}
                    {String(Math.abs(pass.passengerName.split("").reduce((a,c) => a + c.charCodeAt(0), 0))).slice(0,6)}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Note ───────────────────────────── */}
            <div className="rounded-2xl p-4 flex items-start gap-3"
                 style={{ background: "rgba(124,106,245,0.06)", border: "1px solid rgba(124,106,245,0.15)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" stroke="#7C6AF5" strokeWidth="1.8"/>
                <path d="M12 8v4M12 16h.01" stroke="#7C6AF5" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p className="text-xs leading-relaxed" style={{ color: "var(--c-text2)" }}>
                This is your SkyLink flight confirmation. Always carry your official airline boarding pass when travelling.
                {!pass.seat && " Tap the seat field above to add your seat assignment."}
              </p>
            </div>

          </div>
        )}
      </div>

      {/* Seat edit sheet */}
      {editingSeat && (
        <>
          <div className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm" onClick={() => setEditingSeat(false)} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[60] rounded-t-3xl"
               style={{ background: "var(--c-card)", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)", boxShadow: "0 -8px 40px rgba(0,0,0,0.4)" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--c-muted)" }} />
            </div>
            <div className="px-5 pt-3 pb-2">
              <p className="text-base font-black mb-1" style={{ color: "var(--c-text1)" }}>Seat Assignment</p>
              <p className="text-xs mb-4" style={{ color: "var(--c-text2)" }}>Enter your seat number from your boarding pass</p>
              <input
                type="text"
                value={seatInput}
                onChange={e => setSeatInput(e.target.value.toUpperCase())}
                placeholder="e.g. 14C"
                maxLength={5}
                autoFocus
                className="w-full rounded-2xl px-4 py-4 text-center text-2xl font-black mb-4"
                style={{ background: "var(--c-muted)", border: "1px solid var(--c-border)", color: "var(--c-text1)", outline: "none" }}
                onKeyDown={e => { if (e.key === "Enter") saveSeat(); }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingSeat(false)}
                  className="flex-1 py-3.5 rounded-2xl font-semibold text-sm"
                  style={{ background: "var(--c-muted)", color: "var(--c-text1)", border: "1px solid var(--c-border)" }}>
                  Cancel
                </button>
                <button
                  onClick={saveSeat}
                  disabled={!seatInput.trim() || savingSeat}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white disabled:opacity-50"
                  style={{ background: "#7C6AF5" }}>
                  {savingSeat ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
