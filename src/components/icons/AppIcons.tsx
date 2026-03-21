/**
 * SkyLink Icon System
 * WHOOP-inspired: thin stroke (1.6px), round caps/joins, 2D geometric, 24×24 viewBox
 * All icons use currentColor — adapt automatically to light/dark mode.
 */

import React from "react";

export type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
};

// ─── Core Actions ──────────────────────────────────────────────────────────────

export function PlusIcon({ size = 20, color = "currentColor", strokeWidth = 1.8, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M12 5v14M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon({ size = 20, color = "currentColor", strokeWidth = 1.8, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 20, color = "currentColor", strokeWidth = 2, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M9 18l6-6-6-6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 20, color = "currentColor", strokeWidth = 2, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SearchIcon({ size = 20, color = "currentColor", strokeWidth = 1.8, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <circle cx="10.5" cy="10.5" r="6" stroke={color} strokeWidth={strokeWidth} />
      <path d="M16 16L20.5 20.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ size = 20, color = "currentColor", strokeWidth = 2.2, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M4 12l6 6L20 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SendIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M22 2L11 13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CameraIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
}

export function SpinnerIcon({ size = 20, color = "currentColor", className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`animate-spin ${className ?? ""}`} style={style}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" strokeOpacity="0.2" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── Feature / Product ────────────────────────────────────────────────────────

export function StarIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, filled = false, className, style }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
        fill={filled ? color : "none"}
      />
    </svg>
  );
}

export function BellIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, filled = false, className, style }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
        fill={filled ? color : "none"}
      />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function ShieldIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MoonIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SunIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <circle cx="12" cy="12" r="4" stroke={color} strokeWidth={strokeWidth} />
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function WifiIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M5 12.55a11 11 0 0 1 14.08 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="12" cy="20" r="1" fill={color} />
    </svg>
  );
}

