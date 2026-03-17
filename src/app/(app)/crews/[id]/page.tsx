"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────────
type Crew = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  created_by: string | null;
  created_at: string;
};

type Post = {
  id: string;
  crew_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { full_name: string | null; avatar_url: string | null; role: string | null };
  like_count: number;
  liked_by_me: boolean;
};

type Event = {
  id: string;
  crew_id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  created_by: string | null;
  rsvp_count: number;
  rsvp_by_me: boolean;
};

type Member = {
  user_id: string;
  role: string;
  joined_at: string;
  profile?: { full_name: string | null; avatar_url: string | null; role: string | null; company: string | null };
};

// ── Crew Theme System ──────────────────────────────────────────────────────────
type CrewTheme = {
  bg: string;
  border: string;
  accent: string;
  accentText: string;
  accentBadgeBg: string;
  label: string;
  illustration: React.ReactNode;
};

// Unique SVG illustrations for each crew identity
const IllustrationSkyline = () => (
  <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Stars */}
    <circle cx="20" cy="18" r="1.5" fill="#C2410C" fillOpacity="0.3"/>
    <circle cx="55" cy="10" r="1" fill="#C2410C" fillOpacity="0.25"/>
    <circle cx="90" cy="22" r="1.5" fill="#C2410C" fillOpacity="0.2"/>
    <circle cx="130" cy="8" r="1" fill="#C2410C" fillOpacity="0.3"/>
    <circle cx="148" cy="30" r="1" fill="#C2410C" fillOpacity="0.2"/>
    {/* Moon arc */}
    <path d="M135 14 Q148 22 138 32 Q152 28 148 16 Q144 8 135 14Z" fill="#C2410C" fillOpacity="0.12"/>
    {/* Skyline buildings */}
    <rect x="0"   y="88" width="18" height="32" rx="1" fill="#C2410C" fillOpacity="0.12"/>
    <rect x="3"   y="78" width="8"  height="10" rx="1" fill="#C2410C" fillOpacity="0.1"/>
    <rect x="20"  y="70" width="22" height="50" rx="1" fill="#C2410C" fillOpacity="0.15"/>
    <rect x="25"  y="62" width="6"  height="8"  rx="1" fill="#C2410C" fillOpacity="0.12"/>
    <rect x="44"  y="82" width="16" height="38" rx="1" fill="#C2410C" fillOpacity="0.1"/>
    <rect x="62"  y="55" width="28" height="65" rx="1" fill="#C2410C" fillOpacity="0.18"/>
    <rect x="68"  y="48" width="8"  height="7"  rx="1" fill="#C2410C" fillOpacity="0.14"/>
    <rect x="74"  y="42" width="2"  height="6"  fill="#C2410C" fillOpacity="0.2"/>
    <rect x="92"  y="72" width="20" height="48" rx="1" fill="#C2410C" fillOpacity="0.12"/>
    <rect x="114" y="65" width="24" height="55" rx="1" fill="#C2410C" fillOpacity="0.15"/>
    <rect x="120" y="58" width="6"  height="7"  rx="1" fill="#C2410C" fillOpacity="0.1"/>
    <rect x="140" y="80" width="20" height="40" rx="1" fill="#C2410C" fillOpacity="0.1"/>
    {/* Windows */}
    <rect x="65"  y="60" width="3" height="3" rx="0.5" fill="#C2410C" fillOpacity="0.2"/>
    <rect x="72"  y="60" width="3" height="3" rx="0.5" fill="#C2410C" fillOpacity="0.15"/>
    <rect x="65"  y="68" width="3" height="3" rx="0.5" fill="#C2410C" fillOpacity="0.18"/>
    <rect x="72"  y="68" width="3" height="3" rx="0.5" fill="#C2410C" fillOpacity="0.12"/>
    <rect x="22"  y="76" width="2.5" height="2.5" rx="0.5" fill="#C2410C" fillOpacity="0.18"/>
    <rect x="28"  y="76" width="2.5" height="2.5" rx="0.5" fill="#C2410C" fillOpacity="0.14"/>
    {/* Plane silhouette */}
    <path d="M108 35 L116 32 L118 35 L116 38Z M108 34 L111 30 L112 34Z M108 36 L111 40 L112 36Z" fill="#C2410C" fillOpacity="0.25"/>
    {/* Ground horizon */}
    <line x1="0" y1="120" x2="160" y2="120" stroke="#C2410C" strokeOpacity="0.08" strokeWidth="1"/>
  </svg>
);

