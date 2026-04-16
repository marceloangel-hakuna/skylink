"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const C = {
  teal:   "#2DD4A8",
  purple: "#7C6AF5",
  amber:  "#F5A623",
  text1:  "#F0F0F2",
  text2:  "#9399A8",
  text3:  "#5C6170",
  card:   "#161922",
  muted:  "#1E2330",
  border: "rgba(255,255,255,0.07)",
};

type SeatState = "you" | "match" | "occupied" | "empty";

type SeatData = {
  row: number;
  col: string;
  state: SeatState;
  initials?: string;
  name?: string;
  role?: string;
  company?: string;
  matchScore?: number;
  why?: string;
  userId?: string;
};

type CabinSection = {
  label: string;
  rows: number[];
  cols: string[];
};

const CABIN_LAYOUT: CabinSection[] = [
  { label: "Business class",    rows: [1,2,3,4,5,6],       cols: ["A","B","C","E","F","G"] },
  { label: "Premium economy",   rows: [10,11,12,13,14,15,16], cols: ["A","B","C","D","E","F","G","H"] },
  { label: "Economy",           rows: [20,21,22,23,24,25,26,27,28,29,30], cols: ["A","B","C","D","E","F","G","H"] },
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function assignSeat(userId: string, allSeats: Array<{ row: number; col: string }>): { row: number; col: string } {
  const seed = userId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const idx = Math.floor(seededRandom(seed) * allSeats.length);
  return allSeats[Math.max(0, Math.min(idx, allSeats.length - 1))];
}

function formatInitials(fullName: string | null): string {
  if (!fullName) return "?";
  const parts = fullName.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length-1]?.[0] ?? "") : "")).toUpperCase();
}

const AVATAR_COLORS = [
  { bg: "rgba(45,212,168,0.25)",  text: "#2DD4A8" },
  { bg: "rgba(124,106,245,0.25)", text: "#7C6AF5" },
  { bg: "rgba(245,166,35,0.25)",  text: "#F5A623" },
  { bg: "rgba(96,165,250,0.25)",  text: "#60A5FA" },
];
function acForId(id: string) { return AVATAR_COLORS[(id.charCodeAt(0) + id.charCodeAt(id.length-1)) % AVATAR_COLORS.length]; }

