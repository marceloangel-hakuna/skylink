import PageHeader from "@/components/layout/PageHeader";
import Link from "next/link";

const CONVERSATIONS = [
  {
    id: "1", name: "Sarah Chen", lastMsg: "That sounds like a great opportunity! Let's connect at the lounge.",
    time: "2m ago", unread: 2, online: true,
  },
  {
    id: "2", name: "Marcus Rivera", lastMsg: "Happy to share my deck — what's your email?",
    time: "1h ago", unread: 0, online: true,
  },
  {
    id: "3", name: "Priya Patel", lastMsg: "See you at the gate! ✈️",
    time: "3h ago", unread: 0, online: false,
  },
  {
    id: "4", name: "James Wong", lastMsg: "Thanks for the introduction, I'll follow up.",
    time: "Yesterday", unread: 0, online: false,
  },
  {
    id: "5", name: "Ana Souza", lastMsg: "We should grab coffee on the next layover.",
    time: "Yesterday", unread: 1, online: false,
  },
];

export default function ChatPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Messages"
        action={
          <button className="p-2 rounded-full text-sky-600 active:bg-surface-muted transition">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>
        }
      />

      <div className="px-4 pt-2 pb-6 flex flex-col gap-2">
        {/* Search */}
        <div className="relative mb-2">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 21L15 15M17 11C17 14.3137 14.3137 17 11 17C7.68629 17 5 14.3137 5 11C5 7.68629 7.68629 5 11 5C14.3137 5 17 7.68629 17 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input type="search" placeholder="Search conversations…" className="input-field pl-10" />
        </div>

        {CONVERSATIONS.map((conv) => (
          <Link key={conv.id} href={`/chat/${conv.id}`} className="card flex items-center gap-3 active:bg-sky-50 transition">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-lg">
                {conv.name[0]}
              </div>
              {conv.online && (
                <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm truncate ${conv.unread > 0 ? "font-bold text-navy-900" : "font-semibold text-navy-800"}`}>
                  {conv.name}
                </p>
                <p className="text-xs text-slate-400 flex-shrink-0 ml-2">{conv.time}</p>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className={`text-xs truncate ${conv.unread > 0 ? "text-slate-700" : "text-slate-500"}`}>
                  {conv.lastMsg}
                </p>
                {conv.unread > 0 && (
                  <span className="ml-2 w-5 h-5 bg-sky-600 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                    {conv.unread}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