export function SignOutIcon({ size = 20, color = "#EF4444", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 17l5-5-5-5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12H9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function VerifiedBadgeIcon({ size = 20, color = "#4A27E8", strokeWidth = 1.5, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path
        d="M12 2l2.4 4.8 5.4.8-3.9 3.8.9 5.4L12 14.2l-4.8 2.6.9-5.4L4.2 7.6l5.4-.8L12 2z"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M9 11.5l2 2 4-4" stroke={color} strokeWidth={strokeWidth + 0.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlaneIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MessageBubbleIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, filled = false, className, style }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path
        d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
        fill={filled ? color : "none"}
      />
    </svg>
  );
}

export function CrewIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <circle cx="9" cy="7" r="3" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="17" cy="9" r="2.5" stroke={color} strokeWidth={strokeWidth} />
      <path d="M3 20c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M17.5 14c2.21 0 4 1.57 4 3.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function PersonPlusIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <circle cx="9" cy="7" r="4" stroke={color} strokeWidth={strokeWidth} />
      <path d="M3 21v-2a7 7 0 0 1 11.1-5.6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M16 19h6M19 16v6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function HandshakeIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M14 8H8L5 11l5 5 2-2 3 3 5-5-3-3-2-1z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 11L2 14l5 5 2-2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 11l3 3-5 5-2-2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Notification Type Icons ──────────────────────────────────────────────────

export function ConnectionNotifIcon({ size = 16, color = "currentColor", strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <circle cx="9" cy="8" r="3" stroke={color} strokeWidth={strokeWidth} />
      <path d="M3 19c0-3.31 2.69-5 6-5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M15 14h6M18 11v6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function MessageNotifIcon({ size = 16, color = "currentColor", strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AtlasSparkleIcon({ size = 20, color = "currentColor", strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CrewNotifIcon({ size = 16, color = "currentColor", strokeWidth = 1.6, className, style }: IconProps) {
  return <CrewIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style} />;
}

export function FlightNotifIcon({ size = 16, color = "currentColor", strokeWidth = 1.6, className, style }: IconProps) {
  return <PlaneIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style} />;
}

// ─── Interest Category Icons ───────────────────────────────────────────────────

export function AiMlIcon({ size = 20, color = "currentColor", strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <rect x="7" y="7" width="10" height="10" rx="2" stroke={color} strokeWidth={strokeWidth} />
      <path d="M9 3v4M12 3v4M15 3v4M9 17v4M12 17v4M15 17v4M3 9h4M3 12h4M3 15h4M17 9h4M17 12h4M17 15h4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function FintechIcon({ size = 20, color = "currentColor", strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <rect x="2" y="5" width="20" height="14" rx="2.5" stroke={color} strokeWidth={strokeWidth} />
      <path d="M2 10h20" stroke={color} strokeWidth={strokeWidth} />
      <path d="M6 15h4" stroke={color} strokeWidth={strokeWidth + 0.2} strokeLinecap="round" />
    </svg>
  );
}

export function ClimateIcon({ size = 20, color = "currentColor", strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M17 8C8 10 5.9 16.17 3.82 19.34A1 1 0 0 0 4.93 20.8C9.5 18.56 16.5 16 20 10 20 6 17 4 12 4 9 4 6 5 4 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 21l3-5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function SaasIcon({ size = 20, color = "currentColor", strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 1 0 0-10z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Web3Icon({ size = 20, color = "currentColor", strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DesignIcon({ size = 20, color = "currentColor", strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M12 20h9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function VCIcon({ size = 20, color = "currentColor", strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M23 6l-9.5 9.5-5-5L1 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 6h6v6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProductIcon({ size = 20, color = "currentColor", strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DevToolsIcon({ size = 20, color = "currentColor", strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M16 18l6-6-6-6M8 6L2 12l6 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BiotechIcon({ size = 20, color = "currentColor", strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M9 3h6M9 3v9l-5 7.5A1 1 0 0 0 4.83 21h14.34A1 1 0 0 0 20 19.5L15 12V3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 15.5h11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

// ─── Tier Icons ────────────────────────────────────────────────────────────────

export function TierBronzeIcon({ size = 28, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
      <circle cx="16" cy="16" r="12" stroke="#B87333" strokeWidth="1.8" />
      <circle cx="16" cy="16" r="7.5" stroke="#B87333" strokeWidth="1.4" strokeDasharray="3 2.5" />
      <circle cx="16" cy="16" r="3" fill="#B87333" fillOpacity="0.4" stroke="#B87333" strokeWidth="1.4" />
    </svg>
  );
}

export function TierSilverIcon({ size = 28, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
      <circle cx="16" cy="16" r="12" stroke="#94A3B8" strokeWidth="1.8" />
      <path d="M16 9l2 5h5l-4 3.5 1.5 5L16 19.5 11.5 22.5 13 17.5 9 14h5l2-5z" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TierGoldIcon({ size = 28, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
      <circle cx="16" cy="16" r="12" stroke="#EAB308" strokeWidth="1.8" />
      <path d="M16 9l2 5h5l-4 3.5 1.5 5L16 19.5 11.5 22.5 13 17.5 9 14h5l2-5z" stroke="#EAB308" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="#EAB30822" />
    </svg>
  );
}

export function TierPlatinumIcon({ size = 28, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
      <circle cx="16" cy="16" r="12" stroke="#A78BFA" strokeWidth="1.8" />
      <path d="M10 14l3-5h6l3 5-6 8-6-8z" stroke="#A78BFA" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="#A78BFA22" />
      <path d="M10 14h12" stroke="#A78BFA" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// ─── Deal / Reward Category Icons ─────────────────────────────────────────────

export function LoungeIcon({ size = 24, color = "currentColor", strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M2 11a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1z" stroke={color} strokeWidth={strokeWidth} />
      <path d="M4 14v4h16v-4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 18v2M16 18v2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function WineIcon({ size = 24, color = "currentColor", strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M8 2h8l3 9a7 7 0 0 1-14 0L8 2z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 16v6M8 22h8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function UpgradeIcon({ size = 24, color = "currentColor", strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M12 19V5M5 12l7-7 7 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function MealIcon({ size = 24, color = "currentColor", strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 2v4M10 2v4M14 2v4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function PassIcon({ size = 24, color = "currentColor", strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
      <path d="M12 7l1.55 3.13L17 10.87l-2.5 2.44.59 3.44L12 15.01 9.91 16.75l.59-3.44L8 10.87l3.45-.74L12 7z" stroke={color} strokeWidth={strokeWidth - 0.1} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Additional Icons ─────────────────────────────────────────────────────────

export function CalendarIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <rect x="3" y="4" width="18" height="17" rx="2.5" stroke={color} strokeWidth={strokeWidth} />
      <path d="M3 9h18" stroke={color} strokeWidth={strokeWidth} />
      <path d="M8 2v4M16 2v4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M7 13h2M11 13h2M15 13h2M7 17h2M11 17h2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function ClockIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
      <path d="M12 7v5l3 2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AlertTriangleIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
      <path d="M8 12l3 3 5-5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EyeOffIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 1l22 22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function ConnectionsIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <circle cx="8" cy="8" r="3" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="16" cy="8" r="3" stroke={color} strokeWidth={strokeWidth} />
      <path d="M2 20c0-2.76 2.69-5 6-5s6 2.24 6 5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M16 15c2.21 0 4 1.57 4 3.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function CoffeeIcon({ size = 24, color = "currentColor", strokeWidth = 1.6, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 2c0 0 1 1.5 0 3M10 2c0 0 1 1.5 0 3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

// ─── Crew Thematic Icons ───────────────────────────────────────────────────────

export function RocketIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M12 2c-3.5 0-5.5 5-5.5 8.5V13h11v-2.5C17.5 7 15.5 2 12 2z" />
      <path d="M6.5 13L4 18h4.5" />
      <path d="M17.5 13L20 18h-4.5" />
      <path d="M9.5 18.5h5v2a2.5 2.5 0 01-5 0v-2z" />
      <circle cx="12" cy="9" r="1.5" />
    </svg>
  );
}

export function BriefcaseIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <rect x="2" y="8" width="20" height="13" rx="2" />
      <path d="M16 8V6a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      <path d="M2 13h20" />
    </svg>
  );
}

export function GlobeIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a14.5 14.5 0 014 9 14.5 14.5 0 01-4 9 14.5 14.5 0 01-4-9 14.5 14.5 0 014-9z" />
      <path d="M3 12h18" />
    </svg>
  );
}

export function BuildingIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M3 21V8l9-5 9 5v13H3z" />
      <path d="M10 21v-6h4v6" />
      <path d="M9 9h2v2H9zM13 9h2v2h-2zM9 14h2v2H9zM13 14h2v2h-2z" />
    </svg>
  );
}

export function PalmIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M12 22V13" />
      <path d="M12 13C11 9 7.5 7.5 5 4c3.5-.5 6.5 3 7 6" />
      <path d="M12 13C13 9 16.5 7.5 19 4c-3.5-.5-6.5 3-7 6" />
      <path d="M12 13c0-2-2.5-6.5-5-6 1.5 1.5 3 4 5 6" />
      <path d="M12 13c0-2 2.5-6.5 5-6-1.5 1.5-3 4-5 6" />
    </svg>
  );
}

export function CocktailIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M5 3h14L12 14v6" />
      <path d="M9 20h6" />
      <path d="M8.5 8l1.5 1.5" />
    </svg>
  );
}

export function TargetIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function MicIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0014 0" />
      <path d="M12 18v4" />
      <path d="M9 22h6" />
    </svg>
  );
}

export function MusicIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

export function MountainIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M2 21L9 7l4 6 3-4 6 9H2z" />
      <path d="M13 7l2 3" />
    </svg>
  );
}

export function WavesIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M2 10c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0" />
      <path d="M2 15c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0" />
    </svg>
  );
}

export function LightbulbIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 016 6c0 2.5-1.5 4.5-3 5.5L14.5 16h-5L8.5 14.5C7 13.5 6 11.5 6 9a6 6 0 016-6z" />
    </svg>
  );
}

export function FireIcon({ size = 20, color = "currentColor", strokeWidth = 1.7, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M12 22c4.5 0 7-3 7-6.5 0-4-4-9-7-13-3 4-7 9-7 13C5 19 7.5 22 12 22z" />
      <path d="M12 22c2 0 3.5-1.5 3.5-3.5 0-2-3.5-5-3.5-5s-3.5 3-3.5 5C8.5 20.5 10 22 12 22z" />
    </svg>
  );
}

// ─── Crew Icon Registry ────────────────────────────────────────────────────────

export const CREW_ICON_LIST: { key: string; label: string; component: (size: number) => React.ReactNode }[] = [
  { key: "plane",     label: "Aviation",    component: s => <PlaneIcon size={s} /> },
  { key: "rocket",    label: "Startup",     component: s => <RocketIcon size={s} /> },
  { key: "briefcase", label: "Business",    component: s => <BriefcaseIcon size={s} /> },
  { key: "chip",      label: "AI & Tech",   component: s => <AiMlIcon size={s} /> },
  { key: "globe",     label: "Global",      component: s => <GlobeIcon size={s} /> },
  { key: "building",  label: "City",        component: s => <BuildingIcon size={s} /> },
  { key: "palm",      label: "Tropical",    component: s => <PalmIcon size={s} /> },
  { key: "cocktail",  label: "Nightlife",   component: s => <CocktailIcon size={s} /> },
  { key: "coffee",    label: "Casual",      component: s => <CoffeeIcon size={s} /> },
  { key: "target",    label: "Focus",       component: s => <TargetIcon size={s} /> },
  { key: "star",      label: "General",     component: s => <StarIcon size={s} /> },
  { key: "mic",       label: "Speaking",    component: s => <MicIcon size={s} /> },
  { key: "music",     label: "Music",       component: s => <MusicIcon size={s} /> },
  { key: "leaf",      label: "Nature",      component: s => <ClimateIcon size={s} /> },
  { key: "mountain",  label: "Outdoors",    component: s => <MountainIcon size={s} /> },
  { key: "waves",     label: "Ocean",       component: s => <WavesIcon size={s} /> },
  { key: "dna",       label: "Biotech",     component: s => <BiotechIcon size={s} /> },
  { key: "network",   label: "Network",     component: s => <Web3Icon size={s} /> },
  { key: "lightbulb", label: "Ideas",       component: s => <LightbulbIcon size={s} /> },
  { key: "fire",      label: "Energy",      component: s => <FireIcon size={s} /> },
];

// Maps legacy emoji strings to their new key equivalents
const EMOJI_TO_KEY: Record<string, string> = {
  "✈️": "plane", "🚀": "rocket", "💼": "briefcase", "🤖": "chip",
  "🌎": "globe", "🏙️": "building", "🌴": "palm", "🍸": "cocktail",
  "☕": "coffee", "🎯": "target", "⭐": "star", "🎤": "mic",
  "🎸": "music", "🌿": "leaf", "🏔️": "mountain", "🌊": "waves",
  "🧬": "dna", "🌐": "network", "💡": "lightbulb", "📡": "chip",
};

export function renderCrewIcon(iconKey: string, size = 24): React.ReactNode {
  const key = EMOJI_TO_KEY[iconKey] ?? iconKey;
  const entry = CREW_ICON_LIST.find(e => e.key === key);
  return entry ? entry.component(size) : <CrewIcon size={size} />;
}