const IllustrationNeural = () => (
  <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Connection lines */}
    <line x1="20"  y1="40"  x2="60"  y2="25"  stroke="#1D4ED8" strokeOpacity="0.12" strokeWidth="1"/>
    <line x1="20"  y1="40"  x2="60"  y2="60"  stroke="#1D4ED8" strokeOpacity="0.12" strokeWidth="1"/>
    <line x1="20"  y1="40"  x2="60"  y2="95"  stroke="#1D4ED8" strokeOpacity="0.08" strokeWidth="1"/>
    <line x1="60"  y1="25"  x2="105" y2="15"  stroke="#1D4ED8" strokeOpacity="0.12" strokeWidth="1"/>
    <line x1="60"  y1="25"  x2="105" y2="45"  stroke="#1D4ED8" strokeOpacity="0.1"  strokeWidth="1"/>
    <line x1="60"  y1="60"  x2="105" y2="45"  stroke="#1D4ED8" strokeOpacity="0.12" strokeWidth="1"/>
    <line x1="60"  y1="60"  x2="105" y2="75"  stroke="#1D4ED8" strokeOpacity="0.12" strokeWidth="1"/>
    <line x1="60"  y1="95"  x2="105" y2="75"  stroke="#1D4ED8" strokeOpacity="0.1"  strokeWidth="1"/>
    <line x1="60"  y1="95"  x2="105" y2="105" stroke="#1D4ED8" strokeOpacity="0.1"  strokeWidth="1"/>
    <line x1="105" y1="15"  x2="145" y2="35"  stroke="#1D4ED8" strokeOpacity="0.12" strokeWidth="1"/>
    <line x1="105" y1="45"  x2="145" y2="35"  stroke="#1D4ED8" strokeOpacity="0.12" strokeWidth="1"/>
    <line x1="105" y1="45"  x2="145" y2="70"  stroke="#1D4ED8" strokeOpacity="0.1"  strokeWidth="1"/>
    <line x1="105" y1="75"  x2="145" y2="70"  stroke="#1D4ED8" strokeOpacity="0.12" strokeWidth="1"/>
    <line x1="105" y1="105" x2="145" y2="70"  stroke="#1D4ED8" strokeOpacity="0.08" strokeWidth="1"/>
    {/* Input nodes */}
    <circle cx="20"  cy="40"  r="5" fill="#1D4ED8" fillOpacity="0.18"/>
    <circle cx="20"  cy="40"  r="2" fill="#1D4ED8" fillOpacity="0.3"/>
    {/* Hidden layer 1 */}
    <circle cx="60"  cy="25"  r="5.5" fill="#1D4ED8" fillOpacity="0.15"/>
    <circle cx="60"  cy="25"  r="2.5" fill="#1D4ED8" fillOpacity="0.25"/>
    <circle cx="60"  cy="60"  r="5.5" fill="#1D4ED8" fillOpacity="0.18"/>
    <circle cx="60"  cy="60"  r="2.5" fill="#1D4ED8" fillOpacity="0.3"/>
    <circle cx="60"  cy="95"  r="5.5" fill="#1D4ED8" fillOpacity="0.12"/>
    <circle cx="60"  cy="95"  r="2.5" fill="#1D4ED8" fillOpacity="0.2"/>
    {/* Hidden layer 2 */}
    <circle cx="105" cy="15"  r="5"   fill="#1D4ED8" fillOpacity="0.14"/>
    <circle cx="105" cy="15"  r="2"   fill="#1D4ED8" fillOpacity="0.22"/>
    <circle cx="105" cy="45"  r="6"   fill="#1D4ED8" fillOpacity="0.2"/>
    <circle cx="105" cy="45"  r="3"   fill="#1D4ED8" fillOpacity="0.32"/>
    <circle cx="105" cy="75"  r="5.5" fill="#1D4ED8" fillOpacity="0.16"/>
    <circle cx="105" cy="75"  r="2.5" fill="#1D4ED8" fillOpacity="0.26"/>
    <circle cx="105" cy="105" r="4.5" fill="#1D4ED8" fillOpacity="0.12"/>
    <circle cx="105" cy="105" r="2"   fill="#1D4ED8" fillOpacity="0.2"/>
    {/* Output node */}
    <circle cx="145" cy="35"  r="6"   fill="#1D4ED8" fillOpacity="0.22"/>
    <circle cx="145" cy="35"  r="3"   fill="#1D4ED8" fillOpacity="0.35"/>
    <circle cx="145" cy="70"  r="5"   fill="#1D4ED8" fillOpacity="0.16"/>
    <circle cx="145" cy="70"  r="2"   fill="#1D4ED8" fillOpacity="0.28"/>
    {/* Floating dots */}
    <circle cx="12"  cy="95"  r="2"   fill="#1D4ED8" fillOpacity="0.1"/>
    <circle cx="135" cy="100" r="2.5" fill="#1D4ED8" fillOpacity="0.1"/>
    <circle cx="80"  cy="108" r="1.5" fill="#1D4ED8" fillOpacity="0.1"/>
  </svg>
);

