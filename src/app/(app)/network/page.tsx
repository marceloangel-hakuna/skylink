"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

// ── Constants ──────────────────────────────────────────────────────────────────
const INTEREST_LABELS: Record<string, string> = {
  ai_ml: "AI / ML", fintech: "Fintech", climate: "Climate Tech",
  saas: "SaaS", web3: "Web3", design: "Design",
  vc: "VC", product: "Product", devtools: "DevTools", biotech: "Biotech",
};

const TAG_OPTIONS = ["Lead", "Partner", "Investor", "Friend"] as const;
type Tag = typeof TAG_OPTIONS[number];

const TAG_STYLES: Record<Tag, string> = {
  Lead:     "bg-brand-100 text-brand-600 border-brand-200",
  Partner:  "bg-violet-100 text-violet-600 border-violet-200",
  Investor: "bg-amber-100 text-amber-600 border-amber-200",
  Friend:   "bg-emerald-100 text-emerald-600 border-emerald-200",
};

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700", "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",   "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",       "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700", "bg-teal-100 text-teal-700",
];

const PLACEHOLDERS = [
  { id: "ph1", full_name: "Sarah Chen",    role: "CTO",             company: "Vertex AI",   interests: ["ai_ml","saas","product"],  match: 94 },
  { id: "ph2", full_name: "Marcus Rivera", role: "Partner",         company: "KKR",         interests: ["vc","fintech"],            match: 88 },
  { id: "ph3", full_name: "Priya Patel",   role: "Founder",         company: "HealthOS",    interests: ["biotech","saas","ai_ml"],  match: 82 },
  { id: "ph4", full_name: "James Liu",     role: "Head of Product", company: "Stripe",      interests: ["fintech","product","saas"],match: 76 },
  { id: "ph5", full_name: "Aisha Okonkwo", role: "Angel Investor",  company: "Independent", interests: ["vc","climate","web3"],     match: 71 },
  { id: "ph6", full_name: "David Park",    role: "Staff Engineer",  company: "OpenAI",      interests: ["ai_ml","devtools"],        match: 68 },
  { id: "ph7", full_name: "Elena Rossi",   role: "Design Lead",     company: "Linear",      interests: ["design","product","saas"], match: 65 },
];

// ── Types ──────────────────────────────────────────────────────────────────────
type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  company: string | null;
  interests: string[];
  match?: number;
};

type Connection = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "declined";
  met_on_flight: string | null;
  tags: string[];
  notes: string | null;
  message: string | null;
  created_at: string;
  profile?: Profile;
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function avatarColor(name: string) {
  return AVATAR_COLORS[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}
function calcMatch(mine: string[], theirs: string[], hint?: number) {
  if (hint) return hint;
  if (!mine.length || !theirs.length) return 60;
  const shared = mine.filter(i => theirs.includes(i)).length;
  const total  = new Set(mine.concat(theirs)).size;
  return Math.max(40, Math.round((shared / total) * 100));
}
function buildMessage(myName: string, them: Profile, myInterests: string[]) {
  const shared = myInterests.filter(i => (them.interests ?? []).includes(i));
  const topic  = INTEREST_LABELS[shared[0] ?? them.interests?.[0]] ?? "the industry";
  const first  = them.full_name?.split(" ")[0] ?? "there";
  const me     = myName.split(" ")[0];
  return `Hi ${first}! I noticed we're on the same flight and we're both into ${topic}. Would love to connect and swap ideas — ${me}`;
}

// ── Avatar ─────────────────────────────────────────────────────────────────────
function Avatar({ profile, size = 12 }: { profile: Profile; size?: number }) {
  const sizeClass = size === 20 ? "w-20 h-20" : size === 14 ? "w-14 h-14" : "w-12 h-12";
  const cls = `${sizeClass} rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden`;
  const textSize = size === 20 ? "text-2xl" : "text-sm";
  if (profile.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={profile.avatar_url} alt={profile.full_name ?? ""} className={`${cls} object-cover`} />;
  }
  return (
    <div className={`${cls} ${avatarColor(profile.full_name ?? "U")} ${textSize}`}>
      {initials(profile.full_name ?? "?")}
    </div>
  );
}

function MatchBadge({ pct }: { pct: number }) {
  const cls = pct >= 85 ? "bg-emerald-50 text-emerald-600 border-emerald-100"
            : pct >= 70 ? "bg-amber-50 text-amber-600 border-amber-100"
            :             "bg-zinc-100 text-zinc-500 border-zinc-200";
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 border ${cls}`}>{pct}%</span>;
}

function TagPicker({ current, onChange }: { current: string[]; onChange: (t: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TAG_OPTIONS.map(tag => {
        const on = current.includes(tag);
        return (
          <button key={tag}
            onClick={() => onChange(on ? current.filter(t => t !== tag) : [...current, tag])}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all active:scale-95 ${
              on ? TAG_STYLES[tag] : "bg-zinc-50 text-zinc-400 border-zinc-200"
            }`}>
            {tag}
          </button>
        );
      })}
    </div>
  );
}

