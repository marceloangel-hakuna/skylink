import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/layout/PageHeader";
import LogoutButton from "@/components/auth/LogoutButton";
import Link from "next/link";
import { AppearanceRow } from "@/components/AppearanceRow";
import EditProfileSheet from "@/components/EditProfileSheet";
import { EmptyState } from "@/components/EmptyState";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const meta  = user?.user_metadata ?? {};
  const email = user?.email ?? null;

  const uid = user?.id ?? "";

  const [{ data: profileRow }, { count: flightCount }, { count: connCount }, { data: pointsRows }, { data: recentFlights }] = await Promise.all([
    supabase.from("profiles").select("full_name, role, company, bio, interests, avatar_url").eq("id", uid).single(),
    supabase.from("flights").select("id", { count: "exact", head: true }).eq("user_id", uid),
    supabase.from("connections").select("id", { count: "exact", head: true })
      .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`)
      .eq("status", "accepted"),
    supabase.from("points").select("amount").eq("user_id", uid),
    supabase.from("flights").select("flight_number, origin, destination, departure_date").eq("user_id", uid).order("departure_date", { ascending: false }).limit(3),
  ]);

  // Prefer profile table values over OAuth metadata
  const fullName    = profileRow?.full_name ?? meta.full_name ?? meta.name ?? "Traveler";
  const firstName   = fullName.split(" ")[0];
  const avatarUrl   = profileRow?.avatar_url ?? meta.avatar_url ?? meta.picture ?? null;
  const headline    = profileRow?.role ?? meta.headline ?? meta.job_title ?? null;
  const company     = profileRow?.company ?? meta.company ?? meta.organization ?? null;
  const bio         = profileRow?.bio ?? null;
  const interests   = (profileRow?.interests ?? []) as string[];
  const totalPoints = (pointsRows ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0);

  const INTEREST_LABELS: Record<string, string> = {
    ai_ml: "AI / ML", fintech: "Fintech", climate: "Climate Tech",
    saas: "SaaS", web3: "Web3", design: "Design",
    vc: "VC", product: "Product", devtools: "DevTools", biotech: "Biotech",
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Profile" />

      <div className="px-4 pt-2 pb-6 flex flex-col gap-5">
        {/* Profile hero */}
        <div className="card flex flex-col items-center text-center gap-3 py-6">
          <div className="relative">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={fullName} className="w-20 h-20 rounded-3xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-3xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-brand font-black text-3xl">
                {firstName[0]}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-white dark:border-[var(--c-card)]" />
          </div>

          <div>
            <h2 className="text-lg font-black" style={{ color: "var(--color-brand)" }}>{fullName}</h2>
            {(headline || company) && (
              <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--c-text1)" }}>
                {[headline, company].filter(Boolean).join(" · ")}
              </p>
            )}
            {email && (
              <p className="text-xs mt-1" style={{ color: "var(--c-text2)" }}>{email}</p>
            )}
            {bio && (
              <p className="text-sm mt-2 leading-relaxed max-w-[260px]" style={{ color: "var(--c-text2)" }}>{bio}</p>
            )}
          </div>
          <EditProfileSheet initial={{
            fullName:  fullName,
            role:      headline ?? "",
            company:   company  ?? "",
            bio:       bio      ?? "",
            avatarUrl: avatarUrl,
            interests: interests,
          }} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Connections", value: (connCount ?? 0).toString()                },
            { label: "Flights",     value: (flightCount ?? 0).toString()              },
            { label: "Points",      value: totalPoints.toLocaleString()               },
          ].map(({ label, value }) => (
            <div key={label} className="card text-center py-4">
              <p className="text-xl font-black" style={{ color: "#4A27E8" }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--c-text2)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Interests */}
        <div className="card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text3)" }}>Interests</p>
            <Link href="/onboarding" className="text-xs font-semibold" style={{ color: "#4A27E8" }}>Edit</Link>
          </div>
          {interests.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--c-text3)" }}>
              No interests added yet.{" "}
              <Link href="/onboarding" className="font-semibold" style={{ color: "#4A27E8" }}>Add some</Link>
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {interests.map((key: string) => (
                <span key={key}
                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ background: "var(--c-muted)", color: "var(--c-text2)" }}>
                  {INTEREST_LABELS[key] ?? key}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Flight history */}
        <div className="card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text3)" }}>Recent Flights</p>
            <Link href="/flight" className="text-xs font-semibold" style={{ color: "#4A27E8" }}>View all</Link>
          </div>
          {(recentFlights ?? []).length === 0 ? (
            <EmptyState
              icon="🗺️"
              title="No flights yet"
              body="Your flight history and the connections you made will appear here."
              action={{ label: "Add a Flight", href: "/flight" }}
              className="py-6"
            />
          ) : (
            <div className="flex flex-col divide-y divide-[var(--c-border)] -mx-4">
              {(recentFlights ?? []).map((f: { flight_number: string; origin: string | null; destination: string | null; departure_date: string | null }, i: number) => (
                <Link key={i} href="/flight"
                  className="flex items-center gap-3 px-4 py-3 active:opacity-70 transition-opacity">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{ background: "var(--c-muted)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
                        fill="#4A27E8"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: "var(--c-text1)" }}>{f.flight_number}</p>
                    <p className="text-xs" style={{ color: "var(--c-text2)" }}>
                      {[f.origin, f.destination].filter(Boolean).join(" → ") || "Route TBD"}
                    </p>
                  </div>
                  {f.departure_date && (
                    <p className="text-[11px] flex-shrink-0" style={{ color: "var(--c-text3)" }}>
                      {new Date(f.departure_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Settings menu */}
        <div className="card flex flex-col divide-y divide-[var(--c-border)]">
          {[
            { label: "Notifications",    href: "/notifications", icon: "🔔" },
            { label: "Rewards & Points", href: "/rewards",       icon: "🏆" },
            { label: "Help & Support",   href: "/help",          icon: "💬" },
          ].map(({ label, href, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 py-3.5 active:bg-surface-muted transition -mx-4 px-4 first:-mt-4 last:-mb-4 first:rounded-t-2xl last:rounded-b-2xl"
            >
              <span className="text-lg w-7 text-center">{icon}</span>
              <span className="flex-1 text-sm font-medium" style={{ color: "var(--c-text1)" }}>{label}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "var(--c-text3)" }}>
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ))}
          {/* Theme toggle row */}
          <AppearanceRow />
        </div>

        {/* Sign out */}
        <LogoutButton />
      </div>
    </div>
  );
}