const IllustrationGlobe = () => (
  <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Globe circle */}
    <circle cx="100" cy="58" r="52" stroke="#065F46" strokeOpacity="0.12" strokeWidth="1.5"/>
    <circle cx="100" cy="58" r="52" fill="#065F46" fillOpacity="0.03"/>
    {/* Latitude lines */}
    <ellipse cx="100" cy="58" rx="52" ry="14" stroke="#065F46" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="3 3"/>
    <ellipse cx="100" cy="40" rx="48" ry="10" stroke="#065F46" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="3 3"/>
    <ellipse cx="100" cy="76" rx="48" ry="10" stroke="#065F46" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="3 3"/>
    <ellipse cx="100" cy="22" rx="34" ry="7"  stroke="#065F46" strokeOpacity="0.07" strokeWidth="1" strokeDasharray="3 3"/>
    <ellipse cx="100" cy="94" rx="34" ry="7"  stroke="#065F46" strokeOpacity="0.07" strokeWidth="1" strokeDasharray="3 3"/>
    {/* Longitude lines */}
    <path d="M100 6 Q130 30 130 58 Q130 86 100 110" stroke="#065F46" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="3 3"/>
    <path d="M100 6 Q70 30 70 58 Q70 86 100 110"  stroke="#065F46" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="3 3"/>
    <line x1="100" y1="6" x2="100" y2="110" stroke="#065F46" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="3 3"/>
    {/* Continent blobs (abstract) */}
    <path d="M78 44 Q86 38 94 42 Q98 50 90 54 Q82 56 78 50Z" fill="#065F46" fillOpacity="0.15"/>
    <path d="M104 38 Q114 34 118 42 Q116 50 108 52 Q102 48 104 38Z" fill="#065F46" fillOpacity="0.12"/>
    <path d="M82 62 Q88 58 96 62 Q98 70 92 74 Q84 74 82 66Z" fill="#065F46" fillOpacity="0.1"/>
    <path d="M106 64 Q112 62 116 68 Q114 76 108 76 Q104 72 106 64Z" fill="#065F46" fillOpacity="0.13"/>
    {/* Location pins */}
    <circle cx="86" cy="46" r="2"   fill="#065F46" fillOpacity="0.4"/>
    <circle cx="112" cy="44" r="1.5" fill="#065F46" fillOpacity="0.35"/>
    <circle cx="94"  cy="70" r="2"   fill="#065F46" fillOpacity="0.3"/>
    {/* Flight path arc between two points */}
    <path d="M86 46 Q100 28 112 44" stroke="#065F46" strokeOpacity="0.25" strokeWidth="1.2" strokeDasharray="2 2"/>
    {/* Small plane */}
    <path d="M97 33 L101 31 L102 33 L101 35Z M97 32 L99 29 L99.5 32Z M97 34 L99 37 L99.5 34Z" fill="#065F46" fillOpacity="0.35"/>
    {/* Stars/dots around globe */}
    <circle cx="28"  cy="20"  r="1.5" fill="#065F46" fillOpacity="0.2"/>
    <circle cx="15"  cy="55"  r="1"   fill="#065F46" fillOpacity="0.15"/>
    <circle cx="40"  cy="90"  r="1.5" fill="#065F46" fillOpacity="0.15"/>
    <circle cx="148" cy="18"  r="1"   fill="#065F46" fillOpacity="0.2"/>
    <circle cx="155" cy="90"  r="1.5" fill="#065F46" fillOpacity="0.15"/>
  </svg>
);

