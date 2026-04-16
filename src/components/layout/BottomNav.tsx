"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const navItems = [
  {
    href: "/home",
    label: "Home",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V16H9V21H4C3.45 21 3 20.55 3 20V10.5Z"
          fill={active ? "#7C6AF5" : "none"} stroke={active ? "#7C6AF5" : "currentColor"} strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/flight",
    label: "Flights",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
          fill={active ? "#7C6AF5" : "none"} stroke={active ? "#7C6AF5" : "currentColor"} strokeWidth="1.6" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/network",
    label: "Network",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="3" fill={active ? "#7C6AF5" : "none"} stroke={active ? "#7C6AF5" : "currentColor"} strokeWidth="1.8"/>
        <circle cx="17" cy="11" r="3" fill={active ? "#7C6AF5" : "none"} stroke={active ? "#7C6AF5" : "currentColor"} strokeWidth="1.8"/>
        <path d="M3 20C3 17.24 5.69 15 9 15C10.21 15 11.34 15.34 12.29 15.91" stroke={active ? "#7C6AF5" : "currentColor"} strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M11 20C11 17.79 13.69 16 17 16C20.31 16 23 17.79 23 20" stroke={active ? "#7C6AF5" : "currentColor"} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/chat",
    label: "Chat",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
          fill={active ? "#7C6AF5" : "none"} stroke={active ? "#7C6AF5" : "currentColor"} strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    navItems.forEach(({ href }) => router.prefetch(href));
  }, [router]);

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-4 my-3 flex items-center justify-around rounded-[28px] px-2"
           style={{
             height: 62,
             background: "var(--nav-bg)",
             border: "1px solid var(--nav-border)",
             boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
             backdropFilter: "blur(24px)",
             WebkitBackdropFilter: "blur(24px)",
           }}>
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full rounded-2xl transition-all active:scale-90"
              style={{
                color: active ? "#7C6AF5" : "var(--nav-inactive)",
                background: active ? "rgba(124,106,245,0.12)" : "transparent",
                margin: "6px 2px",
              }}
            >
              {icon(active)}
              <span className={`text-[10px] ${active ? "font-bold" : "font-medium"}`}
                    style={{ color: active ? "#7C6AF5" : "var(--nav-inactive)" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