// ── Profile Sheet (tap on Discover card) ──────────────────────────────────────
function ProfileSheet({ user, match, isConnected, isSent, onConnect, onClose }: {
  user: Profile; match: number;
  isConnected: boolean; isSent: boolean;
  onConnect: () => void; onClose: () => void;
}) {
  const sub = [user.role, user.company].filter(Boolean).join(" @ ") || "SkyLink Member";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
         onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-t-3xl w-full max-w-[430px] flex flex-col overflow-hidden"
           style={{
             background: "var(--c-card)",
             paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
             maxHeight: "88vh",
           }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--c-border)" }} />
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex flex-col">
          {/* Avatar + name */}
          <div className="px-6 pt-4 pb-5 flex flex-col items-center gap-3 text-center border-b"
               style={{ borderColor: "var(--c-border)" }}>
            <Avatar profile={user} size={20} />
            <div>
              <p className="text-xl font-black" style={{ color: "var(--c-text1)" }}>{user.full_name}</p>
              <p className="text-sm mt-1" style={{ color: "var(--c-text2)" }}>{sub}</p>
              <div className="flex justify-center mt-2">
                <MatchBadge pct={match} />
              </div>
            </div>
          </div>

          {/* Interests */}
          {(user.interests?.length ?? 0) > 0 && (
            <div className="px-6 py-4 border-b" style={{ borderColor: "var(--c-border)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5"
                 style={{ color: "var(--c-text3)" }}>Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {user.interests.map(k => (
                  <span key={k} className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ background: "var(--c-muted)", color: "var(--c-text2)" }}>
                    {INTEREST_LABELS[k] ?? k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTAs */}
        <div className="px-5 pt-4 flex flex-col gap-2.5">
          {isConnected ? (
            <div className="flex gap-2.5">
              <Link
                href={`/chat/${user.id}`}
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold text-center active:scale-95 transition-transform"
                style={{ background: "#4A27E8" }}
              >
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
            <button
              onClick={onConnect}
              className="w-full py-3 rounded-2xl text-white text-sm font-semibold active:scale-95 transition-transform"
              style={{ background: "#4A27E8" }}>
              Connect
            </button>
          )}
          <button onClick={onClose}
            className="w-full py-2.5 rounded-2xl text-sm font-semibold border"
            style={{ borderColor: "var(--c-border)", color: "var(--c-text2)" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Connect Modal (compose message) ───────────────────────────────────────────
function ConnectModal({ user, myName, myInterests, onSend, onClose, sending }: {
  user: Profile; myName: string; myInterests: string[];
  onSend: (msg: string) => void; onClose: () => void; sending: boolean;
}) {
  const [msg, setMsg] = useState(() => buildMessage(myName, user, myInterests));
  const match = calcMatch(myInterests, user.interests ?? [], user.match);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center"
         onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-t-3xl w-full max-w-[430px] p-5 flex flex-col gap-4"
           style={{ background: "var(--c-card)", paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>

        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: "var(--c-border)" }} />

        <div className="flex items-center gap-3">
          <Avatar profile={user} size={12} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm" style={{ color: "var(--c-text1)" }}>{user.full_name}</p>
            <p className="text-xs truncate" style={{ color: "var(--c-text2)" }}>
              {[user.role, user.company].filter(Boolean).join(" @ ") || "SkyLink Member"}
            </p>
          </div>
          <MatchBadge pct={match} />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-amber-500 text-sm leading-none">✦</span>
          <span className="text-[11px] font-semibold text-amber-600">Atlas suggested opening — edit freely</span>
        </div>

        <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4}
          className="w-full rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand border"
          style={{ background: "var(--c-muted)", borderColor: "var(--c-border)", color: "var(--c-text1)" }} />

        <div className="flex gap-2.5">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl border text-sm font-semibold active:scale-95 transition-transform"
            style={{ borderColor: "var(--c-border)", color: "var(--c-text2)" }}>
            Cancel
          </button>
          <button onClick={() => onSend(msg)} disabled={sending || !msg.trim()}
            className="flex-1 py-3 rounded-2xl bg-brand text-white text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
            {sending
              ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function NetworkPage() {
  const supabase = createClient();

  const [tab, setTab]                     = useState<"discover" | "network">("network");
  const [myProfile, setMyProfile]         = useState<Profile | null>(null);
  const [discoverUsers, setDiscoverUsers] = useState<Profile[]>([]);
  const [connections, setConnections]     = useState<Connection[]>([]);
  const [sentIds, setSentIds]             = useState<Set<string>>(new Set());
  const [connectedIds, setConnectedIds]   = useState<Set<string>>(new Set());
  const [loading, setLoading]             = useState(true);
  const [profileSheet, setProfileSheet]   = useState<Profile | null>(null);
  const [modalUser, setModalUser]         = useState<Profile | null>(null);
  const [sending, setSending]             = useState(false);
  const [search, setSearch]               = useState("");
  const [editingNotes, setEditingNotes]   = useState<{ id: string; notes: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: p } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, company, interests")
        .eq("id", user.id)
        .single();

      const meta = user.user_metadata ?? {};
      const me: Profile = {
        id:         user.id,
        full_name:  p?.full_name  ?? meta.full_name ?? meta.name ?? "Me",
        avatar_url: p?.avatar_url ?? meta.avatar_url ?? meta.picture ?? null,
        role:       p?.role       ?? meta.headline ?? null,
        company:    p?.company    ?? meta.company ?? null,
        interests:  p?.interests  ?? [],
      };
      setMyProfile(me);

      // Load all other users for Discover
      const { data: others } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, company, interests")
        .neq("id", user.id)
        .limit(30);

      const realIds   = new Set((others ?? []).map((u: Profile) => u.id));
      const realUsers: Profile[] = (others ?? []).map((u: Profile) => ({
        ...u, interests: u.interests ?? [],
        match: calcMatch(me.interests, u.interests ?? []),
      }));
      const extras: Profile[] = PLACEHOLDERS
        .filter(ph => !realIds.has(ph.id))
        .map(ph => ({ ...ph, avatar_url: null }));
      setDiscoverUsers([...realUsers, ...extras]);

      // Load all connections involving me
      const { data: conns } = await supabase
        .from("connections")
        .select("id, requester_id, receiver_id, status, met_on_flight, tags, notes, message, created_at")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (conns?.length) {
        // Track IDs of people with accepted connections (either direction)
        const acceptedConns = conns.filter((c: Connection) => c.status === "accepted");
        const pendingSent   = conns.filter((c: Connection) => c.requester_id === user.id && c.status === "pending");

        setConnectedIds(new Set(
          acceptedConns.map((c: Connection) =>
            c.requester_id === user.id ? c.receiver_id : c.requester_id
          )
        ));
        setSentIds(new Set(pendingSent.map((c: Connection) => c.receiver_id)));

        // Load profiles for My Network
        const otherIds = Array.from(new Set(conns.map((c: Connection) =>
          c.requester_id === user.id ? c.receiver_id : c.requester_id
        )));
        const { data: connProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, role, company, interests")
          .in("id", otherIds);
        const pMap = Object.fromEntries((connProfiles ?? []).map((x: Profile) => [x.id, x]));

        setConnections(conns.map((c: Connection) => {
          const oid = c.requester_id === user.id ? c.receiver_id : c.requester_id;
          const ph  = PLACEHOLDERS.find(ph => ph.id === oid);
          return { ...c, profile: pMap[oid] ?? (ph ? { ...ph, avatar_url: null } : undefined) };
        }));
      }

      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendRequest = useCallback(async (msg: string) => {
    if (!modalUser || !myProfile) return;
    setSending(true);
    if (modalUser.id.startsWith("ph")) {
      await new Promise(r => setTimeout(r, 700));
      setSentIds(prev => { const next = new Set(Array.from(prev)); next.add(modalUser.id); return next; });
      setSending(false); setModalUser(null); return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("connections").insert({
      requester_id: user.id, receiver_id: modalUser.id, status: "pending", message: msg,
    });
    setSentIds(prev => { const next = new Set(Array.from(prev)); next.add(modalUser.id); return next; });
    setSending(false); setModalUser(null);
  }, [modalUser, myProfile, supabase]);

  const updateTags = useCallback(async (connId: string, tags: string[]) => {
    setConnections(prev => prev.map(c => c.id === connId ? { ...c, tags } : c));
    await supabase.from("connections").update({ tags }).eq("id", connId);
  }, [supabase]);

  const saveNotes = useCallback(async (connId: string, notes: string) => {
    setConnections(prev => prev.map(c => c.id === connId ? { ...c, notes } : c));
    await supabase.from("connections").update({ notes }).eq("id", connId);
    setEditingNotes(null);
  }, [supabase]);

  const accepted = connections.filter(c => c.status === "accepted");
  const filtered = search
    ? accepted.filter(c => [c.profile?.full_name, c.profile?.role, c.profile?.company]
        .some(v => v?.toLowerCase().includes(search.toLowerCase())))
    : accepted;

  return (
    <div className="animate-fade-in pb-[80px]">

      {/* Header + tabs */}
      <div className="px-4" style={{ paddingTop: "max(20px, env(safe-area-inset-top))" }}>
        <h1 className="text-2xl font-black mb-4" style={{ color: "var(--c-text1)" }}>Network</h1>
        <div className="flex rounded-2xl p-1 mb-5" style={{ background: "var(--c-muted)" }}>
          {(["network", "discover"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                tab === t ? "shadow-sm" : ""
              }`}
              style={{
                background: tab === t ? "var(--c-card)" : "transparent",
                color: tab === t ? "var(--c-text1)" : "var(--c-text3)",
              }}>
              {t === "discover" ? "Discover" : `My Network${accepted.length ? ` (${accepted.length})` : ""}`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <svg className="animate-spin w-7 h-7 text-brand" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>

      ) : tab === "discover" ? (
        /* ── DISCOVER ─────────────────────────────────────────────────────── */
        <div className="px-4 flex flex-col gap-3">
          {discoverUsers.map((u, i) => {
            const match       = calcMatch(myProfile?.interests ?? [], u.interests ?? [], u.match);
            const isConnected = connectedIds.has(u.id);
            const isSent      = sentIds.has(u.id);

            return (
              /* Whole card is tappable → opens profile sheet */
              <button
                key={u.id ?? i}
                onClick={() => setProfileSheet(u)}
                className="rounded-2xl p-4 flex items-center gap-3 w-full text-left active:scale-[0.98] transition-transform shadow-card border"
                style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}
              >
                <Avatar profile={u} size={12} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="font-bold text-sm truncate" style={{ color: "var(--c-text1)" }}>{u.full_name}</p>
                    <MatchBadge pct={match} />
                  </div>
                  <p className="text-xs truncate" style={{ color: "var(--c-text2)" }}>
                    {[u.role, u.company].filter(Boolean).join(" @ ") || "SkyLink Member"}
                  </p>
                  {(u.interests?.length ?? 0) > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {u.interests.slice(0, 2).map(k => (
                        <span key={k} className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                              style={{ background: "var(--c-muted)", color: "var(--c-text2)" }}>
                          {INTEREST_LABELS[k] ?? k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status pill — not a button, just visual indicator */}
                <div
                  className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={
                    isConnected
                      ? { border: "1px solid #34D399", color: "#059669", background: "rgba(52,211,153,0.08)" }
                      : isSent
                      ? { border: "1px solid #34D399", color: "#059669", background: "rgba(52,211,153,0.08)" }
                      : { background: "#4A27E8", color: "white" }
                  }
                >
                  {isConnected ? "Connected" : isSent ? "Sent ✓" : "Connect"}
                </div>
              </button>
            );
          })}
        </div>

      ) : (
        /* ── MY NETWORK ───────────────────────────────────────────────────── */
        <div className="px-4 flex flex-col gap-4">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none"
                 style={{ color: "var(--c-text3)" }}>
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input type="text" placeholder="Search by name, role, or company…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand placeholder:text-zinc-400 shadow-card border"
              style={{ background: "var(--c-card)", borderColor: "var(--c-border)", color: "var(--c-text1)" }} />
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
                   style={{ background: "var(--c-muted)" }}>🤝</div>
              <p className="text-sm font-medium text-center" style={{ color: "var(--c-text2)" }}>
                {search ? "No connections match your search" : "No connections yet"}
              </p>
              {!search && (
                <button onClick={() => setTab("discover")} className="text-brand text-sm font-semibold">
                  Discover people →
                </button>
              )}
            </div>
          ) : filtered.map(conn => {
            const p = conn.profile;
            if (!p) return null;
            const isEditing = editingNotes?.id === conn.id;
            return (
              <div key={conn.id} className="rounded-2xl shadow-card p-4 flex flex-col gap-3 border"
                   style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
                <div className="flex items-center gap-3">
                  <Avatar profile={p} size={12} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: "var(--c-text1)" }}>{p.full_name}</p>
                    <p className="text-xs truncate" style={{ color: "var(--c-text2)" }}>
                      {[p.role, p.company].filter(Boolean).join(" @ ") || "SkyLink Member"}
                    </p>
                    {conn.met_on_flight && (
                      <p className="text-[10px] text-brand font-medium mt-0.5">✈ Met on {conn.met_on_flight}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/chat/${p.id}`}
                      className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                      style={{ background: "var(--c-muted)" }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
                          stroke="#4A27E8" strokeWidth="1.8" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-full">
                      Connected
                    </span>
                  </div>
                </div>

                <div className="h-px" style={{ background: "var(--c-border)" }} />

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                     style={{ color: "var(--c-text3)" }}>Tags</p>
                  <TagPicker current={conn.tags ?? []} onChange={tags => updateTags(conn.id, tags)} />
                </div>

                <div className="h-px" style={{ background: "var(--c-border)" }} />

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                     style={{ color: "var(--c-text3)" }}>Private Notes</p>
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <textarea autoFocus rows={3}
                        value={editingNotes.notes}
                        onChange={e => setEditingNotes({ id: conn.id, notes: e.target.value })}
                        placeholder="Add private notes about this connection…"
                        className="w-full rounded-xl px-3 py-2.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-brand border"
                        style={{ background: "var(--c-muted)", borderColor: "var(--c-border)", color: "var(--c-text1)" }} />
                      <div className="flex gap-2">
                        <button onClick={() => setEditingNotes(null)}
                          className="text-xs font-medium py-1.5 px-3 rounded-xl border"
                          style={{ borderColor: "var(--c-border)", color: "var(--c-text3)" }}>
                          Cancel
                        </button>
                        <button onClick={() => saveNotes(conn.id, editingNotes.notes)}
                          className="text-xs text-brand font-semibold py-1.5 px-3 rounded-xl bg-brand-50 border border-brand/20">
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setEditingNotes({ id: conn.id, notes: conn.notes ?? "" })}
                      className="w-full text-left text-xs rounded-xl px-3 py-2.5 transition-colors min-h-[38px] border"
                      style={{ background: "var(--c-muted)", borderColor: "var(--c-border)" }}>
                      {conn.notes
                        ? <span style={{ color: "var(--c-text1)" }}>{conn.notes}</span>
                        : <span style={{ color: "var(--c-text3)" }}>Tap to add private notes…</span>}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Profile Sheet (tapping a discover card) */}
      {profileSheet && !modalUser && (
        <ProfileSheet
          user={profileSheet}
          match={calcMatch(myProfile?.interests ?? [], profileSheet.interests ?? [], profileSheet.match)}
          isConnected={connectedIds.has(profileSheet.id)}
          isSent={sentIds.has(profileSheet.id)}
          onConnect={() => { setModalUser(profileSheet); setProfileSheet(null); }}
          onClose={() => setProfileSheet(null)}
        />
      )}

      {/* Connect modal (compose message) */}
      {modalUser && (
        <ConnectModal user={modalUser} myName={myProfile?.full_name ?? "Me"}
          myInterests={myProfile?.interests ?? []}
          onSend={sendRequest} onClose={() => setModalUser(null)} sending={sending} />
      )}
    </div>
  );
}
