import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { redirect } from "next/navigation";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now  = new Date();
  const diffMs    = now.getTime() - date.getTime();
  const diffMins  = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays  = Math.floor(diffHours / 24);

  if (diffMins  <  1) return "Just now";
  if (diffMins  < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays  ===1) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-pink-100   text-pink-700",
  "bg-amber-100  text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100    text-sky-700",
  "bg-rose-100   text-rose-700",
  "bg-teal-100   text-teal-700",
  "bg-indigo-100 text-indigo-700",
];

function avatarColor(id: string): string {
  const code = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ChatPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // All messages involving this user, newest first
  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, created_at, read_at")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  // Group into one conversation per partner (first entry = most recent message)
  const convMap = new Map<string, {
    partnerId: string;
    lastMessage: string;
    lastTime: string;
    unreadCount: number;
  }>();

  for (const msg of messages ?? []) {
    const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;

    if (!convMap.has(partnerId)) {
      convMap.set(partnerId, {
        partnerId,
        lastMessage: msg.content,
        lastTime: msg.created_at,
        unreadCount: 0,
      });
    }

    // Count unread on messages where I'm the receiver
    if (msg.receiver_id === user.id && !msg.read_at) {
      convMap.get(partnerId)!.unreadCount++;
    }
  }

  // Fetch profiles for all conversation partners in one query
  const partnerIds = Array.from(convMap.keys());
  const { data: profiles } = partnerIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, company")
        .in("id", partnerIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

  const conversations = Array.from(convMap.values()).map(c => ({
    ...c,
    profile: profileMap.get(c.partnerId) ?? null,
  }));

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Messages"
        subtitle={totalUnread > 0 ? `${totalUnread} unread` : undefined}
        action={
          <button className="p-2 rounded-full active:bg-surface-muted transition" style={{ color: "#4A27E8" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>
        }
      />

      <div className="px-4 pt-2 pb-6 flex flex-col gap-2">
        {/* Search */}
        <div className="relative mb-2">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 21L15 15M17 11C17 14.3137 14.3137 17 11 17C7.68629 17 5 14.3137 5 11C5 7.68629 7.68629 5 11 5C14.3137 5 17 7.68629 17 11Z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input type="search" placeholder="Search conversations…" className="input-field pl-10" />
        </div>

        {/* Empty state */}
        {conversations.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-[#F5F3FF] dark:bg-[#1E1C35]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
                  stroke="#4A27E8" strokeWidth="1.8" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">No messages yet</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Connect with people on your flight to start chatting</p>
            </div>
            <Link href="/network"
              className="mt-1 text-xs font-semibold px-4 py-2 rounded-full text-white"
              style={{ background: "#4A27E8" }}>
              Browse Network
            </Link>
          </div>
        )}

        {/* Conversation rows */}
        {conversations.map(conv => {
          const name  = conv.profile?.full_name ?? "Unknown";
          const color = avatarColor(conv.partnerId);

          return (
            <Link
              key={conv.partnerId}
              href={`/chat/${conv.partnerId}`}
              className="card flex items-center gap-3 active:scale-[0.98] transition-transform"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {conv.profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={conv.profile.avatar_url} alt={name}
                    className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center font-bold text-base`}>
                    {initials(name)}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className={`text-sm truncate ${conv.unreadCount > 0 ? "font-bold text-zinc-900 dark:text-zinc-50" : "font-semibold text-zinc-700 dark:text-zinc-200"}`}>
                    {name}
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 flex-shrink-0 ml-2">{formatTime(conv.lastTime)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className={`text-xs truncate flex-1 ${conv.unreadCount > 0 ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-500"}`}>
                    {conv.lastMessage}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span
                      className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                      style={{ background: "#4A27E8" }}
                    >
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
