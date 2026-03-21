import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import ConnectButton from "@/components/ConnectButton";
import AtlasIcebreakerCard from "@/components/AtlasIcebreakerCard";

export const dynamic = "force-dynamic";

const INTEREST_LABELS: Record<string, string> = {
  ai_ml: "AI / ML", fintech: "Fintech", climate: "Climate Tech",
  saas: "SaaS", web3: "Web3", design: "Design",
  vc: "VC", product: "Product", devtools: "DevTools", biotech: "Biotech",
};

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: viewerProfile },
    { data: conns },
    { count: targetConnCount },
    { count: flightCount },
    { data: viewerConns },
    { data: targetConns },
  ] = await Promise.all([
    supabase.from("profiles")
      .select("id, full_name, avatar_url, role, company, bio, interests, linkedin_url, x_handle, website_url, other_url")
      .eq("id", params.id).single(),
    supabase.from("profiles")
      .select("id, full_name, role, company, bio, interests")
      .eq("id", user.id).single(),
    supabase.from("connections")
      .select("status, requester_id, receiver_id")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`),
    supabase.from("connections")
      .select("id", { count: "exact", head: true })
      .or(`requester_id.eq.${params.id},receiver_id.eq.${params.id}`)
      .eq("status", "accepted"),
    supabase.from("flights")
      .select("id", { count: "exact", head: true })
      .eq("user_id", params.id),
    supabase.from("connections")
      .select("requester_id, receiver_id")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq("status", "accepted"),
    supabase.from("connections")
      .select("requester_id, receiver_id")
      .or(`requester_id.eq.${params.id},receiver_id.eq.${params.id}`)
      .eq("status", "accepted"),
  ]);

  if (!profile) {
    return (
      <div className="animate-fade-in pb-6">
        <PageHeader title="Profile" showBack />
        <div className="px-4 pt-8 flex flex-col items-center gap-3 text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center font-black text-3xl"
               style={{ background: "var(--c-muted)", color: "var(--c-text3)" }}>?</div>
          <p className="text-sm font-bold" style={{ color: "var(--c-text1)" }}>Profile not available</p>
          <p className="text-xs" style={{ color: "var(--c-text3)" }}>This user hasn&apos;t set up their profile yet</p>
        </div>
      </div>
    );
  }

  // Mutual connections
  const viewerIds = new Set((viewerConns ?? []).map(c =>
    c.requester_id === user.id ? c.receiver_id : c.requester_id
  ));
  const mutualCount = (targetConns ?? []).filter(c => {
    const partnerId = c.requester_id === params.id ? c.receiver_id : c.requester_id;
    return viewerIds.has(partnerId);
  }).length;

  // Connection status with viewer
  const conn = (conns ?? []).find(c =>
    (c.requester_id === user.id && c.receiver_id === params.id) ||
    (c.requester_id === params.id && c.receiver_id === user.id)
  ) ?? null;

  const isMe        = user.id === params.id;
  const isConnected = conn?.status === "accepted";
  const isSent      = conn?.status === "pending";
  const sub         = [profile.role, profile.company].filter(Boolean).join(" @ ") || "SkyLink Member";
  const inits       = initials(profile.full_name);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pr = profile as any;
  const linkedinUrl = pr.linkedin_url as string | null ?? null;
  const xHandle     = pr.x_handle     as string | null ?? null;
  const websiteUrl  = pr.website_url  as string | null ?? null;
  const otherUrl    = pr.other_url    as string | null ?? null;
  const hasLinks    = !!(linkedinUrl || xHandle || websiteUrl || otherUrl);


  return (
    <div className="animate-fade-in pb-6">
      <PageHeader title="Profile" showBack />

      <div className="px-4 pt-4 flex flex-col gap-4">

        {/* ── Hero ── */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <div className="relative">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.full_name ?? ""}
                   className="w-24 h-24 rounded-3xl object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center font-black text-3xl"
                   style={{ background: "var(--c-muted)", color: "var(--color-brand-fg)" }}>
                {inits}
              </div>
            )}
            {/* Verified badge */}
            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                 style={{ background: "#4A27E8" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <div className="text-center mt-1">
            <h2 className="text-[22px] font-black leading-tight" style={{ color: "var(--c-text1)" }}>
              {profile.full_name ?? "Unknown"}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--c-text2)" }}>{sub}</p>
          </div>
        </div>

        {/* ── Action buttons ── */}
        {!isMe && (
          <div className="flex gap-2.5">
            {isConnected ? (
              <>
                <button disabled
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-1.5"
                  style={{ background: "rgba(16,185,129,0.1)", color: "#059669", border: "1.5px solid rgba(16,185,129,0.4)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Connected
                </button>
                <Link href={`/chat/${params.id}`}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-center flex items-center justify-center"
                  style={{ background: "var(--c-muted)", color: "var(--c-text1)", border: "1.5px solid var(--c-border)" }}>
                  Message
                </Link>
              </>
            ) : isSent ? (
              <>
                <button disabled
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold opacity-60"
                  style={{ background: "var(--c-muted)", color: "var(--c-text2)", border: "1px solid var(--c-border)" }}>
                  Request Sent
                </button>
                <Link href={`/chat/${params.id}`}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-center flex items-center justify-center"
                  style={{ background: "var(--c-muted)", color: "var(--c-text1)", border: "1.5px solid var(--c-border)" }}>
                  Message
                </Link>
              </>
            ) : (
              <>
                <ConnectButton targetId={params.id} targetName={profile.full_name ?? "them"} />
                <Link href={`/chat/${params.id}`}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-center flex items-center justify-center"
                  style={{ background: "var(--c-muted)", color: "var(--c-text1)", border: "1.5px solid var(--c-border)" }}>
                  Message
                </Link>
              </>
            )}
          </div>
        )}

        {/* ── About ── */}
        {profile.bio && (
          <div className="card flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text3)" }}>About</p>
            <p className="text-[15px] leading-relaxed" style={{ color: "var(--c-text1)" }}>{profile.bio}</p>
          </div>
        )}

        {/* ── Links ── */}
        {hasLinks && (
          <div className="card flex flex-col">
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--c-text3)" }}>Links</p>
            {[
              linkedinUrl && { icon: <span className="text-sm font-black" style={{ color: "#0A66C2", fontFamily: "Georgia, serif" }}>in</span>, bg: "#EBF4FF", label: "LinkedIn", url: linkedinUrl.startsWith("http") ? linkedinUrl : `https://${linkedinUrl}`, display: linkedinUrl.replace(/^https?:\/\//, "") },
              xHandle     && { icon: <span className="text-sm font-black" style={{ color: "#000" }}>𝕏</span>, bg: "#F4F4F5", label: "X / Twitter", url: `https://x.com/${xHandle}`, display: `@${xHandle}` },
              websiteUrl  && { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "#3B82F6" }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 3C12 3 8 7 8 12s4 9 4 9M12 3c0 0 4 4 4 9s-4 9-4 9M3 12h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>, bg: "#EFF6FF", label: "Website", url: websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`, display: websiteUrl.replace(/^https?:\/\//, "") },
              otherUrl    && { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "#6B7280" }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>, bg: "#F3F4F6", label: "Link", url: otherUrl.startsWith("http") ? otherUrl : `https://${otherUrl}`, display: otherUrl.replace(/^https?:\/\//, "") },
            ].filter(Boolean).map((item, i) => item && (
              <div key={i}>
                {i > 0 && <div style={{ height: "1px", background: "var(--c-border)", marginLeft: "48px" }} />}
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-3 py-2.5 active:opacity-70 transition-opacity">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{ background: item.bg }}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--c-text1)" }}>{item.label}</p>
                    <p className="text-xs truncate" style={{ color: "var(--color-brand-fg)" }}>{item.display}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "var(--c-text3)" }}>
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              </div>
            ))}
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "CONNECTIONS", value: (targetConnCount ?? 0).toLocaleString() },
            { label: "FLIGHTS",     value: (flightCount ?? 0).toLocaleString() },
            { label: "MUTUAL",      value: mutualCount.toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} className="card text-center py-4">
              <p className="text-xl font-black" style={{ color: "var(--c-text1)" }}>{value}</p>
              <p className="text-[10px] font-semibold tracking-widest mt-0.5" style={{ color: "var(--c-text3)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── Interests ── */}
        {(profile.interests?.length ?? 0) > 0 && (
          <div className="card flex flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text3)" }}>Interests</p>
            <div className="flex flex-wrap gap-2">
              {(profile.interests ?? []).map((k: string) => (
                <span key={k}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(74,39,232,0.08)", color: "var(--color-brand-fg)", border: "1px solid rgba(74,39,232,0.15)" }}>
                  {INTEREST_LABELS[k] ?? k}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Atlas Icebreaker ── */}
        {!isMe && viewerProfile && (
          <AtlasIcebreakerCard
            viewerProfile={viewerProfile}
            targetProfile={profile}
          />
        )}

      </div>
    </div>
  );
}