const IllustrationGoldenGate = () => (
  <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Sunset glow */}
    <circle cx="80" cy="72" r="46" fill="#92400E" fillOpacity="0.06"/>
    <circle cx="80" cy="72" r="30" fill="#92400E" fillOpacity="0.05"/>
    {/* Sun rays */}
    <line x1="80" y1="28" x2="80" y2="20" stroke="#92400E" strokeOpacity="0.1" strokeWidth="1.2"/>
    <line x1="101" y1="34" x2="107" y2="27" stroke="#92400E" strokeOpacity="0.08" strokeWidth="1"/>
    <line x1="59"  y1="34" x2="53"  y2="27" stroke="#92400E" strokeOpacity="0.08" strokeWidth="1"/>
    <line x1="114" y1="52" x2="122" y2="48" stroke="#92400E" strokeOpacity="0.07" strokeWidth="1"/>
    <line x1="46"  y1="52" x2="38"  y2="48" stroke="#92400E" strokeOpacity="0.07" strokeWidth="1"/>
    {/* Marin headlands (left hill) */}
    <path d="M0 82 Q18 60 38 68 Q46 72 52 76 L0 76Z" fill="#92400E" fillOpacity="0.1"/>
    {/* Treasure Island hills (right) */}
    <path d="M112 78 Q128 62 148 66 Q156 68 160 70 L160 78Z" fill="#92400E" fillOpacity="0.08"/>
    {/* Bay water */}
    <path d="M0 92 Q20 89 40 92 Q60 95 80 92 Q100 89 120 92 Q140 95 160 92 L160 120 L0 120Z"
          fill="#92400E" fillOpacity="0.07"/>
    <path d="M0 98  Q30 95  60 98  Q90 101 120 98  Q140 96 160 98"
          stroke="#92400E" strokeOpacity="0.1" strokeWidth="0.8"/>
    <path d="M0 104 Q25 101 55 104 Q85 107 115 104 Q138 101 160 104"
          stroke="#92400E" strokeOpacity="0.07" strokeWidth="0.7"/>
    {/* LEFT TOWER */}
    <rect x="47" y="42" width="7" height="50" rx="1" fill="#92400E" fillOpacity="0.22"/>
    {/* Tower cross-braces */}
    <rect x="47" y="54" width="7" height="2.5" rx="0.5" fill="#92400E" fillOpacity="0.16"/>
    <rect x="47" y="64" width="7" height="2.5" rx="0.5" fill="#92400E" fillOpacity="0.14"/>
    <rect x="47" y="74" width="7" height="2.5" rx="0.5" fill="#92400E" fillOpacity="0.12"/>
    {/* Tower cap */}
    <rect x="45" y="37" width="11" height="6" rx="1"   fill="#92400E" fillOpacity="0.24"/>
    <rect x="48" y="30" width="5"  height="8" rx="0.5" fill="#92400E" fillOpacity="0.22"/>
    <rect x="49" y="27" width="3"  height="4" rx="0.5" fill="#92400E" fillOpacity="0.2"/>
    {/* RIGHT TOWER */}
    <rect x="106" y="42" width="7" height="50" rx="1" fill="#92400E" fillOpacity="0.22"/>
    <rect x="106" y="54" width="7" height="2.5" rx="0.5" fill="#92400E" fillOpacity="0.16"/>
    <rect x="106" y="64" width="7" height="2.5" rx="0.5" fill="#92400E" fillOpacity="0.14"/>
    <rect x="106" y="74" width="7" height="2.5" rx="0.5" fill="#92400E" fillOpacity="0.12"/>
    <rect x="104" y="37" width="11" height="6" rx="1"   fill="#92400E" fillOpacity="0.24"/>
    <rect x="107" y="30" width="5"  height="8" rx="0.5" fill="#92400E" fillOpacity="0.22"/>
    <rect x="108" y="27" width="3"  height="4" rx="0.5" fill="#92400E" fillOpacity="0.2"/>
    {/* MAIN CABLES — left anchor to left tower */}
    <path d="M0 80 Q50 52 51 36" stroke="#92400E" strokeOpacity="0.22" strokeWidth="1.4"/>
    {/* MAIN CABLES — center span (catenary curve) */}
    <path d="M51 36 Q80 58 109 36" stroke="#92400E" strokeOpacity="0.25" strokeWidth="1.4"/>
    {/* MAIN CABLES — right tower to right anchor */}
    <path d="M109 36 Q158 52 160 80" stroke="#92400E" strokeOpacity="0.22" strokeWidth="1.4"/>
    {/* HANGER CABLES — center span */}
    <line x1="62"  y1="46" x2="62"  y2="80" stroke="#92400E" strokeOpacity="0.12" strokeWidth="0.8"/>
    <line x1="69"  y1="42" x2="69"  y2="80" stroke="#92400E" strokeOpacity="0.12" strokeWidth="0.8"/>
    <line x1="76"  y1="40" x2="76"  y2="80" stroke="#92400E" strokeOpacity="0.12" strokeWidth="0.8"/>
    <line x1="83"  y1="40" x2="83"  y2="80" stroke="#92400E" strokeOpacity="0.12" strokeWidth="0.8"/>
    <line x1="90"  y1="42" x2="90"  y2="80" stroke="#92400E" strokeOpacity="0.12" strokeWidth="0.8"/>
    <line x1="97"  y1="46" x2="97"  y2="80" stroke="#92400E" strokeOpacity="0.12" strokeWidth="0.8"/>
    {/* BRIDGE DECK */}
    <rect x="0"   y="79" width="160" height="3"   rx="0.5" fill="#92400E" fillOpacity="0.2"/>
    <rect x="0"   y="82" width="160" height="1.5" rx="0.5" fill="#92400E" fillOpacity="0.1"/>
    {/* Cars */}
    <circle cx="67" cy="80" r="1.2" fill="#92400E" fillOpacity="0.32"/>
    <circle cx="81" cy="80" r="1.2" fill="#92400E" fillOpacity="0.28"/>
    <circle cx="96" cy="80" r="1.2" fill="#92400E" fillOpacity="0.32"/>
    {/* Fog wisps */}
    <path d="M0 70 Q15 67 28 70 Q18 73 0 72Z"    fill="#92400E" fillOpacity="0.05"/>
    <path d="M132 66 Q148 63 160 66 Q150 69 132 68Z" fill="#92400E" fillOpacity="0.05"/>
  </svg>
);

