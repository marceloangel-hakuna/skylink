import PageHeader from "@/components/layout/PageHeader";

const NOTIFICATIONS = [
  {
    id: "1", type: "connection", unread: true, time: "2m ago",
    title: "Sarah Chen wants to connect",
    body: "CTO at Vertex AI · Seat 3A on AA 247",
    icon: "👋",
  },
  {
    id: "2", type: "message", unread: true, time: "15m ago",
    title: "New message from Marcus Rivera",
    body: "Happy to share my deck — what's your email?",
    icon: "💬",
  },
  {
    id: "3", type: "flight_match", unread: true, time: "1h ago",
    title: "5 professionals on your flight",
    body: "You share industry with 3 passengers on UA 890 tomorrow.",
    icon: "✈️",
  },
  {
    id: "4", type: "reward", unread: false, time: "3h ago",
    title: "You earned 100 points!",
    body: "Reward unlocked: Made your first connection via SkyLink.",
    icon: "🏆",
  },
  {
    id: "5", type: "connection", unread: false, time: "Yesterday",
    title: "Priya Patel accepted your request",
    body: "You're now connected with Priya Patel.",
    icon: "🤝",
  },
  {
    id: "6", type: "reward", unread: false, time: "2 days ago",
    title: "Profile completion bonus",
    body: "You earned 50 points for completing your profile.",
    icon: "⭐",
  },
];

const TYPE_COLORS: Record<string, string> = {
  connection:   "bg-sky-100",
  message:      "bg-teal-100",
  flight_match: "bg-indigo-100",
  reward:       "bg-amber-100",
};

export default function NotificationsPage() {
  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Notifications ${unreadCount > 0 ? `(${unreadCount})` : ""}`}
        action={
          <button className="btn-ghost text-xs">Mark all read</button>
        }
      />

      <div className="px-4 pt-2 pb-6 flex flex-col gap-2">
        {NOTIFICATIONS.map((notif) => (
          <div
            key={notif.id}
            className={`card flex items-start gap-3 ${notif.unread ? "border-l-4 border-sky-500" : ""}`}
          >
            <div className={`w-10 h-10 rounded-2xl ${TYPE_COLORS[notif.type]} flex items-center justify-center text-lg flex-shrink-0`}>
              {notif.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm leading-snug ${notif.unread ? "font-bold text-navy-900" : "font-medium text-navy-800"}`}>
                  {notif.title}
                </p>
                <p className="text-xs text-slate-400 flex-shrink-0">{notif.time}</p>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.body}</p>

              {notif.type === "connection" && notif.unread && (
                <div className="flex gap-2 mt-3">
                  <button className="btn-primary py-1.5 px-4 text-xs">Accept</button>
                  <button className="btn-secondary py-1.5 px-4 text-xs">Decline</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
