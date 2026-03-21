import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import EditProfileSheet from "@/components/EditProfileSheet";
import { ProfileSettingsCard } from "@/components/ProfileSettingsCard";
import { ConnectionsIcon, PlaneIcon } from "@/components/icons/AppIcons";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const meta  = user?.user_metadata ?? {};
  const uid   = user?.id ?? "";

  const [{ data: profileRow }, { count: flightCount }, { count: connCount }, { data: pointsRows }] = await Promise.all([
    supabase.from("profiles").select("full_name, role, company, bio, interests, avatar_url, linkedin_url, x_handle, website_url, other_url").eq("id", uid).single(),
    supabase.from("flights").select("id", { count: "exact", head: true }).eq("user_id", uid),
    supabase.from("connections").select("id", { count: "exact", head: true })
      .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`)
      .eq("status", "accepted"),
    supabase.from("points").select("amount").eq("user_id", uid),
  ]);

  const fullName    = profileRow?.full_name ?? meta.full_name ?? meta.name ?? "Traveler";
  const firstName   = fullName.split(" ")[0];
  const avatarUrl   = profileRow?.avatar_url ?? meta.avatar_url ?? meta.picture ?? null;
  const headline    = profileRow?.role ?? meta.headline ?? meta.job_title ?? null;
  const company     = profileRow?.company ?? meta.company ?? meta.organization ?? null;
  const bio         = profileRow?.bio ?? null;
  const interests   = (profileRow?.interests ?? []) as string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pr = profileRow as any;
  const linkedinUrl = pr?.linkedin_url as string | null ?? null;
  const xHandle     = pr?.x_handle     as string | null ?? null;
  const websiteUrl  = pr?.website_url  as string | null ?? null;
  const otherUrl    = pr?.other_url    as string | null ?? null;
  const totalPoints = (pointsRows ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0);

  const INTEREST_LABELS: Record<string, string> = {
    ai_ml: "AI / ML", fintech: "Fintech", climate: "Climate Tech",
    saas: "SaaS", web3: "Web3", design: "Design",
    vc: "VC", product: "Product", devtools: "DevTools", biotech: "Biotech",
  };

  const headlineStr = [headline, company].filter(Boolean).join(" @ ");

  return (
    <div className="animate-fade-in pb-[110px]">
      <div className="px-4" style={{ paddingTop: "max(20px, env(safe-area-inset-top))" }}>
        <h1 className="text-2xl font-black mb-4" style={{ color: "var(--c-text1)" }}>Profile</h1>
      </div>

      <div className="px-4 flex flex-col gap-4">

        {/* ── Profile hero ── */}
        <div className="card p-4">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={fullName} className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl"
                  style={{ background: "var(--c-muted)", color: "var(--color-brand)" }}
                >
                  {firstName[0]}
                </div>
              )}
              {/* Verified badge */}
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: "#4A27E8" }}
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Name + headline */}
            <div className="flex-1 min-w-0">
              <h2 className="text-[18px] font-black leading-tight" style={{ color: "var(--c-text1)" }}>{fullName}</h2>
              {headlineStr && (
                <p className="text-sm mt-0.5" style={{ color: "var(--c-text2)" }}>{headlineStr}</p>
              )}
              {bio && (
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--c-text3)" }}>{bio}</p>
              )}
              {/* Interest tags */}
              {interests.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {interests.map((key: string) => (
                    <span
                      key={key}
                      className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                      style={{ background: "var(--c-muted)", color: "var(--c-text2)", border: "1px solid var(--c-border)" }}
                    >
                      {INTEREST_LABELS[key] ?? key}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Edit button */}
            <EditProfileSheet initial={{
              fullName,
              role:        headline    ?? "",
              company:     company     ?? "",
              bio:         bio         ?? "",
              avatarUrl,
              interests,
              linkedinUrl: linkedinUrl ?? "",
              xHandle:     xHandle     ?? "",
              websiteUrl:  websiteUrl  ?? "",
              otherUrl:    otherUrl    ?? "",
            }} />
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "CONNECTIONS", value: (connCount ?? 0).toLocaleString(),   icon: <ConnectionsIcon size={20} color="var(--color-brand-fg)" /> },
            { label: "FLIGHTS",     value: (flightCount ?? 0).toLocaleString(), icon: <PlaneIcon size={20} color="var(--color-brand-fg)" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="card flex flex-col items-center py-4 gap-1.5">
              {icon}
              <p className="text-xl font-black leading-none" style={{ color: "var(--c-text1)" }}>{value}</p>
              <p className="text-[10px] font-semibold tracking-widest" style={{ color: "var(--c-text3)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── SkyPoints card ── */}
        <Link href="/rewards" className="card flex items-center gap-3 py-3.5 px-4 active:opacity-80 transition-opacity">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#4A27E8" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill="white" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold" style={{ color: "var(--c-text1)" }}>SkyPoints</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--c-text2)" }}>
              {totalPoints.toLocaleString()} pts · 12 deals
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "var(--c-text3)" }}>
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        {/* ── Settings + Account (client component handles toggles + logout) ── */}
        <ProfileSettingsCard />

      </div>
    </div>
  );
}
