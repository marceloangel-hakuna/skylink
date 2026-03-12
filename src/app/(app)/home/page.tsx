import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const meta = user?.user_metadata ?? {};
  const displayName =
    meta.full_name ?? meta.name ??
    meta.given_name ??
    user?.email?.split("@")[0] ?? "Traveler";
  const avatarUrl = meta.avatar_url ?? meta.picture ?? null;
  const headline = meta.headline ?? meta.job_title ?? null;
  const company = meta.company ?? meta.organization ?? null;

  return (
    <div className="min-h-[calc(100dvh-64px)] flex flex-col items-center justify-center px-8 text-center gap-6">
      <h1 className="text-[38px] font-black tracking-tight leading-none">
        <span style={{ color: "#2B88D8" }}>Sky</span>
        <span style={{ color: "#0A1E3D" }} className="dark:text-white">Link</span>
      </h1>

      {avatarUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={displayName} className="w-20 h-20 rounded-full object-cover shadow-md" />
      )}

      <div>
        <p className="text-xl font-bold text-[#0A1E3D] dark:text-white">Welcome, {displayName}</p>
        {headline && <p className="text-sm text-slate-500 mt-0.5">{headline}</p>}
        {company && <p className="text-xs text-slate-400 mt-0.5">{company}</p>}
        {!headline && !company && <p className="text-sm text-slate-400 mt-1">You&apos;re signed in and ready to fly.</p>}
      </div>

      <LogoutButton />
    </div>
  );
}
