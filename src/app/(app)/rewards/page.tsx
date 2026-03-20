"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/EmptyState";

// ── Tiers ────────────────────────────────────────────────
const TIERS = [
  { name: "Bronze",   min: 0,    max: 499,  icon: "🥉" },
  { name: "Silver",   min: 500,  max: 1499, icon: "🥈" },
  { name: "Gold",     min: 1500, max: 4999, icon: "🥇" },
  { name: "Platinum", min: 5000, max: null, icon: "💎" },
];

function getTier(pts: number) {
  return TIERS.find(t => pts >= t.min && (t.max === null || pts <= t.max)) ?? TIERS[0];
}
function nextTierInfo(pts: number) {
  const tier = getTier(pts);
  const next = TIERS[TIERS.indexOf(tier) + 1];
  if (!next) return null;
  return {
    name: next.name,
    needed: next.min - pts,
    progress: Math.min(100, ((pts - tier.min) / (next.min - tier.min)) * 100),
  };
}

// ── Deals ────────────────────────────────────────────────
type Category = "all" | "lounge" | "food" | "upgrade";

const DEALS = [
  {
    id: "lounge-1",
    category: "lounge" as Category,
    title: "Airport Lounge Access",
    subtitle: "Single Entry",
    points: 500,
    emoji: "🛋️",
    gradient: "linear-gradient(135deg, #4A27E8 0%, #6B4AF0 100%)",
    description:
      "Get complimentary access to any Priority Pass lounge on your departure day. Enjoy premium snacks, drinks, fast Wi-Fi, and a quiet space to prepare for your next meeting.",
    terms:
      "Valid for 1 person on day of travel. Must be redeemed at least 30 minutes before boarding. Subject to lounge capacity.",
    expiry: "Valid 30 days",
  },
  {
    id: "food-1",
    category: "food" as Category,
    title: "Wine Tasting",
    subtitle: "Premium Selection",
    points: 200,
    emoji: "🍷",
    gradient: "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)",
    description:
      "Enjoy a curated wine tasting at participating airport restaurants. Three premium pours selected by our in-house sommelier.",
    terms:
      "Valid at participating restaurants only. Must present QR code to staff. 21+ to redeem. Not combinable with other offers.",
    expiry: "Valid 14 days",
  },
  {
    id: "upgrade-1",
    category: "upgrade" as Category,
    title: "Seat Upgrade Voucher",
    subtitle: "Business Class",
    points: 1200,
    emoji: "✈️",
    gradient: "linear-gradient(135deg, #EAB308 0%, #F97316 100%)",
    description:
      "Upgrade your current flight to Business Class for a flat redemption. Enjoy lie-flat seats, premium dining, and priority boarding.",
    terms:
      "Must be presented to gate agent at least 45 minutes before departure. Valid on participating airlines only. One-way upgrade, subject to availability.",
    expiry: "Valid this flight",
  },
  {
    id: "food-2",
    category: "food" as Category,
    title: "Gourmet Burger Meal",
    subtitle: "Full Combo",
    points: 120,
    emoji: "🍔",
    gradient: "linear-gradient(135deg, #D97706 0%, #EAB308 100%)",
    description:
      "Redeem for a premium gourmet burger combo at any participating airport restaurant. Includes signature burger, crispy fries, and your choice of drink.",
    terms:
      "Valid at participating locations only. Single redemption per trip. No cash value or substitutions.",
    expiry: "Valid today",
  },
  {
    id: "lounge-2",
    category: "lounge" as Category,
    title: "Premium Lounge Day Pass",
    subtitle: "All-Day Access",
    points: 750,
    emoji: "🌟",
    gradient: "linear-gradient(135deg, #3418C8 0%, #4A27E8 100%)",
    description:
      "Full-day access to premium airport lounges with unlimited food and beverages, spa facilities, dedicated business suites, and shower access.",
    terms:
      "Valid for 1 person for the full day of travel. Includes meals, beverages, and spa. Must be redeemed at lounge entrance.",
    expiry: "Valid 60 days",
  },
  {
    id: "food-3",
    category: "food" as Category,
    title: "Coffee & Pastry",
    subtitle: "Morning Set",
    points: 60,
    emoji: "☕",
    gradient: "linear-gradient(135deg, #92400E 0%, #D97706 100%)",
    description:
      "Start your journey right with a specialty coffee and freshly baked pastry at any participating airport café. Espresso, flat white, or cold brew — your call.",
    terms:
      "Valid at participating cafés. One coffee and one pastry per redemption. No substitutions. No cash value.",
    expiry: "Valid today",
  },
];

