"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
};

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V16H9V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const FlightIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

const NetworkIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="7" r="3" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" />
    <circle cx="17" cy="11" r="3" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M3 20C3 17.2386 5.68629 15 9 15C10.2145 15 11.3435 15.3367 12.2855 15.9139"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    />
    <path
      d="M11 20C11 17.7909 13.686 16 17 16C20.314 16 23 17.7909 23 20"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    />
  </svg>
);

const ChatIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    />
  </svg>
);

const navItems: NavItem[] = [
  { href: "/home",     label: "Home",    icon: (a) => <HomeIcon    active={a} /> },
  { href: "/flight",   label: "Flight",  icon: (a) => <FlightIcon  active={a} /> },
  { href: "/network",  label: "Network", icon: (a) => <NetworkIcon active={a} /> },
  { href: "/chat",     label: "Chat",    icon: (a) => <ChatIcon    active={a} /> },
  { href: "/profile",  label: "Profile", icon: (a) => <ProfileIcon active={a} /> },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50
                 glass border-t border-surface-border shadow-nav"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch h-[64px]">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`bottom-nav-item ${active ? "active" : ""}`}
            >
              {icon(active)}
              <span className="text-[10px] font-medium leading-none mt-0.5">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
