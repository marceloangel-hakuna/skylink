"use client";

import { useRouter } from "next/navigation";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  action?: React.ReactNode;
  transparent?: boolean;
};

export default function PageHeader({
  title,
  subtitle,
  showBack,
  action,
  transparent,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <header
      className={`sticky top-0 z-40 px-4
                  ${transparent ? "bg-transparent" : "glass border-b border-surface-border"}`}
    >
      {/* Status-bar spacer — grows to fill the notch/dynamic island */}
      <div style={{ height: "max(20px, env(safe-area-inset-top, 20px))" }} />

      {/* Actual header row — always 56px tall, below the status bar */}
      <div className="flex items-center gap-3 h-14">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full active:opacity-70 transition"
            style={{ color: "var(--c-text1)" }}
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate" style={{ color: "var(--c-text1)" }}>{title}</h1>
          {subtitle && (
            <p className="text-xs truncate" style={{ color: "var(--c-text2)" }}>{subtitle}</p>
          )}
        </div>

        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </header>
  );
}