// ── QR Code ──────────────────────────────────────────────
function QRCode({ seed }: { seed: number }) {
  const S = 9; // grid size
  // Deterministic pattern from seed
  const cell = (r: number, c: number): boolean => {
    // Top-left finder
    if (r < 3 && c < 3) return true;
    if (r === 3 && c <= 3) return false;
    if (c === 3 && r <= 3) return false;
    // Top-right finder
    if (r < 3 && c >= S - 3) return true;
    if (r === 3 && c >= S - 4) return false;
    if (c === S - 4 && r <= 3) return false;
    // Bottom-left finder
    if (r >= S - 3 && c < 3) return true;
    if (r === S - 4 && c <= 3) return false;
    if (c === 3 && r >= S - 4) return false;
    // Data modules
    const hash = Math.abs((seed * 1103515245 + r * 7 + c * 31) | 0);
    return !!(hash & (1 << (r + c) % 29));
  };

  return (
    <svg viewBox={`0 0 ${S * 10} ${S * 10}`} className="w-full h-full">
      <rect width="100%" height="100%" fill="white" rx="4" />
      {Array.from({ length: S }, (_, r) =>
        Array.from({ length: S }, (_, c) =>
          cell(r, c) ? (
            <rect
              key={`${r}-${c}`}
              x={c * 10 + 1} y={r * 10 + 1}
              width={8} height={8} rx={1}
              fill="#1A1A1A"
            />
          ) : null
        )
      )}
    </svg>
  );
}

// ── Deal Card ────────────────────────────────────────────
type Deal = typeof DEALS[0];

