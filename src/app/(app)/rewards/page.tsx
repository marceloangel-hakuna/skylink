import PageHeader from "@/components/layout/PageHeader";
import Link from "next/link";

const TIERS = [
  { name: "Bronze",   min: 0,    max: 500,  color: "from-amber-600 to-amber-400", icon: "🥉" },
  { name: "Silver",   min: 500,  max: 1500, color: "from-slate-400 to-slate-300", icon: "🥈" },
  { name: "Gold",     min: 1500, max: 5000, color: "from-yellow-500 to-yellow-300",icon: "🥇" },
  { name: "Platinum", min: 5000, max: null, color: "from-sky-600 to-teal-400",    icon: "💎" },
];

const HISTORY = [
  { label: "First connection on SkyLink",      points: "+100", date: "Mar 10" },
  { label: "Profile completed",                 points: "+50",  date: "Mar 9" },
  { label: "5 connections made",               points: "+200", date: "Mar 8" },
  { label: "Referred a friend",                 points: "+150", date: "Mar 5" },
  { label: "Completed onboarding",             points: "+25",  date: "Mar 3" },
];

const BENEFITS = [
  { tier: "Bronze",   benefit: "Basic profile visibility",         unlocked: true },
  { tier: "Silver",   benefit: "Priority in search results",       unlocked: true },
  { tier: "Silver",   benefit: "Lounge access badge",              unlocked: true },
  { tier: "Gold",     benefit: "Pro card with contact export",     unlocked: false },
  { tier: "Gold",     benefit: "Advanced analytics",               unlocked: false },
  { tier: "Platinum", benefit: "Concierge networking",             unlocked: false },
];

export default function RewardsPage() {
  const points = 1240;
  const currentTier = TIERS.find((t) => points >= t.min && (t.max === null || points < t.max))!;
  const nextTier = TIERS[TIERS.indexOf(currentTier) + 1];
  const progress = nextTier
    ? ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Rewards" />

      <div className="px-4 pt-2 pb-6 flex flex-col gap-5">
        {/* Points card */}
        <div className={`bg-gradient-to-br ${currentTier.color} rounded-3xl p-5 text-white shadow-card-hover`}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Total Points</p>
              <p className="text-4xl font-black mt-1">{points.toLocaleString()}</p>
            </div>
            <div className="text-4xl">{currentTier.icon}</div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-white/80 mb-1.5">
              <span>{currentTier.name}</span>
              {nextTier && <span>{nextTier.name} · {(nextTier.min - points).toLocaleString()} pts away</span>}
            </div>
            <div className="w-full h-2 bg-white/30 rounded-full">
              <div
                className="h-2 bg-white rounded-full transition-all duration-700"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tiers */}
        <div>
          <h3 className="section-title mb-3">Tiers</h3>
          <div className="grid grid-cols-2 gap-2">
            {TIERS.map((tier) => {
              const active = tier.name === currentTier.name;
              return (
                <div
                  key={tier.name}
                  className={`card flex items-center gap-3 ${active ? "border-2 border-sky-400" : "opacity-60"}`}
                >
                  <span className="text-2xl">{tier.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-navy-900">{tier.name}</p>
                    <p className="text-xs text-slate-500">
                      {tier.max ? `${tier.min.toLocaleString()}–${tier.max.toLocaleString()} pts` : `${tier.min.toLocaleString()}+ pts`}
                    </p>
                  </div>
                  {active && <span className="ml-auto badge bg-sky-100 text-sky-700 text-[10px]">Current</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Benefits */}
        <div>
          <h3 className="section-title mb-3">Benefits</h3>
          <div className="flex flex-col gap-2">
            {BENEFITS.map(({ tier, benefit, unlocked }) => (
              <div key={benefit} className={`card flex items-center gap-3 ${!unlocked ? "opacity-50" : ""}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
                  unlocked ? "bg-green-100" : "bg-surface-muted"
                }`}>
                  {unlocked ? "✓" : "🔒"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-800 truncate">{benefit}</p>
                  <p className="text-xs text-slate-400">{tier} tier</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">Points History</h3>
            <Link href="/rewards/history" className="text-xs text-sky-600 font-semibold">See all</Link>
          </div>
          <div className="card flex flex-col divide-y divide-surface-border">
            {HISTORY.map(({ label, points: p, date }) => (
              <div key={label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-navy-800">{label}</p>
                  <p className="text-xs text-slate-400">{date}</p>
                </div>
                <span className="text-sm font-bold text-green-600">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
