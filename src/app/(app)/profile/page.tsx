import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/layout/PageHeader";
import LogoutButton from "@/components/auth/LogoutButton";
import Link from "next/link";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const meta = user?.user_metadata ?? {};
  const fullName  = meta.full_name ?? meta.name ?? "Traveler";
  const firstName = fullName.split(" ")[0];
  const avatarUrl = meta.avatar_url ?? meta.picture ?? null;
  const headline  = meta.headline ?? meta.job_title ?? null;
  const company   = meta.company ?? meta.organization ?? null;
  const email     = user?.email ?? null;

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
              <div className="w-20 h-20 rounded-3xl bg-brand-100 flex items-center justify-center text-brand-600 font-black text-3xl">
                {firstName[0]}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-white" />
          </div>

          <div>
            <h2 className="text-lg font-black text-navy-800">{fullName}</h2>
            {(headline || company) && (
              <p className="text-sm text-slate-500 mt-0.5">
                {[headline, company].filter(Boolean).join(" · ")}
              </p>
            )}
            {email && (
              <p className="text-xs text-slate-400 mt-1">{email}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Connections", value: "0"   },
            { label: "Flights",     value: "0"   },
            { label: "Points",      value: "0"   },
          ].map(({ label, value }) => (
            <div key={label} className="card text-center py-4">
              <p className="text-xl font-black text-brand">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Settings menu */}
        <div className="card flex flex-col divide-y divide-surface-border">
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
              <span className="flex-1 text-sm font-medium text-navy-800">{label}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-slate-400">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ))}
        </div>

        {/* Sign out */}
        <LogoutButton />
      </div>
    </div>
  );
}
