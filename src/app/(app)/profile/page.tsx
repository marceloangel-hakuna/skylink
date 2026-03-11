import PageHeader from "@/components/layout/PageHeader";
import Link from "next/link";

export default function ProfilePage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Profile"
        action={
          <Link href="/profile/edit" className="p-2 rounded-full text-slate-500 active:bg-surface-muted transition">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        }
      />

      <div className="px-4 pt-2 pb-6 flex flex-col gap-5">
        {/* Profile hero */}
        <div className="card flex flex-col items-center text-center gap-3 py-6">
          <div className="w-20 h-20 rounded-3xl bg-sky-100 flex items-center justify-center text-sky-700 font-black text-3xl relative">
            J
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-400 border-2 border-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-navy-900">Jane Smith</h2>
            <p className="text-sm text-slate-500">VP of Product · Acme Corp</p>
          </div>
          <div className="flex gap-2">
            <span className="badge-primary">Technology</span>
            <span className="badge bg-purple-100 text-purple-700">Product</span>
          </div>
          <p className="text-sm text-slate-600 max-w-[260px] leading-relaxed">
            Building products that matter. Always happy to chat about AI, growth, and entrepreneurship at altitude.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Connections", value: "47" },
            { label: "Flights",     value: "23" },
            { label: "Points",      value: "1,240" },
          ].map(({ label, value }) => (
            <div key={label} className="card text-center py-4">
              <p className="text-xl font-black text-sky-600">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Settings */}
        <div className="card flex flex-col divide-y divide-surface-border">
          {[
            { label: "Notifications",    href: "/notifications",    icon: "🔔" },
            { label: "Rewards & Points", href: "/rewards",          icon: "🏆" },
            { label: "Privacy Settings", href: "/profile/privacy",  icon: "🔒" },
            { label: "LinkedIn",         href: "/profile/linkedin", icon: "💼" },
            { label: "Help & Support",   href: "/help",             icon: "💬" },
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
        <button className="w-full py-3.5 text-sm font-semibold text-red-500 bg-red-50 rounded-2xl active:bg-red-100 transition">
          Sign Out
        </button>
      </div>
    </div>
  );
}
