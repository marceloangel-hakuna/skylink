"use client";

import { useRouter } from "next/navigation";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;   // explicit destination; falls back to router.back()
  action?: React.ReactNode;
  transparent?: boolean;
};

export default function PageHeader({
  title,
  subtitle,
  showBack,
  backHref,
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
            onClick={() => backHref ? router.push(backHref) : router.back()}
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
            style={{ background: "rgba(74,39,232,0.1)" }}
            aria-label="Go back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="var(--color-brand-fg)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
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
