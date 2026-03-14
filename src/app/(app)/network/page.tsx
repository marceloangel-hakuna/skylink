"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

// ── Constants ─────────────────────────────────────────────
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

// ── Types ─────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────
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
  const total  = new Set([...mine, ...theirs]).size;
  return Math.max(40, Math.round((shared / total) * 100));
}
function buildMessage(myName: string, them: Profile, myInterests: string[]) {
  const shared = myInterests.filter(i => (them.interests ?? []).includes(i));
  const topic  = INTEREST_LABELS[shared[0] ?? them.interests?.[0]] ?? "the industry";
  const first  = them.full_name?.split(" ")[0] ?? "there";
  const me     = myName.split(" ")[0];
  return `Hi ${first}! I noticed we're on the same flight and we're both into ${topic}. Would love to connect and swap ideas — ${me}`;
}

// ── Avatar ────────────────────────────────────────────────
function Avatar({ profile, size = 12 }: { profile: Profile; size?: number }) {
  const cls = `w-${size} h-${size} rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden`;
  if (profile.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={profile.avatar_url} alt={profile.full_name ?? ""} className={`${cls} object-cover`} />;
  }
  return (
    <div className={`${cls} ${avatarColor(profile.full_name ?? "U")}`}>
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

// ── Connect Modal ─────────────────────────────────────────
function ConnectModal({ user, myName, myInterests, onSend, onClose, sending }: {
  user: Profile; myName: string; myInterests: string[];
  onSend: (msg: string) => void; onClose: () => void; sending: boolean;
}) {
  const [msg, setMsg] = useState(() => buildMessage(myName, user, myInterests));
  const match = calcMatch(myInterests, user.interests ?? [], user.match);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
         onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#18172A] rounded-t-3xl w-full max-w-[430px] p-5 flex flex-col gap-4"
           style={{ paddingBottom: "max(28px, env(safe-area-inset-bottom))" }}>

        <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto" />

        <div className="flex items-center gap-3">
          <Avatar profile={user} size={12} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">{user.full_name}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
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
          className="w-full bg-zinc-50 dark:bg-[#211F35] rounded-2xl px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200 resize-none focus:outline-none focus:ring-2 focus:ring-brand border border-zinc-100 dark:border-[#2E2C4A]" />

        <div className="flex gap-2.5">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-zinc-200 dark:border-[#2E2C4A] text-sm font-semibold text-zinc-600 dark:text-zinc-300 active:scale-95 transition-transform">
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

// ── Main Page ─────────────────────────────────────────────
export default function NetworkPage() {
  const supabase = createClient();

  const [tab, setTab]                     = useState<"discover" | "network">("discover");
  const [myProfile, setMyProfile]         = useState<Profile | null>(null);
  const [discoverUsers, setDiscoverUsers] = useState<Profile[]>([]);
  const [connections, setConnections]     = useState<Connection[]>([]);
  const [sentIds, setSentIds]             = useState<Set<string>>(new Set());
  const [loading, setLoading]             = useState(true);
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

      const { data: others } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, company, interests")
        .neq("id", user.id)
        .limit(30);

      const realIds  = new Set((others ?? []).map((u: Profile) => u.id));
      const realUsers: Profile[] = (others ?? []).map((u: Profile) => ({
        ...u, interests: u.interests ?? [],
        match: calcMatch(me.interests, u.interests ?? []),
      }));
      const extras: Profile[] = PLACEHOLDERS
        .filter(ph => !realIds.has(ph.id))
        .map(ph => ({ ...ph, avatar_url: null }));
      setDiscoverUsers([...realUsers, ...extras]);

      const { data: conns } = await supabase
        .from("connections")
        .select("id, requester_id, receiver_id, status, met_on_flight, tags, notes, message, created_at")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (conns?.length) {
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
        setSentIds(new Set(
          conns.filter((c: Connection) => c.requester_id === user.id).map((c: Connection) => c.receiver_id)
        ));
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
      setSentIds(prev => { const s = new Set(Array.from(prev)); s.add(modalUser.id); return s; });
      setSending(false); setModalUser(null); return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("connections").insert({
      requester_id: user.id, receiver_id: modalUser.id, status: "pending", message: msg,
    });
    setSentIds(prev => { const s = new Set(Array.from(prev)); s.add(modalUser.id); return s; });
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
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mb-4">Network</h1>
        <div className="flex bg-zinc-100 dark:bg-[#211F35] rounded-2xl p-1 mb-5">
          {(["discover", "network"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                tab === t ? "bg-white dark:bg-[#18172A] text-zinc-900 dark:text-zinc-50 shadow-sm" : "text-zinc-500 dark:text-zinc-400"
              }`}>
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
        /* ── DISCOVER ──────────────────────────────────── */
        <div className="px-4 flex flex-col gap-3">
          {discoverUsers.map((u, i) => {
            const match = calcMatch(myProfile?.interests ?? [], u.interests ?? [], u.match);
            const sent  = sentIds.has(u.id);
            return (
              <div key={u.id ?? i} className="bg-[var(--c-card)] rounded-2xl shadow-card p-4 flex items-center gap-3 border border-[var(--c-border)]">
                <Avatar profile={u} size={12} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="font-bold text-zinc-900 dark:text-zinc-50 text-sm truncate">{u.full_name}</p>
                    <MatchBadge pct={match} />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {[u.role, u.company].filter(Boolean).join(" @ ") || "SkyLink Member"}
                  </p>
                  {(u.interests?.length ?? 0) > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {u.interests.slice(0, 2).map(k => (
                        <span key={k} className="text-[10px] font-medium bg-[#F5F3FF] dark:bg-[#1E1C35] text-brand px-2 py-0.5 rounded-full">
                          {INTEREST_LABELS[k] ?? k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => !sent && setModalUser(u)}
                  disabled={sent}
                  className={`flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-full transition-all active:scale-95 ${
                    sent ? "border text-[#059669] bg-[#34D399]/10" : "text-white"
                  }`}
                  style={sent ? { borderColor: "#34D399" } : { background: "#4A27E8" }}
                >
                  {sent ? "Sent ✓" : "Connect"}
                </button>
              </div>
            );
          })}
        </div>

      ) : (
        /* ── MY NETWORK ────────────────────────────────── */
        <div className="px-4 flex flex-col gap-4">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input type="text" placeholder="Search by name, role, or company…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#18172A] rounded-2xl pl-10 pr-4 py-3 text-sm border border-zinc-200 dark:border-[#2E2C4A] focus:outline-none focus:ring-2 focus:ring-brand placeholder:text-zinc-400 dark:text-zinc-200 shadow-card" />
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-[#211F35] flex items-center justify-center text-3xl">🤝</div>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium text-center">
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
              <div key={conn.id} className="bg-[var(--c-card)] rounded-2xl shadow-card p-4 flex flex-col gap-3 border border-[var(--c-border)]">
                <div className="flex items-center gap-3">
                  <Avatar profile={p} size={12} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">{p.full_name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {[p.role, p.company].filter(Boolean).join(" @ ") || "SkyLink Member"}
                    </p>
                    {conn.met_on_flight && (
                      <p className="text-[10px] text-brand font-medium mt-0.5">✈ Met on {conn.met_on_flight}</p>
                    )}
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-full flex-shrink-0">
                    Connected
                  </span>
                </div>

                <div className="h-px bg-zinc-100 dark:bg-[#2E2C4A]" />

                <div>
                  <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Tags</p>
                  <TagPicker current={conn.tags ?? []} onChange={tags => updateTags(conn.id, tags)} />
                </div>

                <div className="h-px bg-zinc-100 dark:bg-[#2E2C4A]" />

                <div>
                  <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Private Notes</p>
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <textarea autoFocus rows={3}
                        value={editingNotes.notes}
                        onChange={e => setEditingNotes({ id: conn.id, notes: e.target.value })}
                        placeholder="Add private notes about this connection…"
                        className="w-full bg-zinc-50 dark:bg-[#211F35] rounded-xl px-3 py-2.5 text-xs text-zinc-700 dark:text-zinc-300 resize-none focus:outline-none focus:ring-2 focus:ring-brand border border-zinc-100 dark:border-[#2E2C4A]" />
                      <div className="flex gap-2">
                        <button onClick={() => setEditingNotes(null)}
                          className="text-xs text-zinc-400 dark:text-zinc-500 font-medium py-1.5 px-3 rounded-xl border border-zinc-200 dark:border-[#2E2C4A]">
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
                      className="w-full text-left text-xs bg-zinc-50 dark:bg-[#211F35] rounded-xl px-3 py-2.5 active:bg-zinc-100 dark:active:bg-[#2E2C4A] transition-colors min-h-[38px] border border-zinc-100 dark:border-[#2E2C4A]">
                      {conn.notes
                        ? <span className="text-zinc-600 dark:text-zinc-300">{conn.notes}</span>
                        : <span className="text-zinc-300 dark:text-zinc-600">Tap to add private notes…</span>}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalUser && (
        <ConnectModal user={modalUser} myName={myProfile?.full_name ?? "Me"}
          myInterests={myProfile?.interests ?? []}
          onSend={sendRequest} onClose={() => setModalUser(null)} sending={sending} />
      )}
    </div>
  );
}
