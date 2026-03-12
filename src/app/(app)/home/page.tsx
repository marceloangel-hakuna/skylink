import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/layout/PageHeader";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check onboarding status
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", user.id)
      .single();

    if (!profile?.onboarding_complete) {
      redirect("/onboarding");
    }
  }

  const meta = user?.user_metadata ?? {};
  const firstName =
    (meta.full_name ?? meta.name ?? meta.given_name ?? "there").split(" ")[0];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="SkyLink"
        action={
          <Link href="/notifications" className="relative p-2 rounded-full active:bg-surface-muted transition">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </Link>
        }
      />

      <div className="px-4 pt-2 pb-6 flex flex-col gap-6">
        {/* Greeting */}
        <div>
          <p className="text-slate-500 text-sm">Good morning, {firstName}</p>
          <h2 className="text-xl font-black text-navy-900">Ready to network?</h2>
        </div>

        {/* Active flight card */}
        <Link href="/flight" className="block">
          <div className="rounded-3xl p-5 text-white shadow-card-hover" style={{ background: "linear-gradient(135deg, #0A63CA, #3e9ef8)" }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sky-200 text-xs font-medium uppercase tracking-wider">Active Flight</p>
                <p className="text-xl font-black mt-0.5">AA 247</p>
              </div>
              <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Business
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-2xl font-black">JFK</p>
                <p className="text-sky-200 text-xs mt-0.5">New York</p>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-px bg-white/30 relative">
                  <svg className="absolute -top-2 left-1/2 -translate-x-1/2" width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z" />
                  </svg>
                </div>
                <p className="text-sky-200 text-xs">5h 32m</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black">LAX</p>
                <p className="text-sky-200 text-xs mt-0.5">Los Angeles</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-sky-300 border-2 border-white flex items-center justify-center text-sky-800 text-xs font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <p className="text-sky-200 text-xs">12 connections nearby</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </Link>

        {/* Quick actions */}
        <div>
          <h3 className="section-title mb-3">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { href: "/network",       label: "Network",  color: "bg-sky-100 text-sky-700",        icon: "👥" },
              { href: "/chat",          label: "Messages", color: "bg-teal-100 text-teal-700",      icon: "💬" },
              { href: "/rewards",       label: "Rewards",  color: "bg-amber-100 text-amber-700",    icon: "🏆" },
              { href: "/profile",       label: "Profile",  color: "bg-purple-100 text-purple-700",  icon: "✨" },
            ].map(({ href, label, color, icon }) => (
              <Link key={href} href={href} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
                <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-2xl`}>
                  {icon}
                </div>
                <span className="text-xs font-medium text-slate-600 text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* People on your flight */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">On Your Flight</h3>
            <Link href="/network" className="text-xs text-sky-600 font-semibold">See all</Link>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { name: "Sarah Chen",    title: "CTO at Vertex AI",   industry: "Technology", mutual: 3 },
              { name: "Marcus Rivera", title: "Partner at KKR",      industry: "Finance",    mutual: 1 },
              { name: "Priya Patel",   title: "Founder at HealthOS", industry: "Healthcare", mutual: 5 },
            ].map((person) => (
              <div key={person.name} className="card flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-lg flex-shrink-0">
                  {person.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy-900 text-sm truncate">{person.name}</p>
                  <p className="text-xs text-slate-500 truncate">{person.title}</p>
                  <p className="text-xs text-sky-600 mt-0.5">{person.mutual} mutual connections</p>
                </div>
                <button className="btn-primary py-2 px-4 text-xs">Connect</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
