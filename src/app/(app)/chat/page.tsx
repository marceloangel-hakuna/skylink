import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import NewConversationButton from "@/components/NewConversationButton";
import { EmptyState } from "@/components/EmptyState";
import { avatarColor, initials } from "@/lib/utils/avatarColor";
import { formatTime } from "@/lib/utils/formatTime";

export const dynamic = "force-dynamic";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFlightDate(dateStr: string): string {
  // dateStr is "YYYY-MM-DD"
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ChatPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Flight chats ──────────────────────────────────────────────────────────
  const { data: userFlights } = await supabase
    .from("user_flights")
    .select("id, flight_number, origin, destination, departure_date, status")
    .eq("user_id", user.id)
    .in("status", ["upcoming", "active"])
    .order("departure_date", { ascending: true });

  // For each flight, fetch the most recent flight_message with sender profile
  type FlightChat = {
    flightNumber: string;
    origin: string | null;
    destination: string | null;
    departureDate: string;
    flightKey: string;
    lastMessage: string | null;
    lastTime: string | null;
    senderName: string | null;
  };

  const flightChats: FlightChat[] = [];

  for (const flight of (userFlights ?? []).filter(f => f.departure_date)) {
    const { data: lastMsgs } = await supabase
      .from("flight_messages")
      .select("id, content, created_at, sender_id")
      .eq("flight_number", flight.flight_number)
      .eq("departure_date", flight.departure_date)
      .order("created_at", { ascending: false })
      .limit(1);

    let lastMessage: string | null = null;
    let lastTime: string | null = null;
    let senderName: string | null = null;

    if (lastMsgs && lastMsgs.length > 0) {
      const last = lastMsgs[0];
      lastMessage = last.content;
      lastTime = last.created_at;

      // Fetch sender profile
      if (last.sender_id === user.id) {
        senderName = "You";
      } else {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", last.sender_id)
          .single();
        senderName = prof?.full_name ?? null;
      }
    }

    flightChats.push({
      flightNumber: flight.flight_number,
      origin: flight.origin ?? null,
      destination: flight.destination ?? null,
      departureDate: flight.departure_date,
      flightKey: `${flight.flight_number}_${flight.departure_date}`,
      lastMessage,
      lastTime,
      senderName,
    });
  }

  // ── DM conversations ──────────────────────────────────────────────────────

  // All messages involving this user, newest first
  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, created_at, read_at")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  // Group into one conversation per partner (first entry = most recent message)
  const convMap = new Map<
    string,
    {
      partnerId: string;
      lastMessage: string;
      lastTime: string;
      unreadCount: number;
    }
  >();

  for (const msg of messages ?? []) {
    const partnerId =
      msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;

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
  const { data: profiles } =
    partnerIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, role, company")
          .in("id", partnerIds)
      : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const conversations = Array.from(convMap.values()).map((c) => ({
    ...c,
    profile: profileMap.get(c.partnerId) ?? null,
  }));

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="animate-fade-in pb-[110px]">
      <div
        className="px-4 flex items-center justify-between"
        style={{ paddingTop: "max(20px, env(safe-area-inset-top))" }}
      >
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--c-text1)" }}>
            Messages
          </h1>
          {totalUnread > 0 && (
            <p className="text-xs mt-0.5" style={{ color: "var(--c-text2)" }}>
              {totalUnread} unread
            </p>
          )}
        </div>
        <NewConversationButton />
      </div>

      <div className="px-4 pt-2 pb-4 flex flex-col gap-2">
        {/* Search */}
        <div className="relative mb-2">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M21 21L15 15M17 11C17 14.3137 14.3137 17 11 17C7.68629 17 5 14.3137 5 11C5 7.68629 7.68629 5 11 5C14.3137 5 17 7.68629 17 11Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="search"
            placeholder="Search conversations…"
            className="input-field pl-10"
          />
        </div>

        {/* ── Flight Chats section ──────────────────────────────────────── */}
        {flightChats.length > 0 && (
          <div className="mb-2">
            <p
              className="text-[11px] font-semibold uppercase tracking-wide mb-2"
              style={{ color: "var(--c-text3)" }}
            >
              ✈ Flight Chats
            </p>
            <div className="flex flex-col gap-2">
              {flightChats.map((fc) => (
                <Link
                  key={fc.flightKey}
                  href={`/chat/flight/${fc.flightKey}`}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 active:opacity-75 transition-opacity"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(74,39,232,0.12), rgba(107,74,240,0.08))",
                    border: "1px solid rgba(74,39,232,0.15)",
                  }}
                >
                  {/* Plane icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--color-brand)" }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
                        fill="white"
                      />
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p
                        className="text-sm font-bold truncate"
                        style={{ color: "var(--c-text1)" }}
                      >
                        Flight {fc.flightNumber}
                      </p>
                      {fc.lastTime && (
                        <p
                          className="text-[11px] flex-shrink-0 ml-2"
                          style={{ color: "var(--c-text3)" }}
                        >
                          {formatTime(fc.lastTime)}
                        </p>
                      )}
                    </div>

                    {/* Origin → Destination */}
                    {(fc.origin || fc.destination) && (
                      <p
                        className="text-[11px] mb-0.5"
                        style={{ color: "var(--c-text3)" }}
                      >
                        {fc.origin && fc.destination
                          ? `${fc.origin} → ${fc.destination}`
                          : fc.origin ?? fc.destination}{" "}
                        · {formatFlightDate(fc.departureDate)}
                      </p>
                    )}

                    {/* Last message preview */}
                    <p
                      className="text-xs truncate"
                      style={{ color: fc.lastMessage ? "var(--c-text2)" : "var(--c-text3)" }}
                    >
                      {fc.lastMessage
                        ? fc.senderName
                          ? `${fc.senderName}: ${fc.lastMessage}`
                          : fc.lastMessage
                        : "Tap to join the flight chat"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── DM Conversations ─────────────────────────────────────────── */}

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
        {conversations.map((conv) => {
          const name = conv.profile?.full_name ?? "Unknown";
          const color = avatarColor(name);

          return (
            // No nested <a> — avatar links to profile, content links to chat
            <div key={conv.partnerId} className="card flex items-center gap-3">
              {/* Avatar — tap to view profile */}
              <Link
                href={`/profile/${conv.partnerId}`}
                className="relative flex-shrink-0 active:opacity-70 transition-opacity"
              >
                {conv.profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={conv.profile.avatar_url}
                    alt={name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-12 h-12 rounded-full ${color} flex items-center justify-center font-bold text-base`}
                  >
                    {initials(name)}
                  </div>
                )}
              </Link>

              {/* Content — tap to open chat */}
              <Link
                href={`/chat/${conv.partnerId}`}
                className="flex-1 min-w-0 active:opacity-70 transition-opacity"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <p
                    className={`text-sm truncate ${
                      conv.unreadCount > 0
                        ? "font-bold text-zinc-900 dark:text-[var(--c-text1)]"
                        : "font-semibold text-zinc-700 dark:text-[var(--c-text2)]"
                    }`}
                  >
                    {name}
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-[var(--c-text2)] flex-shrink-0 ml-2">
                    {formatTime(conv.lastTime)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p
                    className={`text-xs truncate flex-1 ${
                      conv.unreadCount > 0
                        ? "text-zinc-700 dark:text-[var(--c-text2)]"
                        : "text-zinc-400 dark:text-[var(--c-text3)]"
                    }`}
                  >
                    {conv.lastMessage}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span
                      className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                      style={{ background: "var(--color-brand)" }}
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
