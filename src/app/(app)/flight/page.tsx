import PageHeader from "@/components/layout/PageHeader";

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
              <div key={flight.number} className="card">
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
            ))}
          </div>
        </div>

        {/* Past flights */}
        <div>
          <h3 className="section-title mb-3">Past Flights</h3>
          <div className="flex flex-col gap-2">
            {[
              { number: "DL 455", route: "BOS → JFK", date: "Mar 8", connections: 4 },
              { number: "AA 102", route: "ORD → BOS", date: "Mar 2", connections: 7 },
            ].map((f) => (
              <div key={f.number} className="card flex items-center gap-3 opacity-60">
                <div className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center text-slate-400 flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-navy-800">{f.number} · {f.route}</p>
                  <p className="text-xs text-slate-500">{f.date} · {f.connections} connections made</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
