"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

type NavItem = { href: string; label: string; icon: (active: boolean) => React.ReactNode };

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

const ChatIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M21 15C21 15.53 20.79 16.04 20.41 16.41C20.04 16.79 19.53 17 19 17H7L3 21V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V15Z"
      fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8"/>
    <path d="M4 20C4 17.24 7.58 15 12 15C16.42 15 20 17.24 20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const navItems: NavItem[] = [
  { href: "/home",    label: "Home",    icon: (a) => <HomeIcon    active={a} /> },
  { href: "/flight",  label: "Flight",  icon: (a) => <FlightIcon  active={a} /> },
  { href: "/network", label: "Network", icon: (a) => <NetworkIcon active={a} /> },
  { href: "/chat",    label: "Chat",    icon: (a) => <ChatIcon    active={a} /> },
  { href: "/profile", label: "Profile", icon: (a) => <ProfileIcon active={a} /> },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();

  useEffect(() => {
    navItems.forEach(item => router.prefetch(item.href));
  }, [router]);

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50
                 glass border-t border-[var(--c-border)] shadow-nav"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch h-[64px]">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className={`bottom-nav-item ${active ? "active" : ""}`}>
              {icon(active)}
              <span className="text-[10px] font-medium leading-none mt-0.5">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
