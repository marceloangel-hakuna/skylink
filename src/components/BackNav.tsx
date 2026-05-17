"use client";

import { usePathname, useRouter } from "next/navigation";

export default function BackNav() {
  const pathname = usePathname();
  const router   = useRouter();

  if (pathname === "/home") return null;

  return (
    <button
      onClick={() => router.back()}
      aria-label="Go back"
      className="fixed flex items-center gap-1.5 active:scale-95 transition-transform"
      style={{
        top: "calc(env(safe-area-inset-top, 0px) + 12px)",
        left: 16,
        zIndex: 49,
        height: 36,
        paddingInline: 14,
        borderRadius: 18,
        background: "var(--c-card)",
        border: "1px solid var(--c-border)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
           stroke="var(--c-text2)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text2)", letterSpacing: "-0.01em" }}>
        Feed
      </span>
    </button>
  );
}
