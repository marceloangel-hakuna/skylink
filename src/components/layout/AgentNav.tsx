"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const navItems = [
  {
    href: "/home",
    label: "Feed",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="5" rx="1.5"
          fill={active ? "#7C6AF5" : "none"}
          stroke={active ? "#7C6AF5" : "currentColor"} strokeWidth="1.8"/>
        <rect x="13" y="3" width="8" height="5" rx="1.5"
          fill={active ? "#7C6AF5" : "none"}
          stroke={active ? "#7C6AF5" : "currentColor"} strokeWidth="1.8"/>
        <rect x="3" y="11" width="8" height="10" rx="1.5"
          fill={active ? "#7C6AF5" : "none"}
          stroke={active ? "#7C6AF5" : "currentColor"} strokeWidth="1.8"/>
        <rect x="13" y="11" width="8" height="5" rx="1.5"
          fill={active ? "#7C6AF5" : "none"}
          stroke={active ? "#7C6AF5" : "currentColor"} strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    href: "/flight",
    label: "Flights",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
          fill={active ? "#7C6AF5" : "none"}
          stroke={active ? "#7C6AF5" : "currentColor"} strokeWidth="1.6" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/network",
    label: "People",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="3"
          fill={active ? "#7C6AF5" : "none"}
          stroke={active ? "#7C6AF5" : "currentColor"} strokeWidth="1.8"/>
        <circle cx="17" cy="11" r="3"
          fill={active ? "#7C6AF5" : "none"}
          stroke={active ? "#7C6AF5" : "currentColor"} strokeWidth="1.8"/>
        <path d="M3 20C3 17.24 5.69 15 9 15C10.21 15 11.34 15.34 12.29 15.91"
          stroke={active ? "#7C6AF5" : "currentColor"} strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M11 20C11 17.79 13.69 16 17 16C20.31 16 23 17.79 23 20"
          stroke={active ? "#7C6AF5" : "currentColor"} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function AgentNav() {
  const pathname = usePathname();
  const router   = useRouter();

  useEffect(() => {
    navItems.forEach(({ href }) => router.prefetch(href));
  }, [router]);

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 pointer-events-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div
        className="relative mx-4 my-3 flex items-center justify-around pointer-events-auto"
        style={{
          height: 64,
          borderRadius: 32,
          background: "var(--nav-glass)",
          border: "1px solid var(--nav-glass-border)",
          backdropFilter: "blur(48px) saturate(200%)",
          WebkitBackdropFilter: "blur(48px) saturate(200%)",
          boxShadow: "0 4px 32px rgba(0,0,0,0.10), 0 1px 6px rgba(0,0,0,0.06)",
        }}
      >
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90"
              style={{
                height: 52,
                borderRadius: 26,
                margin: "6px 3px",
                color: active ? "#7C6AF5" : "var(--nav-inactive)",
                background: active ? "rgba(124,106,245,0.16)" : "transparent",
              }}
            >
              {icon(active)}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#7C6AF5" : "var(--nav-inactive)",
                  lineHeight: 1.2,
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
