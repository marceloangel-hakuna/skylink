"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type NavItem = { href: string; label: string; icon: (active: boolean) => React.ReactNode };

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V16H9V21H4C3.45 21 3 20.55 3 20V10.5Z"
      fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
  </svg>
);

const FlightIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
      fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
  </svg>
);

const NetworkIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="9"  cy="7"  r="3" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8"/>
    <circle cx="17" cy="11" r="3" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8"/>
    <path d="M3 20C3 17.24 5.69 15 9 15C10.21 15 11.34 15.34 12.29 15.91" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M11 20C11 17.79 13.69 16 17 16C20.31 16 23 17.79 23 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const AlertsIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const ChatIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
      fill={active ? "#4A27E8" : "none"}
      stroke="#4A27E8"
      strokeWidth="1.8"
      strokeLinejoin="round"/>
  </svg>
);

const mainItems: NavItem[] = [
  { href: "/home",          label: "Home",       icon: (a) => <HomeIcon    active={a} /> },
  { href: "/flight",        label: "My Flights", icon: (a) => <FlightIcon  active={a} /> },
  { href: "/network",       label: "My Network", icon: (a) => <NetworkIcon active={a} /> },
  { href: "/notifications", label: "Alerts",     icon: (a) => <AlertsIcon  active={a} /> },
];

export default function BottomNav() {
  const pathname  = usePathname();
  const router    = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    [...mainItems.map(i => i.href), "/chat"].forEach(href => router.prefetch(href));
  }, [router]);

  const chatActive = pathname === "/chat" || pathname.startsWith("/chat/");

  // Render into document.body via portal — this guarantees position:fixed is
  // relative to the true viewport with zero ancestor interference on any platform.
  const nav = (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "430px",
        zIndex: 9999,
        padding: "0 16px",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
        pointerEvents: "none",
      }}
    >
      <div className="flex items-end gap-3" style={{ pointerEvents: "auto" }}>
        {/* Floating pill */}
        <div
          className="flex-1 flex items-stretch rounded-[22px] overflow-hidden"
          style={{
            height: "62px",
            background: "var(--nav-bg)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
            border: "1px solid var(--nav-border)",
          }}
        >
          {mainItems.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-[4px] transition-all active:scale-90"
                style={{ color: active ? "var(--nav-active)" : "var(--nav-inactive)" }}
              >
                {icon(active)}
                <span className="text-[10px] font-semibold leading-none">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Floating Chat button */}
        <Link
          href="/chat"
          className="flex-shrink-0 flex items-center justify-center active:scale-90 transition-transform"
          style={{
            width: "62px",
            height: "62px",
            borderRadius: "22px",
            background: "var(--nav-bg)",
            border: chatActive ? "2px solid #4A27E8" : "1.5px solid rgba(74,39,232,0.4)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          <ChatIcon active={chatActive} />
        </Link>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(nav, document.body);
}