// Generic fallback illustrations for user-created crews
const IllustrationDots = (color: string) => (
  <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {[0,1,2,3,4,5,6,7].map(row =>
      [0,1,2,3,4,5,6,7,8,9].map(col => (
        <circle key={`${row}-${col}`}
          cx={col * 18 + 8} cy={row * 16 + 8} r="2"
          fill={color} fillOpacity={((row + col) % 3 === 0) ? 0.18 : 0.08}/>
      ))
    )}
  </svg>
);

const CREW_THEMES: Record<string, CrewTheme> = {
  "11111111-0000-0000-0000-000000000001": {
    bg:           "linear-gradient(150deg, #FFF7ED 0%, #FFEDD5 60%, #FED7AA 100%)",
    border:       "#FED7AA",
    accent:       "#C2410C",
    accentText:   "#9A3412",
    accentBadgeBg:"rgba(194,65,12,0.1)",
    label:        "Coast-to-Coast",
    illustration: <IllustrationSkyline />,
  },
  "11111111-0000-0000-0000-000000000002": {
    bg:           "linear-gradient(150deg, #EFF6FF 0%, #DBEAFE 60%, #BFDBFE 100%)",
    border:       "#BFDBFE",
    accent:       "#1D4ED8",
    accentText:   "#1E3A8A",
    accentBadgeBg:"rgba(29,78,216,0.1)",
    label:        "AI & Founders",
    illustration: <IllustrationNeural />,
  },
  "11111111-0000-0000-0000-000000000003": {
    bg:           "linear-gradient(150deg, #ECFDF5 0%, #D1FAE5 60%, #A7F3D0 100%)",
    border:       "#A7F3D0",
    accent:       "#065F46",
    accentText:   "#064E3B",
    accentBadgeBg:"rgba(6,95,70,0.1)",
    label:        "LatAm Tech",
    illustration: <IllustrationGlobe />,
  },
  "11111111-0000-0000-0000-000000000004": {
    bg:           "linear-gradient(150deg, #FEFCE8 0%, #FEF9C3 55%, #FDE68A 100%)",
    border:       "#FDE68A",
    accent:       "#92400E",
    accentText:   "#78350F",
    accentBadgeBg:"rgba(146,64,14,0.1)",
    label:        "Silicon Valley",
    illustration: <IllustrationGoldenGate />,
  },
};

// Fallback themes for user-created crews (cycle by ID hash)
const FALLBACK_THEMES: Omit<CrewTheme, "illustration">[] = [
  { bg: "linear-gradient(150deg, #F5F3FF 0%, #EDE9FE 60%, #DDD6FE 100%)", border: "#DDD6FE", accent: "#6D28D9", accentText: "#5B21B6", accentBadgeBg: "rgba(109,40,217,0.1)", label: "Community" },
  { bg: "linear-gradient(150deg, #FFF1F2 0%, #FFE4E6 60%, #FECDD3 100%)", border: "#FECDD3", accent: "#BE123C", accentText: "#9F1239", accentBadgeBg: "rgba(190,18,60,0.1)",  label: "Community" },
  { bg: "linear-gradient(150deg, #F0FDFA 0%, #CCFBF1 60%, #99F6E4 100%)",  border: "#99F6E4",  accent: "#0F766E", accentText: "#115E59", accentBadgeBg: "rgba(15,118,110,0.1)", label: "Community" },
  { bg: "linear-gradient(150deg, #FFFBEB 0%, #FEF3C7 60%, #FDE68A 100%)", border: "#FDE68A", accent: "#B45309", accentText: "#92400E", accentBadgeBg: "rgba(180,83,9,0.1)",   label: "Community" },
];

function getCrewTheme(crewId: string): CrewTheme {
  if (CREW_THEMES[crewId]) return CREW_THEMES[crewId];
  const hash = crewId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = FALLBACK_THEMES[hash % FALLBACK_THEMES.length];
  return { ...base, illustration: IllustrationDots(base.accent) };
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700", "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",   "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",       "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700", "bg-teal-100 text-teal-700",
];

function avatarColor(name: string) {
  return AVATAR_COLORS[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}
function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function Avatar({ name, url, size = 10 }: { name: string; url?: string | null; size?: number }) {
  const cls = `rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold`;
  const sz  = size === 10 ? "w-10 h-10 text-sm" : size === 12 ? "w-12 h-12 text-sm" : "w-8 h-8 text-xs";
  if (url) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} className={`${cls} ${sz} object-cover`} />
  );
  return (
    <div className={`${cls} ${sz} ${avatarColor(name)}`}>{initials(name)}</div>
  );
}

