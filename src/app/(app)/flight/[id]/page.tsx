"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ─── Placeholder data ─────────────────────────────────────────────────────────

const FLIGHT = {
  id: "aa-247",
  number: "AA 247",
  airline: "American Airlines",
  from: "SFO",
  fromCity: "San Francisco",
  fromGate: "B12",
  to: "JFK",
  toCity: "New York",
  toGate: "C34",
  departureTime: "10:15 AM",
  arrivalTime: "6:32 PM",
  duration: "5h 17m",
  aircraft: "B777-300ER",
  cabin: "Business",
  seat: "4A",
  altitudeFt: "36,000",
  speedMph: "541",
  progress: 0.62,
  networkingScore: 87,
  peopleCount: 14,
};

const PEOPLE = [
  { id: "1", name: "Sarah Chen",    role: "CTO",             company: "Finbridge",    initials: "SC", color: "bg-violet-100 text-violet-700",  match: 94, seat: "3A",  connected: false, mutual: 2 },
  { id: "2", name: "Marcus Rivera", role: "VC Partner",      company: "Sequoia",      initials: "MR", color: "bg-pink-100   text-pink-700",    match: 88, seat: "5C",  connected: false, mutual: 4 },
  { id: "3", name: "Priya Patel",   role: "Founder",         company: "Nexa AI",      initials: "PP", color: "bg-amber-100  text-amber-700",   match: 82, seat: "8B",  connected: true,  mutual: 1 },
  { id: "4", name: "James Liu",     role: "Head of Product", company: "Stripe",       initials: "JL", color: "bg-emerald-100 text-emerald-700",match: 76, seat: "12D", connected: false, mutual: 3 },
  { id: "5", name: "Aisha Okonkwo", role: "Angel Investor",  company: "Independent",  initials: "AO", color: "bg-sky-100    text-sky-700",     match: 71, seat: "15A", connected: false, mutual: 0 },
  { id: "6", name: "Tom Bradley",   role: "Software Eng.",   company: "Figma",        initials: "TB", color: "bg-rose-100   text-rose-700",    match: 65, seat: "18C", connected: false, mutual: 1 },
];

