import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import ConnectButton from "@/components/ConnectButton";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, company, bio, interests")
    .eq("id", params.id)
    .single();

  if (!profile) redirect("/network");

  // Check connection status
  const { data: conn } = await supabase
    .from("connections")
    .select("status")
    .or(`and(requester_id.eq.${user.id},receiver_id.eq.${params.id}),and(requester_id.eq.${params.id},receiver_id.eq.${user.id})`)
    .single();

  const isMe        = user.id === params.id;
  const isConnected = conn?.status === "accepted";
  const isSent      = conn?.status === "pending";
  const sub         = [profile.role, profile.company].filter(Boolean).join(" @ ") || "SkyLink Member";
  const inits       = initials(profile.full_name);

  return (
    <div className="animate-fade-in pb-[100px]">
      <PageHeader title="Profile" />

      <div className="px-4 pt-2 flex flex-col gap-4">
        {/* Hero */}
        <div className="card flex flex-col items-center text-center gap-3 py-8">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={profile.full_name ?? ""} className="w-20 h-20 rounded-3xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-violet-100 text-violet-700 flex items-center justify-center font-black text-3xl">
              {inits}
            </div>
          )}
          <div>
            <h2 className="text-xl font-black" style={{ color: "var(--c-text1)" }}>{profile.full_name ?? "Unknown"}</h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--c-text2)" }}>{sub}</p>
            {profile.bio && (
              <p className="text-sm mt-3 leading-relaxed max-w-[260px] mx-auto" style={{ color: "var(--c-text2)" }}>{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Interests */}
        {(profile.interests?.length ?? 0) > 0 && (
          <div className="card flex flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text3)" }}>Interests</p>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((k: string) => (
                <span key={k} className="text-xs font-medium px-3 py-1.5 rounded-full"
                      style={{ background: "var(--c-muted)", color: "var(--c-text2)" }}>
                  {INTEREST_LABELS[k] ?? k}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {!isMe && (
          <div className="flex flex-col gap-2.5">
            {isConnected ? (
              <div className="flex gap-2.5">
                <Link href={`/chat/${params.id}`}
                  className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold text-center"
                  style={{ background: "#4A27E8" }}>
                  Message
                </Link>
                <button disabled
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold border"
                  style={{ borderColor: "#34D399", color: "#059669" }}>
                  Connected ✓
                </button>
              </div>
            ) : isSent ? (
              <button disabled
                className="w-full py-3 rounded-2xl text-sm font-semibold border opacity-70"
                style={{ borderColor: "#34D399", color: "#059669" }}>
                Request Sent ✓
              </button>
            ) : (
              <ConnectButton targetId={params.id} targetName={profile.full_name ?? "them"} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