// ── Feed Tab ───────────────────────────────────────────────────────────────────
function FeedTab({ crewId, userId, accentColor }: { crewId: string; userId: string; accentColor: string }) {
  const supabase = createClient();
  const [posts, setPosts]       = useState<Post[]>([]);
  const [loading, setLoading]   = useState(true);
  const [content, setContent]   = useState("");
  const [posting, setPosting]   = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("crew_posts")
      .select("id, crew_id, user_id, content, created_at")
      .eq("crew_id", crewId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (!data?.length) { setLoading(false); return; }

    const profileIds = Array.from(new Set(data.map(p => p.user_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role")
      .in("id", profileIds);
    const pMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

    const { data: likes } = await supabase
      .from("crew_post_likes")
      .select("post_id, user_id")
      .in("post_id", data.map(p => p.id));

    const likesByPost: Record<string, string[]> = {};
    for (const l of likes ?? []) {
      if (!likesByPost[l.post_id]) likesByPost[l.post_id] = [];
      likesByPost[l.post_id].push(l.user_id);
    }

    setPosts(data.map(p => ({
      ...p,
      profile: pMap[p.user_id],
      like_count: (likesByPost[p.id] ?? []).length,
      liked_by_me: (likesByPost[p.id] ?? []).includes(userId),
    })));
    setLoading(false);
  }, [crewId, supabase, userId]);

  useEffect(() => { load(); }, [load]);

  async function submitPost() {
    if (!content.trim()) return;
    setPosting(true);
    await supabase.from("crew_posts").insert({ crew_id: crewId, user_id: userId, content: content.trim() });
    setContent("");
    await load();
    setPosting(false);
  }

  async function toggleLike(post: Post) {
    if (post.liked_by_me) {
      await supabase.from("crew_post_likes").delete().eq("post_id", post.id).eq("user_id", userId);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, like_count: p.like_count - 1, liked_by_me: false } : p));
    } else {
      await supabase.from("crew_post_likes").insert({ post_id: post.id, user_id: userId });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, like_count: p.like_count + 1, liked_by_me: true } : p));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Compose */}
      <div className="rounded-2xl p-4 border" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
        <textarea
          value={content} onChange={e => setContent(e.target.value)}
          placeholder="Share something with the crew…"
          rows={3}
          className="w-full text-sm resize-none focus:outline-none placeholder:text-zinc-400"
          style={{ background: "transparent", color: "var(--c-text1)" }}
        />
        <div className="flex justify-end mt-2">
          <button onClick={submitPost} disabled={!content.trim() || posting}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white active:scale-95 transition-transform disabled:opacity-40"
            style={{ background: accentColor }}>
            {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-4 border animate-pulse" style={{ background: "var(--c-card)", borderColor: "var(--c-border)", height: 100 }} />
        ))
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12">
          <span className="text-3xl">💬</span>
          <p className="text-sm" style={{ color: "var(--c-text3)" }}>Be the first to post in this crew!</p>
        </div>
      ) : (
        posts.map(post => {
          const name = post.profile?.full_name ?? "Member";
          return (
            <div key={post.id} className="rounded-2xl p-4 border" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
              <div className="flex items-center gap-2.5 mb-3">
                <Link href={`/profile/${post.user_id}`}>
                  <Avatar name={name} url={post.profile?.avatar_url} size={10} />
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: "var(--c-text1)" }}>{name}</p>
                  <p className="text-[11px]" style={{ color: "var(--c-text3)" }}>
                    {post.profile?.role ?? "Member"} · {timeAgo(post.created_at)}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--c-text1)" }}>{post.content}</p>
              <div className="flex items-center gap-1 mt-3">
                <button onClick={() => toggleLike(post)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium active:scale-95 transition-all"
                  style={{
                    background: post.liked_by_me ? "rgba(74,39,232,0.08)" : "var(--c-muted)",
                    color: post.liked_by_me ? "#4A27E8" : "var(--c-text3)",
                    border: post.liked_by_me ? "1px solid rgba(74,39,232,0.2)" : "1px solid transparent",
                  }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill={post.liked_by_me ? "currentColor" : "none"}>
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                      stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                  </svg>
                  {post.like_count > 0 && <span>{post.like_count}</span>}
                  {!post.liked_by_me && <span>Like</span>}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Events Tab ─────────────────────────────────────────────────────────────────
function EventsTab({ crewId, userId, accentColor }: { crewId: string; userId: string; accentColor: string }) {
  const supabase = createClient();
  const [events, setEvents]   = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvping, setRsvping] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("crew_events")
      .select("id, crew_id, title, description, event_date, location, created_by")
      .eq("crew_id", crewId)
      .order("event_date", { ascending: true });

    if (!data?.length) { setLoading(false); return; }

    const { data: rsvps } = await supabase
      .from("crew_event_rsvps")
      .select("event_id, user_id")
      .in("event_id", data.map(e => e.id));

    const rsvpsByEvent: Record<string, string[]> = {};
    for (const r of rsvps ?? []) {
      if (!rsvpsByEvent[r.event_id]) rsvpsByEvent[r.event_id] = [];
      rsvpsByEvent[r.event_id].push(r.user_id);
    }

    setEvents(data.map(e => ({
      ...e,
      rsvp_count: (rsvpsByEvent[e.id] ?? []).length,
      rsvp_by_me: (rsvpsByEvent[e.id] ?? []).includes(userId),
    })));
    setLoading(false);
  }, [crewId, supabase, userId]);

  useEffect(() => { load(); }, [load]);

  async function toggleRsvp(event: Event) {
    setRsvping(event.id);
    if (event.rsvp_by_me) {
      await supabase.from("crew_event_rsvps").delete().eq("event_id", event.id).eq("user_id", userId);
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, rsvp_count: e.rsvp_count - 1, rsvp_by_me: false } : e));
    } else {
      await supabase.from("crew_event_rsvps").insert({ event_id: event.id, user_id: userId });
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, rsvp_count: e.rsvp_count + 1, rsvp_by_me: true } : e));
    }
    setRsvping(null);
  }

  if (loading) return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-4 border animate-pulse" style={{ background: "var(--c-card)", borderColor: "var(--c-border)", height: 140 }} />
      ))}
    </div>
  );

  if (!events.length) return (
    <div className="flex flex-col items-center gap-2 py-12">
      <span className="text-3xl">📅</span>
      <p className="text-sm" style={{ color: "var(--c-text3)" }}>No upcoming events yet</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {events.map(evt => {
        const isPast = new Date(evt.event_date) < new Date();
        return (
          <div key={evt.id} className="rounded-2xl p-4 border" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
                   style={{ background: "rgba(74,39,232,0.08)" }}>
                📍
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ color: "var(--c-text1)" }}>{evt.title}</p>
                {evt.description && (
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--c-text2)" }}>{evt.description}</p>
                )}
                <div className="flex flex-col gap-0.5 mt-2">
                  <p className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--c-text2)" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                    {fmtDate(evt.event_date)}
                  </p>
                  {evt.location && (
                    <p className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--c-text2)" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="1.8"/>
                        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/>
                      </svg>
                      {evt.location}
                    </p>
                  )}
                  <p className="text-xs" style={{ color: "var(--c-text3)" }}>
                    {evt.rsvp_count} going
                  </p>
                </div>
              </div>
            </div>

            {!isPast && (
              <button onClick={() => toggleRsvp(evt)} disabled={rsvping === evt.id}
                className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-all disabled:opacity-50"
                style={evt.rsvp_by_me
                  ? { background: "rgba(52,211,153,0.1)", color: "#059669", border: "1px solid rgba(52,211,153,0.3)" }
                  : { background: accentColor, color: "white" }}>
                {rsvping === evt.id ? "…" : evt.rsvp_by_me ? "Going ✓ (cancel RSVP)" : "RSVP — I'm going!"}
              </button>
            )}
            {isPast && (
              <div className="mt-3 py-2 text-center text-xs font-medium rounded-xl"
                   style={{ background: "var(--c-muted)", color: "var(--c-text3)" }}>
                Event passed
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Members Tab ────────────────────────────────────────────────────────────────
function MembersTab({ crewId }: { crewId: string }) {
  const supabase = createClient();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("crew_members")
        .select("user_id, role, joined_at")
        .eq("crew_id", crewId)
        .order("joined_at", { ascending: true });

      if (!data?.length) { setLoading(false); return; }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, company")
        .in("id", data.map(m => m.user_id));
      const pMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

      setMembers(data.map(m => ({ ...m, profile: pMap[m.user_id] })));
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crewId]);

  if (loading) return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-4 border animate-pulse" style={{ background: "var(--c-card)", borderColor: "var(--c-border)", height: 72 }} />
      ))}
    </div>
  );

  if (!members.length) return (
    <div className="flex flex-col items-center gap-2 py-12">
      <span className="text-3xl">👥</span>
      <p className="text-sm" style={{ color: "var(--c-text3)" }}>No members yet</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      {members.map(m => {
        const name = m.profile?.full_name ?? "Member";
        return (
          <Link key={m.user_id} href={`/profile/${m.user_id}`}
            className="flex items-center gap-3 p-3.5 rounded-2xl border active:opacity-80 transition-opacity"
            style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
            <Avatar name={name} url={m.profile?.avatar_url} size={10} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: "var(--c-text1)" }}>{name}</p>
              <p className="text-xs truncate" style={{ color: "var(--c-text2)" }}>
                {[m.profile?.role, m.profile?.company].filter(Boolean).join(" @ ") || "SkyLink Member"}
              </p>
            </div>
            {m.role === "admin" && (
              <span className="text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 px-2 py-1 rounded-full flex-shrink-0">
                Admin
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function CrewDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const router   = useRouter();

  const [crew, setCrew]         = useState<Crew | null>(null);
  const [userId, setUserId]     = useState("");
  const [isMember, setIsMember] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [joining, setJoining]   = useState(false);
  const [tab, setTab]           = useState<"feed" | "events" | "members">("feed");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: crewData } = await supabase
        .from("crews")
        .select("id, name, description, icon, created_by, created_at")
        .eq("id", params.id)
        .single();

      if (!crewData) { router.push("/crews"); return; }
      setCrew(crewData);

      const { data: members, count } = await supabase
        .from("crew_members")
        .select("user_id", { count: "exact" })
        .eq("crew_id", params.id);

      setMemberCount(count ?? 0);
      setIsMember((members ?? []).some(m => m.user_id === user.id));
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function joinCrew() {
    setJoining(true);
    await supabase.from("crew_members").insert({ crew_id: params.id, user_id: userId, role: "member" });
    setIsMember(true);
    setMemberCount(prev => prev + 1);
    setJoining(false);
  }

  async function leaveCrew() {
    setJoining(true);
    await supabase.from("crew_members").delete().eq("crew_id", params.id).eq("user_id", userId);
    setIsMember(false);
    setMemberCount(prev => Math.max(0, prev - 1));
    setJoining(false);
  }

  if (loading || !crew) {
    return (
      <div className="flex items-center justify-center py-32">
        <svg className="animate-spin w-7 h-7 text-brand" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>
    );
  }

  const TABS = [
    { key: "feed",    label: "Feed"    },
    { key: "events",  label: "Events"  },
    { key: "members", label: "Members" },
  ] as const;

  const theme = getCrewTheme(crew.id);

  return (
    <div className="animate-fade-in pb-6">

      {/* Back nav — sits above the hero card */}
      <div className="px-4 flex items-center gap-2"
           style={{ paddingTop: "max(16px, env(safe-area-inset-top))", paddingBottom: 12 }}>
        <Link href="/crews"
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "var(--c-muted)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="var(--c-text1)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </Link>
        <Link href="/crews" className="text-sm font-semibold" style={{ color: "var(--c-text2)" }}>Sky Crews</Link>
      </div>

      {/* ── Hero card — full-bleed, unique per crew ── */}
      <div className="mx-4 rounded-3xl overflow-hidden relative mb-4"
           style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>

        {/* Illustration — fills right half, clipped */}
        <div className="absolute right-0 top-0 w-[55%] h-full opacity-90 pointer-events-none">
          {theme.illustration}
        </div>

        {/* Content */}
        <div className="relative p-5 pr-[46%]">
          {/* Category label */}
          <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
                style={{ background: theme.accentBadgeBg, color: theme.accent }}>
            {theme.label}
          </span>

          {/* Icon + name */}
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-3xl leading-none">{crew.icon}</span>
          </div>
          <h1 className="text-[22px] font-black leading-tight mb-2" style={{ color: theme.accentText }}>
            {crew.name}
          </h1>

          {crew.description && (
            <p className="text-xs leading-relaxed mb-4 line-clamp-3" style={{ color: theme.accent, opacity: 0.75 }}>
              {crew.description}
            </p>
          )}

          {/* Footer row */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold" style={{ color: theme.accent, opacity: 0.65 }}>
              {memberCount} member{memberCount !== 1 ? "s" : ""}
            </span>
            {isMember ? (
              <>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: theme.accentBadgeBg, color: theme.accent }}>
                  Joined ✓
                </span>
                <button onClick={leaveCrew} disabled={joining}
                  className="text-[11px] font-medium active:opacity-60 transition-opacity disabled:opacity-40"
                  style={{ color: theme.accent, opacity: 0.55 }}>
                  Leave
                </button>
              </>
            ) : (
              <button onClick={joinCrew} disabled={joining}
                className="text-[12px] font-bold px-4 py-1.5 rounded-full active:scale-95 transition-transform disabled:opacity-60"
                style={{ background: theme.accent, color: "white" }}>
                {joining ? "Joining…" : "Join Crew"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <div className="flex rounded-2xl p-1 mb-4" style={{ background: "var(--c-muted)" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${t.key === tab ? "shadow-sm" : ""}`}
              style={{
                background: t.key === tab ? "var(--c-card)" : "transparent",
                color: t.key === tab ? "var(--c-text1)" : "var(--c-text3)",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4">
        {tab === "feed"    && <FeedTab    crewId={params.id} userId={userId} accentColor={theme.accent} />}
        {tab === "events"  && <EventsTab  crewId={params.id} userId={userId} accentColor={theme.accent} />}
        {tab === "members" && <MembersTab crewId={params.id} />}
      </div>
    </div>
  );
}
