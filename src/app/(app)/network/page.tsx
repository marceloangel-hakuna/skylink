"use client";

import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";

type Tab = "flight" | "connections" | "discover";

const PEOPLE = [
  { name: "Sarah Chen",    title: "CTO",           company: "Vertex AI",   industry: "Tech",        seat: "3A", mutual: 3,  status: "none" },
  { name: "Marcus Rivera", title: "Partner",        company: "KKR",         industry: "Finance",     seat: "4B", mutual: 1,  status: "pending" },
  { name: "Priya Patel",   title: "Founder",        company: "HealthOS",    industry: "Healthcare",  seat: "7C", mutual: 5,  status: "connected" },
  { name: "James Wong",    title: "VP Engineering", company: "Stripe",      industry: "Tech",        seat: "8A", mutual: 8,  status: "none" },
  { name: "Ana Souza",     title: "Director",       company: "McKinsey",    industry: "Consulting",  seat: "5D", mutual: 2,  status: "none" },
];

export default function NetworkPage() {
  const [tab, setTab] = useState<Tab>("flight");
  const [search, setSearch] = useState("");

  const filtered = PEOPLE.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.company.toLowerCase().includes(search.toLowerCase()) ||
      p.industry.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <PageHeader title="Network" />

      <div className="px-4 pt-2 pb-6 flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 21L15 15M17 11C17 14.3137 14.3137 17 11 17C7.68629 17 5 14.3137 5 11C5 7.68629 7.68629 5 11 5C14.3137 5 17 7.68629 17 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="search"
            placeholder="Search by name, company, industry…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {/* Tabs */}
        <div className="flex bg-surface-muted rounded-full p-1 gap-0.5">
          {([
            { id: "flight",      label: "On Flight" },
            { id: "connections", label: "My Network" },
            { id: "discover",    label: "Discover" },
          ] as { id: Tab; label: string }[]).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 text-xs font-semibold py-2 rounded-full transition-all ${
                tab === id ? "bg-white text-sky-700 shadow-sm" : "text-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Stats (flight tab) */}
        {tab === "flight" && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "On this flight", value: "28" },
              { label: "Business class", value: "8" },
              { label: "Your industry", value: "5" },
            ].map(({ label, value }) => (
              <div key={label} className="card text-center py-3">
                <p className="text-xl font-black text-sky-600">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* People list */}
        <div className="flex flex-col gap-3">
          {filtered.map((person) => (
            <div key={person.name} className="card flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-lg flex-shrink-0">
                {person.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-navy-900 text-sm truncate">{person.name}</p>
                  {tab === "flight" && (
                    <span className="text-xs text-slate-400 flex-shrink-0">Seat {person.seat}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{person.title} · {person.company}</p>
                <p className="text-xs text-sky-600 mt-0.5">{person.mutual} mutual · {person.industry}</p>
              </div>
              <div>
                {person.status === "connected" ? (
                  <span className="badge bg-green-100 text-green-700">Connected</span>
                ) : person.status === "pending" ? (
                  <span className="badge bg-amber-100 text-amber-700">Pending</span>
                ) : (
                  <button className="btn-primary py-2 px-3 text-xs">Connect</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
