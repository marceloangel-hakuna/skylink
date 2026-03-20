"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V16H9V21H4C3.45 21 3 20.55 3 20V10.5Z"
      fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
  </svg>
);

const FlightIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
      fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
  </svg>
);

const NetworkIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="9"  cy="7"  r="3" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8"/>
    <circle cx="17" cy="11" r="3" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8"/>
    <path d="M3 20C3 17.24 5.69 15 9 15C10.21 15 11.34 15.34 12.29 15.91" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M11 20C11 17.79 13.69 16 17 16C20.31 16 23 17.79 23 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const AlertsIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const ChatIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
      fill="white" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
  </svg>
);

const mainItems = [
  { href: "/home",          label: "Home",       icon: (a: boolean) => <HomeIcon    active={a} /> },
  { href: "/flight",        label: "My Flights", icon: (a: boolean) => <FlightIcon  active={a} /> },
  { href: "/network",       label: "My Network", icon: (a: boolean) => <NetworkIcon active={a} /> },
  { href: "/notifications", label: "Alerts",     icon: (a: boolean) => <AlertsIcon  active={a} /> },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();

  useEffect(() => {
    [...mainItems.map(i => i.href), "/chat"].forEach(href => router.prefetch(href));
  }, [router]);

  const chatActive = pathname === "/chat" || pathname.startsWith("/chat/");

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 flex items-end gap-3 px-4"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)" }}
    >
      {/* ── Floating pill ── */}
      <div
        className="flex-1 flex items-stretch h-[62px] rounded-[22px] overflow-hidden"
        style={{
          background: "var(--nav-bg)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)",
          border: "1px solid var(--nav-border)",
        }}
      >
        {mainItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-90"
              style={{ color: active ? "var(--nav-active)" : "var(--nav-inactive)" }}
            >
              {icon(active)}
              <span className="text-[9px] font-semibold leading-none">{label}</span>
            </Link>
          );
        })}
      </div>

      {/* ── Floating Chat button ── */}
      <Link
        href="/chat"
        className="flex-shrink-0 w-[62px] h-[62px] rounded-[22px] flex items-center justify-center active:scale-90 transition-transform"
        style={{
          background: chatActive
            ? "linear-gradient(135deg, #3418C8 0%, #4A27E8 100%)"
            : "linear-gradient(135deg, #4A27E8 0%, #6B46FF 100%)",
          boxShadow: "0 8px 24px rgba(74,39,232,0.45), 0 2px 8px rgba(74,39,232,0.3)",
          border: chatActive ? "1.5px solid rgba(255,255,255,0.25)" : "1.5px solid rgba(107,70,255,0.5)",
        }}
      >
        <ChatIcon />
      </Link>
    </div>
  );
}