const INITIAL_MESSAGES = [
  { id: "1", author: "Sarah Chen",    initials: "SC", color: "bg-violet-100 text-violet-700", text: "Hey everyone! Anyone heading to the TechCrunch conference?",         time: "10:32 AM", isMe: false },
  { id: "2", author: "Marcus Rivera", initials: "MR", color: "bg-pink-100 text-pink-700",     text: "Yes! First time there — any tips on sessions to catch?",              time: "10:34 AM", isMe: false },
  { id: "3", author: "Me",            initials: "ME", color: "bg-brand text-white",           text: "Definitely the AI panel at 2pm, it's always packed 🔥",              time: "10:36 AM", isMe: true  },
  { id: "4", author: "Priya Patel",   initials: "PP", color: "bg-amber-100 text-amber-700",   text: "Great tip! The founder speed networking at 5pm is also 🙌",         time: "10:40 AM", isMe: false },
  { id: "5", author: "Sarah Chen",    initials: "SC", color: "bg-violet-100 text-violet-700", text: "Anyone want to grab coffee at the lounge before we land?",            time: "10:43 AM", isMe: false },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "people" | "chat";

type Message = {
  id: string; author: string; initials: string; color: string;
  text: string; time: string; isMe: boolean;
};

type Person = typeof PEOPLE[number];

// ─── Sub-components ───────────────────────────────────────────────────────────

function OverviewTab() {
  const p = FLIGHT.progress;
  // Quadratic bezier at t=p: B(t) = (1-t)²·P0 + 2(1-t)t·P1 + t²·P2
  // P0=(16,84), P1=(160,8), P2=(304,84)
  const bx = (1 - p) * (1 - p) * 16 + 2 * (1 - p) * p * 160 + p * p * 304;
  const by = (1 - p) * (1 - p) * 84 + 2 * (1 - p) * p * 8   + p * p * 84;
  // Tangent angle at t=p
  const tx = 2 * (1 - p) * (160 - 16) + 2 * p * (304 - 160);
  const ty = 2 * (1 - p) * (8 - 84)   + 2 * p * (84 - 8);
  const angle = Math.atan2(ty, tx) * (180 / Math.PI);

  // Circumference for networking score donut
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = circ * (FLIGHT.networkingScore / 100);

  return (
    <div className="px-4 py-5 flex flex-col gap-4">

      {/* ── Route Arc Card ───────────────────────── */}
      <div className="rounded-3xl p-5 text-white overflow-hidden relative"
           style={{ background: "linear-gradient(135deg, #3418C8 0%, #4A27E8 60%, #6B4AF0 100%)" }}>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-12 -left-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative">
          {/* Airport codes */}
          <div className="flex items-end justify-between mb-1">
            <div>
              <p className="text-[38px] font-black tracking-tight leading-none">{FLIGHT.from}</p>
              <p className="text-white/60 text-xs mt-1">{FLIGHT.fromCity}</p>
            </div>
            <div className="flex flex-col items-center pb-4">
              <p className="text-white/50 text-[10px] uppercase tracking-widest">{FLIGHT.duration}</p>
            </div>
            <div className="text-right">
              <p className="text-[38px] font-black tracking-tight leading-none">{FLIGHT.to}</p>
              <p className="text-white/60 text-xs mt-1">{FLIGHT.toCity}</p>
            </div>
          </div>

          {/* SVG arc */}
          <div className="my-1">
            <svg viewBox="0 0 320 100" fill="none" className="w-full">
              {/* full dashed arc */}
              <path d="M16 84 Q160 8 304 84"
                stroke="white" strokeOpacity="0.2" strokeWidth="1.5" fill="none" strokeDasharray="5 4"/>
              {/* progress arc — control point derived from bezier subdivision: Q_cp = (1-p)·P0 + p·P1 */}
              <path d={`M16 84 Q${(1-p)*16 + p*160} ${(1-p)*84 + p*8} ${bx} ${by}`}
                stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              {/* plane icon at current position */}
              <g transform={`translate(${bx},${by}) rotate(${angle})`}>
                <path d="M0 -5.5L9 0L0 5.5L2.5 0Z" fill="white"/>
                <path d="M-2 -2L-6 -5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M-2  2L-6  5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
              </g>
              {/* airport dots */}
              <circle cx="16"  cy="84" r="4" fill="white" fillOpacity="0.8"/>
              <circle cx="304" cy="84" r="4" fill="white" fillOpacity="0.3"/>
            </svg>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${p * 100}%` }} />
            </div>
            <span className="text-white/70 text-[10px] font-bold tabular-nums">{Math.round(p * 100)}%</span>
          </div>

          {/* Times row */}
          <div className="flex items-center justify-between pt-3 border-t border-white/15">
            <div>
              <p className="text-white/50 text-[10px] uppercase tracking-wider">Departed</p>
              <p className="text-sm font-bold">{FLIGHT.departureTime}</p>
            </div>
            <div className="text-center">
              <p className="text-white/50 text-[10px] uppercase tracking-wider">Remaining</p>
              <p className="text-sm font-bold">2h 01m</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[10px] uppercase tracking-wider">Arrives</p>
              <p className="text-sm font-bold">{FLIGHT.arrivalTime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Flight Stats Grid ────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Altitude",  value: FLIGHT.altitudeFt + " ft",   emoji: "↑" },
          { label: "Speed",     value: FLIGHT.speedMph + " mph",     emoji: "~" },
          { label: "Aircraft",  value: FLIGHT.aircraft,              emoji: "✈" },
          { label: "Gates",     value: `${FLIGHT.fromGate} → ${FLIGHT.toGate}`, emoji: "⬡" },
        ].map(s => (
          <div key={s.label} className="card flex items-center gap-3 py-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] dark:bg-[#1E1C35] flex items-center justify-center flex-shrink-0 text-brand font-black text-base">
              {s.emoji}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wide">{s.label}</p>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Networking Score (AI / Gold) ─────────── */}
      <div className="card border border-amber-200"
           style={{ background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)" }}>
        <div className="flex items-center gap-4">
          {/* Donut */}
          <div className="relative flex-shrink-0">
            <svg width="76" height="76" viewBox="0 0 76 76">
              <circle cx="38" cy="38" r={r} stroke="#FDE68A" strokeWidth="7" fill="none"/>
              <circle cx="38" cy="38" r={r} stroke="#EAB308" strokeWidth="7" fill="none"
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeLinecap="round"
                transform="rotate(-90 38 38)"/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-amber-600 leading-none">{FLIGHT.networkingScore}</span>
              <span className="text-[8px] text-amber-500 font-semibold">/ 100</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-amber-500 text-sm leading-none">✦</span>
              <span className="text-sm font-black text-amber-700">Networking Score</span>
              <span className="ml-auto text-[10px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-200 flex-shrink-0">
                AI
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2.5 leading-relaxed">
              High-value flight — {FLIGHT.peopleCount} professionals onboard, 6 strong matches
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {["Fintech", "Venture", "AI / ML"].map(tag => (
                <span key={tag} className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200/60">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Stats Row ──────────────────────── */}
      <div className="flex gap-3">
        <div className="card flex-1 text-center py-3.5">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wide">Seat</p>
          <p className="text-2xl font-black text-brand mt-0.5">{FLIGHT.seat}</p>
        </div>
        <div className="card flex-1 text-center py-3.5">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wide">Cabin</p>
          <p className="text-2xl font-black text-zinc-800 dark:text-zinc-100 mt-0.5">{FLIGHT.cabin}</p>
        </div>
        <div className="card flex-1 text-center py-3.5">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wide">Onboard</p>
          <p className="text-2xl font-black mt-0.5" style={{ color: "#34D399" }}>{FLIGHT.peopleCount}</p>
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function PeopleTab({ people, onConnect }: { people: Person[]; onConnect: (id: string) => void }) {
  const [filter, setFilter] = useState("Best Match");
  const connectedCount = people.filter(p => p.connected).length;

  return (
    <div className="px-4 py-5 flex flex-col gap-4">

      {/* Stats row */}
      <div className="flex gap-3">
        <div className="card flex-1 text-center py-3">
          <p className="text-2xl font-black" style={{ color: "#34D399" }}>{connectedCount}</p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">Connected</p>
        </div>
        <div className="card flex-1 text-center py-3">
          <p className="text-2xl font-black text-brand">{people.length}</p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">On Flight</p>
        </div>
        <div className="card flex-1 text-center py-3">
          <p className="text-2xl font-black text-amber-500">6</p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">Top Matches</p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-0.5">
        {["Best Match", "Seat", "Industry", "Mutual"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
              filter === f
                ? "bg-brand text-white shadow-sm"
                : "bg-white dark:bg-[#211F35] text-zinc-500 border border-surface-border dark:border-[#2E2C4A]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* People list */}
      {people.map(person => {
        const matchCls = person.match >= 85
          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
          : person.match >= 70
          ? "bg-amber-50 text-amber-600 border-amber-100"
          : "bg-zinc-100 text-zinc-500 border-zinc-200";

        return (
          <div key={person.id} className="card flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl ${person.color} flex items-center justify-center text-sm font-black flex-shrink-0`}>
              {person.initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{person.name}</p>
                <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${matchCls}`}>
                  {person.match}%
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{person.role} · {person.company}</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                Seat {person.seat}
                {person.mutual > 0 && ` · ${person.mutual} mutual`}
              </p>
            </div>

            <button
              onClick={() => onConnect(person.id)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-full transition-all active:scale-95 ${
                person.connected
                  ? "border text-[#059669] bg-[#34D399]/10"
                  : "text-white"
              }`}
              style={person.connected ? { borderColor: "#34D399" } : { background: "#4A27E8" }}
            >
              {person.connected ? "Connected ✓" : "Connect"}
            </button>
          </div>
        );
      })}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function ChatTab({
  messages, inputText, setInputText, onSend, messagesEndRef,
}: {
  messages: Message[];
  inputText: string;
  setInputText: (s: string) => void;
  onSend: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <>
      {/* Messages — pb clears the sticky input + nav */}
      <div className="px-4 pt-4 flex flex-col gap-3" style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px) + 72px)" }}>
        {/* Flight chat label */}
        <div className="flex justify-center">
          <span className="text-[11px] text-zinc-400 bg-white dark:bg-[#18172A] rounded-full px-3 py-1 shadow-sm border border-surface-border dark:border-[#2E2C4A]">
            {FLIGHT.number} · {FLIGHT.from} → {FLIGHT.to} · {FLIGHT.peopleCount} passengers
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
              <div className={`rounded-2xl px-3.5 py-2.5 ${
                msg.isMe
                  ? "rounded-tr-sm text-white"
                  : "rounded-tl-sm bg-white dark:bg-[#211F35] text-zinc-800 dark:text-zinc-100 shadow-sm border border-surface-border dark:border-[#2E2C4A]"
              }`}
              style={msg.isMe ? { background: "#4A27E8" } : undefined}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1 mx-0.5">{msg.time}</p>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Sticky input — above bottom nav */}
      <div
        className="sticky bg-white dark:bg-[#18172A] border-t border-surface-border dark:border-[#2E2C4A] px-4 py-3 z-30"
        style={{ bottom: "calc(64px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
            placeholder="Message the flight…"
            className="flex-1 bg-surface-muted dark:bg-[#211F35] rounded-full px-4 py-2.5 text-sm outline-none border border-transparent focus:border-brand/30 transition-colors"
          />
          <button
            onClick={onSend}
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform disabled:opacity-40"
            style={{ background: "#4A27E8" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FlightDashboardPage() {
  const params = useParams();
  const flightId = (params.id as string) ?? "unknown";

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [people, setPeople] = useState<Person[]>(PEOPLE);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Supabase client + channel refs — stable across renders
  const supabase = useRef(createClient());
  const channelRef = useRef<RealtimeChannel | null>(null);

  // ── Supabase Realtime subscription ─────────────────────────────────────────
  // Each flight gets its own broadcast channel: "flight-chat:<id>"
  // Any message sent by any passenger is received by all subscribers in real time.
  useEffect(() => {
    const channel = supabase.current
      .channel(`flight-chat:${flightId}`)
      .on("broadcast", { event: "message" }, ({ payload }) => {
        // Incoming message from another passenger — render on the left
        setMessages(prev => [...prev, { ...(payload as Message), isMe: false }]);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.current.removeChannel(channel);
    };
  }, [flightId]);

  // Scroll to bottom when chat becomes active or new message arrives
  useEffect(() => {
    if (activeTab === "chat") {
      const t = setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      return () => clearTimeout(t);
    }
  }, [activeTab, messages]);

  const handleConnect = (id: string) => {
    setPeople(prev => prev.map(p => p.id === id ? { ...p, connected: !p.connected } : p));
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const now = new Date();
    const outgoing: Message = {
      id: Date.now().toString(),
      author: "Me",
      initials: "ME",
      color: "bg-brand text-white",
      text: inputText.trim(),
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMe: true,
    };

    // Show immediately in sender's UI
    setMessages(prev => [...prev, outgoing]);
    setInputText("");

    // Broadcast to every other passenger subscribed to this flight's channel
    if (channelRef.current) {
      await channelRef.current.send({
        type: "broadcast",
        event: "message",
        payload: outgoing, // recipients receive this; their handler sets isMe: false
      });
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "people",   label: `People ${people.length}` },
    { id: "chat",     label: "Chat" },
  ];

  return (
    // Chat tab manages its own bottom spacing via sticky input + pb on messages
    <div className="animate-fade-in" style={{
      paddingBottom: activeTab === "chat"
        ? 0
        : "calc(64px + env(safe-area-inset-bottom, 0px) + 8px)"
    }}>

      {/* ── Sticky header ──────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-[var(--c-border)]" style={{ background: "var(--c-card)" }}>
        {/* Flight info bar */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-2.5">
          <Link
            href="/flight"
            className="w-8 h-8 rounded-full bg-[#F5F3FF] dark:bg-[#1E1C35] flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#4A27E8" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-zinc-900 dark:text-zinc-100">{FLIGHT.number}</span>
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                Active
              </span>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{FLIGHT.fromCity} → {FLIGHT.toCity}</p>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">ETA</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{FLIGHT.arrivalTime}</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex px-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-xs font-semibold relative transition-colors ${
                activeTab === tab.id ? "text-brand" : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-brand rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ────────────────────────── */}
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "people"   && <PeopleTab people={people} onConnect={handleConnect} />}
      {activeTab === "chat"     && (
        <ChatTab
          messages={messages}
          inputText={inputText}
          setInputText={setInputText}
          onSend={handleSend}
          messagesEndRef={messagesEndRef}
        />
      )}
    </div>
  );
}
