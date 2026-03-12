import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "Traveler";

  return (
    <div className="min-h-[calc(100dvh-64px)] flex flex-col items-center justify-center px-8 text-center gap-6">
      <h1 className="text-[38px] font-black tracking-tight leading-none">
        <span style={{ color: "#2B88D8" }}>Sky</span>
        <span style={{ color: "#0A1E3D" }} className="dark:text-white">Link</span>
      </h1>
      <div>
        <p className="text-xl font-bold text-[#0A1E3D] dark:text-white">
          Welcome, {displayName}
        </p>
        <p className="text-sm text-slate-400 mt-1">You&apos;re signed in and ready to fly.</p>
      </div>
      <LogoutButton />
    </div>
  );
}
