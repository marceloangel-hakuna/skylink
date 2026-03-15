"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Contact = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  company: string | null;
};

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700", "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700", "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700", "bg-rose-100 text-rose-700",
];
function avatarColor(id: string) {
  const code = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

export default function NewConversationButton() {
  const router  = useRouter();
  const [open,     setOpen]     = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open || contacts.length > 0) return;
    setLoading(true);

    const sb = createClient();
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;

      const { data: conns } = await sb
        .from("connections")
        .select("requester_id, receiver_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (!conns?.length) { setLoading(false); return; }

      const ids = conns.map(c => c.requester_id === user.id ? c.receiver_id : c.requester_id);
      const { data: profiles } = await sb
        .from("profiles")
        .select("id, full_name, avatar_url, role, company")
        .in("id", ids);

      setContacts(profiles ?? []);
      setLoading(false);
    })();
  }, [open, contacts.length]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-full active:scale-90 transition-transform"
        style={{ color: "#4A27E8" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            className="relative rounded-t-3xl w-full max-w-[430px] flex flex-col overflow-hidden"
            style={{
              background: "var(--c-card)",
              maxHeight: "75vh",
              paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--c-border)" }} />
            </div>
            <div className="px-5 pb-3 flex-shrink-0">
              <h3 className="text-base font-black" style={{ color: "var(--c-text1)" }}>New Message</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--c-text3)" }}>Choose a connection to message</p>
            </div>

            <div className="overflow-y-auto flex flex-col divide-y" style={{ borderColor: "var(--c-border)" }}>
              {loading && Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                  <div className="w-11 h-11 rounded-full flex-shrink-0" style={{ background: "var(--c-muted)" }} />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3 rounded-full w-2/3" style={{ background: "var(--c-muted)" }} />
                    <div className="h-2.5 rounded-full w-1/2" style={{ background: "var(--c-muted)" }} />
                  </div>
                </div>
              ))}

              {!loading && contacts.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-12 text-center px-5">
                  <p className="text-sm font-bold" style={{ color: "var(--c-text1)" }}>No connections yet</p>
                  <p className="text-xs" style={{ color: "var(--c-text3)" }}>Connect with people in your network first</p>
                  <Link href="/network" onClick={() => setOpen(false)}
                    className="mt-2 text-xs font-semibold px-4 py-2 rounded-full text-white"
                    style={{ background: "#4A27E8" }}>
                    Browse Network
                  </Link>
                </div>
              )}

              {!loading && contacts.map(c => {
                const sub = [c.role, c.company].filter(Boolean).join(" @ ") || "SkyLink Member";
                return (
                  <button
                    key={c.id}
                    onClick={() => { setOpen(false); router.push(`/chat/${c.id}`); }}
                    className="flex items-center gap-3 px-5 py-3.5 active:bg-[var(--c-muted)] transition-colors text-left w-full"
                  >
                    {c.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.avatar_url} alt={c.full_name ?? ""} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${avatarColor(c.id)}`}>
                        {initials(c.full_name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text1)" }}>{c.full_name ?? "Unknown"}</p>
                      <p className="text-xs truncate" style={{ color: "var(--c-text3)" }}>{sub}</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "var(--c-text3)", flexShrink: 0 }}>
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
