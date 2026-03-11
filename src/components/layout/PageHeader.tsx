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
      className={`sticky top-0 z-40 flex items-center gap-3 px-4 h-[60px]
                  ${transparent ? "bg-transparent" : "glass border-b border-surface-border"}`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {showBack && (
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full text-navy-700 active:bg-surface-muted transition"
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      <div className="flex-1 min-w-0">
        <h1 className="text-base font-bold text-navy-900 truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-slate-500 truncate">{subtitle}</p>
        )}
      </div>

      {action && <div className="flex-shrink-0">{action}</div>}
    </header>
  );
}