function DealCard({ deal, balance }: { deal: Deal; balance: number }) {
  const [open, setOpen] = useState(false);
  const canRedeem = balance >= deal.points;
  const seed = deal.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  return (
    <>
      {/* List card */}
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
        style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.08)" }}
      >
        <div className="flex items-center gap-4 p-4" style={{ background: "var(--c-card)", border: "1px solid var(--c-border)", borderRadius: "1rem" }}>
          {/* Icon */}
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
               style={{ background: deal.gradient }}>
            <span>{deal.emoji}</span>
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight" style={{ color: "var(--c-text1)" }}>{deal.title}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--c-text2)" }}>{deal.subtitle}</p>
          </div>
          {/* Points */}
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-black" style={{ color: canRedeem ? "#4A27E8" : "var(--c-text3)" }}>
              {deal.points.toLocaleString()}
            </p>
            <p className="text-[10px]" style={{ color: "var(--c-text3)" }}>pts</p>
          </div>
          {/* Arrow */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "var(--c-text3)", flexShrink: 0 }}>
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </button>

      {/* Detail sheet */}
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center"
             onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative rounded-t-3xl w-full max-w-[430px] overflow-hidden"
               style={{ background: "var(--c-card)", paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))" }}>

            {/* Gradient header */}
            <div className="p-5 pb-6" style={{ background: deal.gradient }}>
              <div className="flex justify-center mb-1">
                <div className="w-10 h-1 rounded-full bg-white/40" />
              </div>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-white/70 text-[10px] font-semibold uppercase tracking-widest">{deal.subtitle}</p>
                  <h3 className="text-xl font-black text-white mt-0.5">{deal.title}</h3>
                  <p className="text-white/80 text-sm font-bold mt-1">{deal.points.toLocaleString()} SkyPoints</p>
                </div>
                <div className="text-4xl">{deal.emoji}</div>
              </div>
            </div>

            <div className="px-5 flex flex-col gap-5 pt-5">
              {/* Description */}
              <p className="text-sm leading-relaxed" style={{ color: "var(--c-text2)" }}>{deal.description}</p>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-36 h-36 p-3 rounded-2xl border"
                     style={{ background: "white", borderColor: "var(--c-border)" }}>
                  <QRCode seed={seed} />
                </div>
                <p className="text-[11px] font-medium" style={{ color: "var(--c-text3)" }}>
                  Show this QR at the counter · {deal.expiry}
                </p>
              </div>

              {/* Redeem button */}
              <button
                disabled={!canRedeem}
                className="w-full py-4 rounded-2xl text-white text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ background: canRedeem ? deal.gradient : "var(--c-muted)", color: canRedeem ? "white" : "var(--c-text3)" }}
              >
                {canRedeem
                  ? `Redeem for ${deal.points.toLocaleString()} Points`
                  : `Need ${(deal.points - balance).toLocaleString()} more points`}
              </button>

              {/* Terms */}
              <div className="rounded-xl p-3" style={{ background: "var(--c-muted)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--c-text3)" }}>Terms</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--c-text2)" }}>{deal.terms}</p>
              </div>

              {/* Close */}
              <button onClick={() => setOpen(false)}
                className="text-sm font-semibold text-center py-1" style={{ color: "var(--c-text3)" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main Page ────────────────────────────────────────────
type PointRow = { amount: number; reason: string; created_at: string };

export default function RewardsPage() {
  const [balance, setBalance]   = useState<number | null>(null);
  const [history, setHistory]   = useState<PointRow[]>([]);
  const [filter, setFilter]     = useState<Category>("all");

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb
        .from("points")
        .select("amount, reason, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      const rows = (data ?? []) as PointRow[];
      setHistory(rows);
      setBalance(rows.reduce((s, r) => s + r.amount, 0));
    })();
  }, []);

  const pts  = balance ?? 0;
  const tier = getTier(pts);
  const next = nextTierInfo(pts);
  const filtered = filter === "all" ? DEALS : DEALS.filter(d => d.category === filter);

  const FILTERS: { key: Category; label: string }[] = [
    { key: "all",     label: "All" },
    { key: "lounge",  label: "Lounge" },
    { key: "food",    label: "Food" },
    { key: "upgrade", label: "Upgrade" },
  ];

  return (
    <div className="animate-fade-in pb-[80px]">
      <div className="px-4" style={{ paddingTop: "max(20px, env(safe-area-inset-top))" }}>
        <h1 className="text-2xl font-black mb-5" style={{ color: "var(--c-text1)" }}>Rewards</h1>
      </div>

      {/* ── Balance header ─────────────────────────────── */}
      <div className="mx-4 rounded-3xl overflow-hidden mb-5 rewards-balance-card"
           style={{ background: "linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)", border: "1px solid #FBCFE8" }}>
        <div className="p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest dark:text-pink-400" style={{ color: "#DB2777" }}>SkyPoints Balance</p>
              {balance === null ? (
                <div className="h-10 w-28 rounded-xl mt-1 animate-pulse dark:bg-pink-900/30" style={{ background: "#FBCFE8" }} />
              ) : (
                <p className="text-5xl font-black mt-0.5 leading-none dark:text-pink-300" style={{ color: "#9D174D" }}>
                  {pts.toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-3xl">{tier.icon}</span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full dark:bg-pink-900/40 dark:text-pink-300" style={{ background: "#FCE7F3", color: "#BE185D" }}>
                {tier.name}
              </span>
            </div>
          </div>

          {next && (
            <div>
              <div className="flex justify-between text-[11px] mb-1.5 dark:text-pink-400" style={{ color: "#DB2777" }}>
                <span>{tier.name}</span>
                <span>{next.name} · {next.needed.toLocaleString()} pts away</span>
              </div>
              <div className="w-full h-2 rounded-full dark:bg-pink-900/40" style={{ background: "#FBCFE8" }}>
                <div className="h-2 rounded-full transition-all duration-700"
                     style={{ width: `${next.progress}%`, background: "#F73D8A" }} />
              </div>
            </div>
          )}
        </div>

        {/* Earn more strip */}
        <div className="px-5 py-3 rewards-earn-strip" style={{ borderTop: "1px solid #FBCFE8", background: "#FDF2F8" }}>
          <p className="text-xs leading-relaxed dark:text-pink-400" style={{ color: "#BE185D" }}>
            Earn points by flying, connecting, and engaging.{" "}
            <span className="font-semibold dark:text-pink-300" style={{ color: "#9D174D" }}>Redeem for lounges, food, upgrades, and perks.</span>
          </p>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-5">

        {/* ── Filter pills ───────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
              style={filter === f.key
                ? { background: "#4A27E8", color: "white" }
                : { background: "var(--c-muted)", color: "var(--c-text2)", border: "1px solid var(--c-border)" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Deal cards ─────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {filtered.map(deal => (
            <DealCard key={deal.id} deal={deal} balance={pts} />
          ))}
        </div>

        {/* ── How to earn ────────────────────────────────── */}
        <div>
          <h3 className="text-[15px] font-bold mb-3" style={{ color: "var(--c-text1)" }}>How to Earn</h3>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--c-border)" }}>
            {[
              { icon: "✈️", label: "Add a flight",       pts: "+200" },
              { icon: "🤝", label: "Connect with someone", pts: "+100" },
              { icon: "👤", label: "Sign up",              pts: "+500" },
              { icon: "💬", label: "Send a message",       pts: "+10"  },
            ].map(({ icon, label, pts: p }, i, arr) => (
              <div key={label}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  background: "var(--c-card)",
                  borderBottom: i < arr.length - 1 ? "1px solid var(--c-border)" : "none",
                }}>
                <span className="text-lg w-7 text-center">{icon}</span>
                <span className="flex-1 text-sm" style={{ color: "var(--c-text1)" }}>{label}</span>
                <span className="text-sm font-bold" style={{ color: "#4A27E8" }}>{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Points history ─────────────────────────────── */}
        <div>
          <h3 className="text-[15px] font-bold mb-3" style={{ color: "var(--c-text1)" }}>Points History</h3>
          {history.length === 0 ? (
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
              <EmptyState
                icon="⭐"
                title="Start earning points"
                body="Connect with people, join crews, and complete flights to earn SkyPoints."
                className="py-10"
              />
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
              {history.slice(0, 10).map((row, i) => (
                <div key={i}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: i < Math.min(history.length, 10) - 1 ? "1px solid var(--c-border)" : "none" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--c-text1)" }}>{row.reason}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--c-text3)" }}>
                      {new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-500">+{row.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