export default function SeatMapPage() {
  const params = useParams() as { id: string };
  const rawSlug = params.id;
  const router = useRouter();

  const [seatGrid, setSeatGrid]         = useState<Map<string, SeatData>>(new Map());
  const [loading, setLoading]           = useState(true);
  const [flightLabel, setFlightLabel]   = useState("");
  const [yourSeat, setYourSeat]         = useState<string | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<SeatData | null>(null);
  const [routeLabel, setRouteLabel]     = useState("");

  const supabase = useRef(createClient());

  useEffect(() => {
    async function load() {
      const sb = supabase.current;
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;

      const normalized = rawSlug.replace(/-/g, "").toUpperCase();
      const { data: flights } = await sb.from("user_flights").select("*").eq("user_id", user.id);
      const match = (flights ?? []).find((f: { flight_number: string }) => f.flight_number.replace(/[\s-]/g, "").toUpperCase() === normalized);
      if (!match) { setLoading(false); return; }

      setFlightLabel(`${match.flight_number} seat map`);
      setRouteLabel([match.origin, match.destination].filter(Boolean).join(" → "));

      // Fetch people on this flight
      let people: Array<{ id: string; full_name: string | null; role: string | null; company: string | null }> = [];
      try {
        const res = await fetch("/api/flight/people", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flightNumber: match.flight_number, userId: user.id }),
        });
        const data = await res.json();
        const ids: string[] = data.ids ?? [];
        if (ids.length > 0) {
          const { data: profs } = await sb.from("profiles").select("id, full_name, role, company").in("id", ids);
          people = (profs ?? []).filter((p: { id: string }) => p.id !== user.id);
        }
      } catch { /* ignore */ }

      // Build all seats list
      const allSeats: Array<{ row: number; col: string }> = [];
      for (const section of CABIN_LAYOUT) {
        for (const row of section.rows) {
          for (const col of section.cols) {
            allSeats.push({ row, col });
          }
        }
      }

      // Assign "you" a seat (deterministic)
      const yourAssigned = assignSeat(user.id, allSeats);
      const yourSeatLabel = `${yourAssigned.row}${yourAssigned.col}`;
      setYourSeat(yourSeatLabel);

      // Assign each other person a seat
      const grid = new Map<string, SeatData>();
      const usedSeats = new Set<string>();
      usedSeats.add(yourSeatLabel);

      // You
      grid.set(yourSeatLabel, { row: yourAssigned.row, col: yourAssigned.col, state: "you", initials: "You" });

      // Others (take first 6 as "matches", rest as occupied)
      const matchPeople = people.slice(0, Math.min(6, people.length));
      const occupiedCount = Math.floor(allSeats.length * 0.65); // ~65% occupancy

      for (const person of matchPeople) {
        const available = allSeats.filter(s => !usedSeats.has(`${s.row}${s.col}`));
        if (!available.length) break;
        const seat = assignSeat(person.id, available);
        const key = `${seat.row}${seat.col}`;
        usedSeats.add(key);
        const initials = formatInitials(person.full_name);
        grid.set(key, {
          row: seat.row, col: seat.col, state: "match",
          initials, name: person.full_name ?? "Traveler",
          role: person.role ?? undefined, company: person.company ?? undefined,
          matchScore: Math.floor(70 + seededRandom(person.id.charCodeAt(0)) * 25),
          why: [person.role, person.company].filter(Boolean).join(", ") || "Similar background",
          userId: person.id,
        });
      }

      // Fill occupied seats randomly
      let filled = 0;
      for (const seat of allSeats) {
        const key = `${seat.row}${seat.col}`;
        if (!usedSeats.has(key) && filled < occupiedCount) {
          if (seededRandom(seat.row * 100 + seat.col.charCodeAt(0)) < 0.6) {
            grid.set(key, { row: seat.row, col: seat.col, state: "occupied" });
            filled++;
          }
        }
      }

      setSeatGrid(grid);
      setLoading(false);
    }
    load();
  }, [rawSlug]);

  const handleSeatTap = (data: SeatData | undefined) => {
    if (!data || data.state === "occupied" || data.state === "empty" || data.state === "you") return;
    setSelectedSeat(data);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="sticky top-0 z-30" style={{ background: "var(--background)", borderBottom: `1px solid var(--c-border)` }}>
        <div style={{ height: "max(20px, env(safe-area-inset-top, 20px))" }} />
        <div className="flex items-center gap-3 px-4 pb-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
            style={{ background: "var(--c-muted)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="var(--c-text1)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-base font-black" style={{ color: C.text1 }}>{flightLabel || "Seat map"}</p>
            {routeLabel && <p className="text-xs" style={{ color: C.text2 }}>{routeLabel}</p>}
          </div>
          {yourSeat && (
            <span className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0"
                  style={{ background: "rgba(124,106,245,0.15)", color: C.purple, border: `1px solid rgba(124,106,245,0.3)` }}>
              Your seat: {yourSeat}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 px-4 pt-6">
          {[1,2,3,4,5].map(i => <div key={i} className="h-12 rounded-2xl animate-pulse" style={{ background: "var(--c-muted)" }} />)}
        </div>
      ) : (
        <div className="px-4 pb-[110px] pt-4">
          {/* Legend */}
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            {[
              { label: "You", color: C.purple, fill: true },
              { label: "AI match", color: C.teal, fill: true },
              { label: "Occupied", color: "var(--c-muted)", fill: true },
              { label: "Empty", color: "transparent", fill: false },
            ].map(({ label, color, fill }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm"
                     style={{ background: fill ? color : "transparent", border: fill ? `1px solid ${color}` : `1.5px dashed ${C.text3}` }} />
                <span className="text-[11px]" style={{ color: C.text2 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Seat grid */}
          <div className="rounded-2xl overflow-hidden p-4" style={{ background: "var(--c-card)", border: `1px solid ${C.border}` }}>
            {CABIN_LAYOUT.map((section) => (
              <div key={section.label} className="mb-4 last:mb-0">
                {/* Class label */}
                <p className="text-xs font-semibold mb-2" style={{ color: C.text3 }}>{section.label}</p>

                {/* Col headers */}
                <div className="flex items-center mb-1" style={{ gap: 4 }}>
                  <div style={{ width: 28 }} />
                  {section.cols.map(col => (
                    <div key={col} className="text-center text-[10px] font-semibold flex-1" style={{ color: C.text3 }}>{col}</div>
                  ))}
                </div>

                {/* Rows */}
                {section.rows.map(row => (
                  <div key={row} className="flex items-center" style={{ gap: 4, marginBottom: 4 }}>
                    {/* Row number */}
                    <div className="text-[10px] font-semibold text-right flex-shrink-0" style={{ width: 28, color: C.text3 }}>{row}</div>

                    {section.cols.map((col, colIdx) => {
                      // Aisle gap after 3rd column for most configs
                      const isAisle = colIdx === 3 && section.cols.length > 6;
                      const key = `${row}${col}`;
                      const data = seatGrid.get(key);
                      const state = data?.state ?? "empty";

                      const seatStyle: React.CSSProperties = {
                        flex: 1,
                        height: 32,
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        fontWeight: 700,
                        cursor: state === "match" ? "pointer" : "default",
                        marginLeft: isAisle ? 8 : 0,
                        transition: "transform 0.1s",
                        ...(state === "you"      ? { background: C.purple, color: "white" } :
                           state === "match"     ? { background: `rgba(45,212,168,0.25)`, color: C.teal, border: `1.5px solid ${C.teal}` } :
                           state === "occupied"  ? { background: "var(--c-muted)", color: C.text3 } :
                                                   { background: "transparent", border: `1.5px dashed ${C.border}`, color: C.text3 }),
                      };

                      return (
                        <div key={col} style={seatStyle}
                             onClick={() => handleSeatTap(data)}
                             className={state === "match" ? "active:scale-95" : ""}>
                          {state === "you"     ? "You" :
                           state === "match"   ? (data?.initials ?? "?") :
                           "—"}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="flex items-start gap-2 mt-4 px-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" stroke={C.text3} strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke={C.text3} strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p className="text-[11px] leading-relaxed" style={{ color: C.text3 }}>
              Tap a green seat to see match details. Only opt-in passengers are shown.
            </p>
          </div>
        </div>
      )}

      {/* Match detail sheet */}
      {selectedSeat && (
        <>
          <div className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm" onClick={() => setSelectedSeat(null)} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[60] rounded-t-3xl"
               style={{ background: "var(--c-card)", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)", boxShadow: "0 -8px 40px rgba(0,0,0,0.4)" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--c-muted)" }} />
            </div>
            <div className="px-5 pt-3 pb-2">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-base font-black flex-shrink-0"
                     style={{ background: selectedSeat.userId ? acForId(selectedSeat.userId).bg : "var(--c-muted)", color: selectedSeat.userId ? acForId(selectedSeat.userId).text : C.text2 }}>
                  {selectedSeat.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-black" style={{ color: C.text1 }}>{selectedSeat.name}</p>
                  <p className="text-sm" style={{ color: C.text2 }}>{[selectedSeat.role, selectedSeat.company].filter(Boolean).join(" · ")}</p>
                </div>
                {selectedSeat.matchScore && (
                  <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2"
                       style={{ borderColor: C.teal, color: C.teal }}>
                    <span className="text-sm font-black">{selectedSeat.matchScore}</span>
                  </div>
                )}
              </div>
              {selectedSeat.why && (
                <div className="rounded-2xl p-3.5 mb-4" style={{ background: "var(--c-muted)" }}>
                  <p className="text-xs leading-relaxed" style={{ color: C.text2 }}>
                    <span className="font-semibold" style={{ color: C.text1 }}>Why: </span>{selectedSeat.why}
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                {selectedSeat.userId && (
                  <button
                    onClick={() => { setSelectedSeat(null); router.push(`/profile/${selectedSeat.userId}`); }}
                    className="flex-1 py-3.5 rounded-2xl font-semibold text-sm"
                    style={{ background: "var(--c-muted)", color: C.text1, border: `1px solid ${C.border}` }}>
                    View profile
                  </button>
                )}
                <button
                  onClick={() => setSelectedSeat(null)}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white"
                  style={{ background: C.purple }}>
                  Connect
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
