import PageHeader from "@/components/layout/PageHeader";
import Link from "next/link";

const PAST_FLIGHTS = [
  {
    id: "h1", number: "DL 455", from: "BOS", to: "JFK",
    date: "Mar 8, 2026", duration: "1h 15m", points: 240,
    people: [
      { name: "Alex Kim",    role: "Designer",  initials: "AK", color: "bg-indigo-100 text-indigo-700" },
      { name: "Nina Torres", role: "PM",        initials: "NT", color: "bg-rose-100 text-rose-700"     },
      { name: "Carlos Wu",   role: "Engineer",  initials: "CW", color: "bg-teal-100 text-teal-700"     },
      { name: "Lisa Park",   role: "Marketing", initials: "LP", color: "bg-orange-100 text-orange-700" },
    ],
  },
  {
    id: "h2", number: "AA 102", from: "ORD", to: "BOS",
    date: "Mar 2, 2026", duration: "2h 40m", points: 410,
    people: [
      { name: "Jake Stone",  role: "Investor", initials: "JS", color: "bg-violet-100 text-violet-700"  },
      { name: "Maya Lee",    role: "Founder",  initials: "ML", color: "bg-emerald-100 text-emerald-700"},
      { name: "Ryan Gold",   role: "Advisor",  initials: "RG", color: "bg-amber-100 text-amber-700"   },
      { name: "Zoe Davis",   role: "CTO",      initials: "ZD", color: "bg-sky-100 text-sky-700"       },
      { name: "Ben Clark",   role: "BD",       initials: "BC", color: "bg-pink-100 text-pink-700"     },
      { name: "Fiona Wu",    role: "VC",       initials: "FW", color: "bg-teal-100 text-teal-700"     },
      { name: "Omar Hassan", role: "COO",      initials: "OH", color: "bg-rose-100 text-rose-700"     },
    ],
  },
  {
    id: "h3", number: "UA 890", from: "LAX", to: "SFO",
    date: "Feb 24, 2026", duration: "1h 20m", points: 180,
    people: [
      { name: "Iris Chang",  role: "Data Scientist", initials: "IC", color: "bg-indigo-100 text-indigo-700" },
      { name: "Dave Mills",  role: "Product Lead",   initials: "DM", color: "bg-orange-100 text-orange-700" },
      { name: "Sana Kapoor", role: "UX Designer",    initials: "SK", color: "bg-violet-100 text-violet-700" },
    ],
  },
];

export default function FlightPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="My Flights" />

      <div className="px-4 pt-2 pb-6 flex flex-col gap-5">
        {/* Add flight CTA */}
        <button className="w-full border-2 border-dashed border-sky-300 rounded-2xl p-5 flex flex-col items-center gap-2 active:bg-sky-50 transition">
          <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-sky-700">Add a flight</p>
          <p className="text-xs text-slate-500">Enter your flight number to discover connections</p>
        </button>

        {/* Upcoming */}
        <div>
          <h3 className="section-title mb-3">Upcoming</h3>
          <div className="flex flex-col gap-3">
            {[
              {
                number: "AA 247", from: "JFK", to: "LAX",
                fromCity: "New York", toCity: "Los Angeles",
                date: "Today · 2:45 PM", cabin: "Business", connections: 12,
                status: "active",
              },
              {
                number: "UA 890", from: "LAX", to: "SFO",
                fromCity: "Los Angeles", toCity: "San Francisco",
                date: "Thu, Mar 14 · 9:10 AM", cabin: "Economy", connections: 5,
                status: "upcoming",
              },
            ].map((flight) => (
              <Link key={flight.number} href={`/flight/${flight.number.toLowerCase().replace(" ", "-")}`} className="block active:scale-[0.98] transition-transform">
          <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-navy-900 text-sm">{flight.number}</span>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${flight.status === "active" ? "bg-green-100 text-green-700" : "badge-primary"}`}>
                      {flight.status === "active" ? "Active" : flight.cabin}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-xl font-black text-navy-900">{flight.from}</p>
                    <p className="text-xs text-slate-500">{flight.fromCity}</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full relative">
                      <div className="border-t border-dashed border-slate-300 w-full" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-surface-muted px-1">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z" fill="#94a3b8"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-navy-900">{flight.to}</p>
                    <p className="text-xs text-slate-500">{flight.toCity}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-surface-border flex items-center justify-between">
                  <p className="text-xs text-slate-500">{flight.date}</p>
                  <p className="text-xs text-sky-600 font-semibold">{flight.connections} nearby</p>
                </div>
              </div>
          </Link>
            ))}
          </div>
        </div>

        {/* History */}
        <div>
          <h3 className="section-title mb-3">History</h3>

          {/* Lifetime stats */}
          <div className="card border border-violet-100 mb-3"
               style={{ background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)" }}>
            <p className="text-[11px] text-violet-500 font-semibold uppercase tracking-wide mb-3">All Time</p>
            <div className="flex gap-6">
              <div>
                <p className="text-2xl font-black text-brand">14</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Flights</p>
              </div>
              <div>
                <p className="text-2xl font-black" style={{ color: "#34D399" }}>47</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Connections</p>
              </div>
              <div>
                <p className="text-2xl font-black text-amber-500">2,450</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">SkyPoints</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {PAST_FLIGHTS.map((flight) => (
              <div key={flight.id} className="card flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-zinc-900">{flight.number}</span>
                      <span className="text-sm text-zinc-500 font-medium">{flight.from} → {flight.to}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{flight.date} · {flight.duration}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <svg width="11" height="11" viewBox="0 0 24 24">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#EAB308"/>
                    </svg>
                    <span className="text-xs font-bold text-amber-600">+{flight.points} pts</span>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-zinc-400 font-semibold mb-2">
                    {flight.people.length} connections made
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {flight.people.map((person, i) => (
                      <div
                        key={i}
                        title={`${person.name} · ${person.role}`}
                        className={`w-9 h-9 rounded-xl ${person.color} flex items-center justify-center text-[10px] font-black`}
                      >
                        {person.initials}
                      </div>
                    ))}
                  </div>
                </div>

                <button className="text-xs font-semibold text-brand text-left active:opacity-60 transition-opacity">
                  View connections →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
