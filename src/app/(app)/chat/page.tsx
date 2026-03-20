import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import NewConversationButton from "@/components/NewConversationButton";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

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
  "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  "bg-pink-100   text-pink-700   dark:bg-pink-900/30   dark:text-pink-400",
  "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "bg-sky-100    text-sky-700    dark:bg-sky-900/30    dark:text-sky-400",
  "bg-rose-100   text-rose-700   dark:bg-rose-900/30   dark:text-rose-400",
  "bg-teal-100   text-teal-700   dark:bg-teal-900/30   dark:text-teal-400",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
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
    <div className="animate-fade-in pb-[110px]">
      <div className="px-4 flex items-center justify-between"
           style={{ paddingTop: "max(20px, env(safe-area-inset-top))" }}>
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--c-text1)" }}>Messages</h1>
          {totalUnread > 0 && (
            <p className="text-xs mt-0.5" style={{ color: "var(--c-text2)" }}>{totalUnread} unread</p>
          )}
        </div>
        <NewConversationButton />
      </div>

      <div className="px-4 pt-2 pb-4 flex flex-col gap-2">
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
          <EmptyState
            icon="💬"
            title="No messages yet"
            body="Connect with someone from your flight to start a conversation."
            action={{ label: "Browse Network", href: "/network" }}
            className="py-12"
          />
        )}

        {/* Conversation rows */}
        {conversations.map(conv => {
          const name  = conv.profile?.full_name ?? "Unknown";
          const color = avatarColor(conv.partnerId);

          return (
            // No nested <a> — avatar links to profile, content links to chat
            <div key={conv.partnerId} className="card flex items-center gap-3">
              {/* Avatar — tap to view profile */}
              <Link href={`/profile/${conv.partnerId}`} className="relative flex-shrink-0 active:opacity-70 transition-opacity">
                {conv.profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={conv.profile.avatar_url} alt={name}
                    className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center font-bold text-base`}>
                    {initials(name)}
                  </div>
                )}
              </Link>

              {/* Content — tap to open chat */}
              <Link href={`/chat/${conv.partnerId}`} className="flex-1 min-w-0 active:opacity-70 transition-opacity">
                <div className="flex items-center justify-between mb-0.5">
                  <p className={`text-sm truncate ${conv.unreadCount > 0 ? "font-bold text-zinc-900 dark:text-[var(--c-text1)]" : "font-semibold text-zinc-700 dark:text-[var(--c-text2)]"}`}>
                    {name}
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-[var(--c-text2)] flex-shrink-0 ml-2">{formatTime(conv.lastTime)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className={`text-xs truncate flex-1 ${conv.unreadCount > 0 ? "text-zinc-700 dark:text-[var(--c-text2)]" : "text-zinc-400 dark:text-[var(--c-text3)]"}`}>
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
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
