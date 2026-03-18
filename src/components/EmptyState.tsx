import Link from "next/link";
import React from "react";

type EmptyStateProps = {
  icon: string | React.ReactNode;
  title: string;
  body: string;
  action?: { label: string; onClick?: () => void; href?: string };
  className?: string;
};

export function EmptyState({ icon, title, body, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-16 ${className}`}>
      {/* Icon with brand-tinted circle */}
      <div
        className="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-5 flex-shrink-0"
        style={{ background: "rgba(74, 39, 232, 0.08)" }}
      >
        {typeof icon === "string" ? (
          <span style={{ fontSize: "32px", lineHeight: 1 }}>{icon}</span>
        ) : (
          icon
        )}
      </div>

      {/* Title */}
      <p
        className="text-[18px] font-bold leading-snug mb-2"
        style={{ color: "var(--c-text1)", maxWidth: "260px" }}
      >
        {title}
      </p>

      {/* Body */}
      <p
        className="text-[14px] leading-relaxed"
        style={{ color: "var(--c-text2)", maxWidth: "260px" }}
      >
        {body}
      </p>

      {/* CTA */}
      {action && (
        <div className="mt-5">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center justify-center px-6 py-3 rounded-2xl text-white text-sm font-semibold active:scale-95 transition-transform"
              style={{ background: "linear-gradient(135deg, #3418C8 0%, #4A27E8 100%)" }}
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center justify-center px-6 py-3 rounded-2xl text-white text-sm font-semibold active:scale-95 transition-transform"
              style={{ background: "linear-gradient(135deg, #3418C8 0%, #4A27E8 100%)" }}
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
