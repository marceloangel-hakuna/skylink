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
  header_style: string | null;
  header_svg: string | null;
  created_by: string | null;
  created_at: string;
};

type Post = {
  id: string;
  crew_id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_post_id: string | null;
  profile?: { full_name: string | null; avatar_url: string | null; role: string | null };
  like_count: number;
  liked_by_me: boolean;
  replies?: Post[];
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

// Theme options for the picker (create + edit)
import { THEME_OPTIONS } from "../themes";
export type { ThemeKey } from "../themes";

const ICONS = ["✈️","🚀","💼","🤖","🌎","🏙️","🌴","🍸","☕","🎯","📡","🌐","💡","🎤","🏄","🎸","🧬","🌿","🏔️","🌊"];

// ── Illustrations ──────────────────────────────────────────────────────────────
const IllustrationSkyline = () => (
  <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="20"  cy="18" r="1.5" fill="#C2410C" fillOpacity="0.3"/>
    <circle cx="55"  cy="10" r="1"   fill="#C2410C" fillOpacity="0.25"/>
    <circle cx="90"  cy="22" r="1.5" fill="#C2410C" fillOpacity="0.2"/>
    <circle cx="130" cy="8"  r="1"   fill="#C2410C" fillOpacity="0.3"/>
    <circle cx="148" cy="30" r="1"   fill="#C2410C" fillOpacity="0.2"/>
    <path d="M135 14 Q148 22 138 32 Q152 28 148 16 Q144 8 135 14Z" fill="#C2410C" fillOpacity="0.12"/>
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
    <rect x="65"  y="60" width="3" height="3" rx="0.5" fill="#C2410C" fillOpacity="0.2"/>
    <rect x="72"  y="60" width="3" height="3" rx="0.5" fill="#C2410C" fillOpacity="0.15"/>
    <rect x="65"  y="68" width="3" height="3" rx="0.5" fill="#C2410C" fillOpacity="0.18"/>
    <rect x="72"  y="68" width="3" height="3" rx="0.5" fill="#C2410C" fillOpacity="0.12"/>
    <rect x="22"  y="76" width="2.5" height="2.5" rx="0.5" fill="#C2410C" fillOpacity="0.18"/>
    <rect x="28"  y="76" width="2.5" height="2.5" rx="0.5" fill="#C2410C" fillOpacity="0.14"/>
    <path d="M108 35 L116 32 L118 35 L116 38Z M108 34 L111 30 L112 34Z M108 36 L111 40 L112 36Z" fill="#C2410C" fillOpacity="0.25"/>
    <line x1="0" y1="120" x2="160" y2="120" stroke="#C2410C" strokeOpacity="0.08" strokeWidth="1"/>
  </svg>
);

const IllustrationNeural = () => (
  <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
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
    <circle cx="20"  cy="40"  r="5"   fill="#1D4ED8" fillOpacity="0.18"/>
    <circle cx="20"  cy="40"  r="2"   fill="#1D4ED8" fillOpacity="0.3"/>
    <circle cx="60"  cy="25"  r="5.5" fill="#1D4ED8" fillOpacity="0.15"/>
    <circle cx="60"  cy="25"  r="2.5" fill="#1D4ED8" fillOpacity="0.25"/>
    <circle cx="60"  cy="60"  r="5.5" fill="#1D4ED8" fillOpacity="0.18"/>
    <circle cx="60"  cy="60"  r="2.5" fill="#1D4ED8" fillOpacity="0.3"/>
    <circle cx="60"  cy="95"  r="5.5" fill="#1D4ED8" fillOpacity="0.12"/>
    <circle cx="60"  cy="95"  r="2.5" fill="#1D4ED8" fillOpacity="0.2"/>
    <circle cx="105" cy="15"  r="5"   fill="#1D4ED8" fillOpacity="0.14"/>
    <circle cx="105" cy="15"  r="2"   fill="#1D4ED8" fillOpacity="0.22"/>
    <circle cx="105" cy="45"  r="6"   fill="#1D4ED8" fillOpacity="0.2"/>
    <circle cx="105" cy="45"  r="3"   fill="#1D4ED8" fillOpacity="0.32"/>
    <circle cx="105" cy="75"  r="5.5" fill="#1D4ED8" fillOpacity="0.16"/>
    <circle cx="105" cy="75"  r="2.5" fill="#1D4ED8" fillOpacity="0.26"/>
    <circle cx="105" cy="105" r="4.5" fill="#1D4ED8" fillOpacity="0.12"/>
    <circle cx="105" cy="105" r="2"   fill="#1D4ED8" fillOpacity="0.2"/>
    <circle cx="145" cy="35"  r="6"   fill="#1D4ED8" fillOpacity="0.22"/>
    <circle cx="145" cy="35"  r="3"   fill="#1D4ED8" fillOpacity="0.35"/>
    <circle cx="145" cy="70"  r="5"   fill="#1D4ED8" fillOpacity="0.16"/>
    <circle cx="145" cy="70"  r="2"   fill="#1D4ED8" fillOpacity="0.28"/>
    <circle cx="12"  cy="95"  r="2"   fill="#1D4ED8" fillOpacity="0.1"/>
    <circle cx="135" cy="100" r="2.5" fill="#1D4ED8" fillOpacity="0.1"/>
    <circle cx="80"  cy="108" r="1.5" fill="#1D4ED8" fillOpacity="0.1"/>
  </svg>
);

const IllustrationGlobe = () => (
  <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="100" cy="58" r="52" stroke="#065F46" strokeOpacity="0.12" strokeWidth="1.5"/>
    <circle cx="100" cy="58" r="52" fill="#065F46" fillOpacity="0.03"/>
    <ellipse cx="100" cy="58" rx="52" ry="14" stroke="#065F46" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="3 3"/>
    <ellipse cx="100" cy="40" rx="48" ry="10" stroke="#065F46" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="3 3"/>
    <ellipse cx="100" cy="76" rx="48" ry="10" stroke="#065F46" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="3 3"/>
    <ellipse cx="100" cy="22" rx="34" ry="7"  stroke="#065F46" strokeOpacity="0.07" strokeWidth="1" strokeDasharray="3 3"/>
    <ellipse cx="100" cy="94" rx="34" ry="7"  stroke="#065F46" strokeOpacity="0.07" strokeWidth="1" strokeDasharray="3 3"/>
    <path d="M100 6 Q130 30 130 58 Q130 86 100 110" stroke="#065F46" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="3 3"/>
    <path d="M100 6 Q70 30 70 58 Q70 86 100 110"  stroke="#065F46" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="3 3"/>
    <line x1="100" y1="6" x2="100" y2="110" stroke="#065F46" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="3 3"/>
    <path d="M78 44 Q86 38 94 42 Q98 50 90 54 Q82 56 78 50Z" fill="#065F46" fillOpacity="0.15"/>
    <path d="M104 38 Q114 34 118 42 Q116 50 108 52 Q102 48 104 38Z" fill="#065F46" fillOpacity="0.12"/>
    <path d="M82 62 Q88 58 96 62 Q98 70 92 74 Q84 74 82 66Z" fill="#065F46" fillOpacity="0.1"/>
    <path d="M106 64 Q112 62 116 68 Q114 76 108 76 Q104 72 106 64Z" fill="#065F46" fillOpacity="0.13"/>
    <circle cx="86"  cy="46" r="2"   fill="#065F46" fillOpacity="0.4"/>
    <circle cx="112" cy="44" r="1.5" fill="#065F46" fillOpacity="0.35"/>
    <circle cx="94"  cy="70" r="2"   fill="#065F46" fillOpacity="0.3"/>
    <path d="M86 46 Q100 28 112 44" stroke="#065F46" strokeOpacity="0.25" strokeWidth="1.2" strokeDasharray="2 2"/>
    <path d="M97 33 L101 31 L102 33 L101 35Z M97 32 L99 29 L99.5 32Z M97 34 L99 37 L99.5 34Z" fill="#065F46" fillOpacity="0.35"/>
    <circle cx="28"  cy="20"  r="1.5" fill="#065F46" fillOpacity="0.2"/>
    <circle cx="15"  cy="55"  r="1"   fill="#065F46" fillOpacity="0.15"/>
    <circle cx="40"  cy="90"  r="1.5" fill="#065F46" fillOpacity="0.15"/>
    <circle cx="148" cy="18"  r="1"   fill="#065F46" fillOpacity="0.2"/>
    <circle cx="155" cy="90"  r="1.5" fill="#065F46" fillOpacity="0.15"/>
  </svg>
);

// Accurate Golden Gate Bridge: twin-legged towers with cross-braces + catenary cables
const IllustrationGoldenGate = () => (
  <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Sky glow */}
    <circle cx="80" cy="50" r="55" fill="#92400E" fillOpacity="0.05"/>
    {/* Marin headlands (rolling hills, left) */}
    <path d="M0 88 Q10 72 28 76 Q38 78 46 82 L0 82Z" fill="#92400E" fillOpacity="0.11"/>
    {/* East Bay hills (right) */}
    <path d="M118 84 Q134 68 152 72 Q158 74 160 76 L160 84Z" fill="#92400E" fillOpacity="0.09"/>
    {/* Bay water */}
    <path d="M0 90 Q40 86 80 90 Q120 94 160 90 L160 120 L0 120Z" fill="#92400E" fillOpacity="0.06"/>
    <path d="M0 97 Q28 93 56 97 Q84 101 112 97 Q136 94 160 97" stroke="#92400E" strokeOpacity="0.09" strokeWidth="0.8"/>
    <path d="M0 105 Q22 101 48 105 Q78 109 110 105 Q136 102 160 105" stroke="#92400E" strokeOpacity="0.06" strokeWidth="0.7"/>

    {/* ── LEFT TOWER (twin-legged, Art Deco) ── */}
    {/* Left leg */}
    <rect x="42" y="24" width="6" height="62" rx="0.5" fill="#92400E" fillOpacity="0.22"/>
    {/* Right leg */}
    <rect x="52" y="24" width="6" height="62" rx="0.5" fill="#92400E" fillOpacity="0.22"/>
    {/* Portal braces (horizontal cross-members between legs) */}
    <rect x="42" y="24" width="16" height="2.5" rx="0.5" fill="#92400E" fillOpacity="0.18"/>
    <rect x="42" y="39" width="16" height="2.5" rx="0.5" fill="#92400E" fillOpacity="0.15"/>
    <rect x="42" y="55" width="16" height="2.5" rx="0.5" fill="#92400E" fillOpacity="0.13"/>
    <rect x="42" y="71" width="16" height="2.5" rx="0.5" fill="#92400E" fillOpacity="0.11"/>
    {/* Art Deco cap — stepped pyramid */}
    <rect x="40" y="17" width="20" height="8" rx="0.5" fill="#92400E" fillOpacity="0.24"/>
    <rect x="43" y="10" width="14" height="8" rx="0.5" fill="#92400E" fillOpacity="0.22"/>
    <rect x="46" y="4"  width="8"  height="7" rx="0.5" fill="#92400E" fillOpacity="0.20"/>
    <rect x="48" y="0"  width="4"  height="5" rx="0.5" fill="#92400E" fillOpacity="0.22"/>

    {/* ── RIGHT TOWER (twin-legged, Art Deco) ── */}
    <rect x="102" y="24" width="6" height="62" rx="0.5" fill="#92400E" fillOpacity="0.22"/>
    <rect x="112" y="24" width="6" height="62" rx="0.5" fill="#92400E" fillOpacity="0.22"/>
    <rect x="102" y="24" width="16" height="2.5" rx="0.5" fill="#92400E" fillOpacity="0.18"/>
    <rect x="102" y="39" width="16" height="2.5" rx="0.5" fill="#92400E" fillOpacity="0.15"/>
    <rect x="102" y="55" width="16" height="2.5" rx="0.5" fill="#92400E" fillOpacity="0.13"/>
    <rect x="102" y="71" width="16" height="2.5" rx="0.5" fill="#92400E" fillOpacity="0.11"/>
    <rect x="100" y="17" width="20" height="8" rx="0.5" fill="#92400E" fillOpacity="0.24"/>
    <rect x="103" y="10" width="14" height="8" rx="0.5" fill="#92400E" fillOpacity="0.22"/>
    <rect x="106" y="4"  width="8"  height="7" rx="0.5" fill="#92400E" fillOpacity="0.20"/>
    <rect x="108" y="0"  width="4"  height="5" rx="0.5" fill="#92400E" fillOpacity="0.22"/>

    {/* ── MAIN SUSPENSION CABLES ── */}
    {/* Left anchor → left tower */}
    <path d="M0 87 Q22 70 49 24" stroke="#92400E" strokeOpacity="0.22" strokeWidth="1.4" fill="none"/>
    {/* Center catenary span */}
    <path d="M49 24 Q80 50 111 24" stroke="#92400E" strokeOpacity="0.25" strokeWidth="1.4" fill="none"/>
    {/* Right tower → right anchor */}
    <path d="M111 24 Q138 70 160 87" stroke="#92400E" strokeOpacity="0.22" strokeWidth="1.4" fill="none"/>

    {/* ── VERTICAL HANGER CABLES (center span) ── */}
    {/* Computed from catenary Q49,24 → Q80,50 → Q111,24 */}
    <line x1="61"  y1="32" x2="61"  y2="82" stroke="#92400E" strokeOpacity="0.13" strokeWidth="0.9"/>
    <line x1="68"  y1="35" x2="68"  y2="82" stroke="#92400E" strokeOpacity="0.13" strokeWidth="0.9"/>
    <line x1="74"  y1="37" x2="74"  y2="82" stroke="#92400E" strokeOpacity="0.13" strokeWidth="0.9"/>
    <line x1="80"  y1="37" x2="80"  y2="82" stroke="#92400E" strokeOpacity="0.13" strokeWidth="0.9"/>
    <line x1="86"  y1="37" x2="86"  y2="82" stroke="#92400E" strokeOpacity="0.13" strokeWidth="0.9"/>
    <line x1="92"  y1="35" x2="92"  y2="82" stroke="#92400E" strokeOpacity="0.13" strokeWidth="0.9"/>
    <line x1="99"  y1="32" x2="99"  y2="82" stroke="#92400E" strokeOpacity="0.13" strokeWidth="0.9"/>

    {/* ── BRIDGE DECK ── */}
    <rect x="0" y="81" width="160" height="3"   rx="0.5" fill="#92400E" fillOpacity="0.20"/>
    <rect x="0" y="84" width="160" height="1.5" rx="0.5" fill="#92400E" fillOpacity="0.10"/>

    {/* Tiny cars on the deck */}
    <circle cx="66" cy="82" r="1.2" fill="#92400E" fillOpacity="0.32"/>
    <circle cx="82" cy="82" r="1.2" fill="#92400E" fillOpacity="0.28"/>
    <circle cx="97" cy="82" r="1.2" fill="#92400E" fillOpacity="0.32"/>

    {/* Fog wisps */}
    <path d="M0 72 Q13 68 24 72 Q15 76 0 74Z"         fill="#92400E" fillOpacity="0.05"/>
    <path d="M136 68 Q150 64 160 68 Q152 72 136 70Z"  fill="#92400E" fillOpacity="0.05"/>
  </svg>
);

const IllustrationVibrant = () => (
  <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="120" cy="30" r="42" fill="#BE123C" fillOpacity="0.06"/>
    <circle cx="35"  cy="95" r="28" fill="#BE123C" fillOpacity="0.05"/>
    {/* 4-point sparkle stars */}
    <path d="M28,18 L30,23 L35,25 L30,27 L28,32 L26,27 L21,25 L26,23Z" fill="#BE123C" fillOpacity="0.12"/>
    <path d="M125,50 L127,55 L132,57 L127,59 L125,64 L123,59 L118,57 L123,55Z" fill="#BE123C" fillOpacity="0.10"/>
    <path d="M75,10 L76.5,14 L80.5,15.5 L76.5,17 L75,21 L73.5,17 L69.5,15.5 L73.5,14Z" fill="#BE123C" fillOpacity="0.14"/>
    <path d="M50,80 L51.5,84 L55.5,85.5 L51.5,87 L50,91 L48.5,87 L44.5,85.5 L48.5,84Z" fill="#BE123C" fillOpacity="0.10"/>
    <path d="M138,90 L139.5,94 L143.5,95.5 L139.5,97 L138,101 L136.5,97 L132.5,95.5 L136.5,94Z" fill="#BE123C" fillOpacity="0.08"/>
    {/* Dots */}
    <circle cx="60"  cy="35"  r="3" fill="#BE123C" fillOpacity="0.12"/>
    <circle cx="105" cy="25"  r="2" fill="#BE123C" fillOpacity="0.10"/>
    <circle cx="145" cy="65"  r="3" fill="#BE123C" fillOpacity="0.10"/>
    <circle cx="22"  cy="55"  r="2" fill="#BE123C" fillOpacity="0.10"/>
    <circle cx="80"  cy="100" r="3" fill="#BE123C" fillOpacity="0.09"/>
    <circle cx="155" cy="35"  r="2" fill="#BE123C" fillOpacity="0.10"/>
    {/* Confetti rectangles */}
    <rect x="92" y="68" width="5" height="5" rx="1" fill="#BE123C" fillOpacity="0.10" transform="rotate(15 94 70)"/>
    <rect x="32" y="42" width="4" height="4" rx="1" fill="#BE123C" fillOpacity="0.12" transform="rotate(-10 34 44)"/>
    <rect x="138" y="105" width="5" height="5" rx="1" fill="#BE123C" fillOpacity="0.08" transform="rotate(25 140 107)"/>
    {/* Plane */}
    <path d="M70 48 L78 44 L80 48 L78 52Z M70 47 L73 42 L74 47Z M70 49 L73 54 L74 49Z" fill="#BE123C" fillOpacity="0.28"/>
    {/* Streaks */}
    <line x1="108" y1="42" x2="124" y2="42" stroke="#BE123C" strokeOpacity="0.12" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="32"  y1="76" x2="46"  y2="76" stroke="#BE123C" strokeOpacity="0.10" strokeWidth="1"   strokeLinecap="round"/>
    <line x1="110" y1="48" x2="122" y2="48" stroke="#BE123C" strokeOpacity="0.08" strokeWidth="1"   strokeLinecap="round"/>
  </svg>
);

const IllustrationOcean = () => (
  <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Glow */}
    <circle cx="120" cy="25" r="32" fill="#0F766E" fillOpacity="0.08"/>
    {/* Stars */}
    <circle cx="25"  cy="18" r="1.5" fill="#0F766E" fillOpacity="0.20"/>
    <circle cx="55"  cy="8"  r="1"   fill="#0F766E" fillOpacity="0.18"/>
    <circle cx="90"  cy="15" r="1.5" fill="#0F766E" fillOpacity="0.15"/>
    <circle cx="150" cy="30" r="1"   fill="#0F766E" fillOpacity="0.18"/>
    {/* Moon */}
    <path d="M132 12 Q145 20 136 30 Q150 26 146 15 Q141 7 132 12Z" fill="#0F766E" fillOpacity="0.12"/>
    {/* Plane */}
    <path d="M60 32 L68 28 L70 32 L68 36Z M60 31 L63 26 L64 31Z M60 33 L63 38 L64 33Z" fill="#0F766E" fillOpacity="0.30"/>
    {/* Wave layers */}
    <path d="M0 58 Q20 48 40 58 Q60 68 80 58 Q100 48 120 58 Q140 68 160 58 L160 120 L0 120Z" fill="#0F766E" fillOpacity="0.07"/>
    <path d="M0 70 Q25 58 50 68 Q75 78 100 68 Q125 58 160 70 L160 120 L0 120Z" fill="#0F766E" fillOpacity="0.08"/>
    <path d="M0 82 Q30 72 60 80 Q90 88 120 80 Q145 72 160 82 L160 120 L0 120Z" fill="#0F766E" fillOpacity="0.10"/>
    <path d="M0 92 Q35 84 70 92 Q105 100 140 92 Q150 89 160 92 L160 120 L0 120Z" fill="#0F766E" fillOpacity="0.12"/>
    {/* Wave crests */}
    <path d="M0 58 Q20 48 40 58 Q60 68 80 58 Q100 48 120 58 Q140 68 160 58" stroke="#0F766E" strokeOpacity="0.14" strokeWidth="1.5" fill="none"/>
    <path d="M0 70 Q25 58 50 68 Q75 78 100 68 Q125 58 160 70" stroke="#0F766E" strokeOpacity="0.10" strokeWidth="1" fill="none"/>
    {/* Foam dots */}
    <circle cx="40"  cy="58" r="1.5" fill="#0F766E" fillOpacity="0.18"/>
    <circle cx="80"  cy="58" r="1.5" fill="#0F766E" fillOpacity="0.18"/>
    <circle cx="120" cy="58" r="1.5" fill="#0F766E" fillOpacity="0.18"/>
  </svg>
);

// Generic dot pattern for fallback (used by getCrewTheme hash fallback)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// ── Style-based Theme System ────────────────────────────────────────────────────
const STYLE_THEMES: Record<string, CrewTheme> = {
  city: {
    bg:           "linear-gradient(150deg, #FFF7ED 0%, #FFEDD5 60%, #FED7AA 100%)",
    border:       "#FED7AA",
    accent:       "#C2410C",
    accentText:   "#9A3412",
    accentBadgeBg:"rgba(194,65,12,0.1)",
    label:        "City Life",
    illustration: <IllustrationSkyline />,
  },
  tech: {
    bg:           "linear-gradient(150deg, #EFF6FF 0%, #DBEAFE 60%, #BFDBFE 100%)",
    border:       "#BFDBFE",
    accent:       "#1D4ED8",
    accentText:   "#1E3A8A",
    accentBadgeBg:"rgba(29,78,216,0.1)",
    label:        "Tech & AI",
    illustration: <IllustrationNeural />,
  },
  globe: {
    bg:           "linear-gradient(150deg, #ECFDF5 0%, #D1FAE5 60%, #A7F3D0 100%)",
    border:       "#A7F3D0",
    accent:       "#065F46",
    accentText:   "#064E3B",
    accentBadgeBg:"rgba(6,95,70,0.1)",
    label:        "Global",
    illustration: <IllustrationGlobe />,
  },
  valley: {
    bg:           "linear-gradient(150deg, #FEFCE8 0%, #FEF9C3 55%, #FDE68A 100%)",
    border:       "#FDE68A",
    accent:       "#92400E",
    accentText:   "#78350F",
    accentBadgeBg:"rgba(146,64,14,0.1)",
    label:        "Bay Area",
    illustration: <IllustrationGoldenGate />,
  },
  vibrant: {
    bg:           "linear-gradient(150deg, #FFF1F2 0%, #FFE4E6 60%, #FECDD3 100%)",
    border:       "#FECDD3",
    accent:       "#BE123C",
    accentText:   "#9F1239",
    accentBadgeBg:"rgba(190,18,60,0.1)",
    label:        "Vibrant",
    illustration: <IllustrationVibrant />,
  },
  ocean: {
    bg:           "linear-gradient(150deg, #F0FDFA 0%, #CCFBF1 60%, #99F6E4 100%)",
    border:       "#99F6E4",
    accent:       "#0F766E",
    accentText:   "#115E59",
    accentBadgeBg:"rgba(15,118,110,0.1)",
    label:        "Ocean",
    illustration: <IllustrationOcean />,
  },
};

// Built-in crew → style mapping
const CREW_ID_TO_STYLE: Record<string, string> = {
  "11111111-0000-0000-0000-000000000001": "city",
  "11111111-0000-0000-0000-000000000002": "tech",
  "11111111-0000-0000-0000-000000000003": "globe",
  "11111111-0000-0000-0000-000000000004": "valley",
};

function getCrewTheme(crewId: string, headerStyle?: string | null): CrewTheme {
  // 1. Explicit style saved by user
  if (headerStyle && headerStyle !== "auto" && STYLE_THEMES[headerStyle]) {
    return STYLE_THEMES[headerStyle];
  }
  // 2. Built-in crew seeded style
  const seeded = CREW_ID_TO_STYLE[crewId];
  if (seeded) return STYLE_THEMES[seeded];
  // 3. Hash fallback for user-created crews
  const hash = crewId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const keys = Object.keys(STYLE_THEMES);
  return STYLE_THEMES[keys[hash % keys.length]];
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
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
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function Avatar({ name, url, size = 10 }: { name: string; url?: string | null; size?: number }) {
  const cls = `rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold`;
  const sz  = size === 10 ? "w-10 h-10 text-sm" : size === 12 ? "w-12 h-12 text-sm" : "w-8 h-8 text-xs";
  if (url) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} className={`${cls} ${sz} object-cover`} />
  );
  return <div className={`${cls} ${sz} ${avatarColor(name)}`}>{initials(name)}</div>;
}

// ── Edit Sheet ─────────────────────────────────────────────────────────────────
function EditSheet({
  crew, onClose, onSave,
}: {
  crew: Crew;
  onClose: () => void;
  onSave: (updates: Pick<Crew, "name" | "description" | "header_style" | "header_svg" | "icon">) => void;
}) {
  const supabase  = createClient();
  const router    = useRouter();
  const [name, setName]         = useState(crew.name);
  const [desc, setDesc]         = useState(crew.description ?? "");
  const [style, setStyle]       = useState<string>(
    crew.header_style && crew.header_style !== "auto" && crew.header_style !== "custom"
      ? crew.header_style
      : (CREW_ID_TO_STYLE[crew.id] ?? "city")
  );
  const [icon, setIcon]         = useState(crew.icon);
  const [customSvg, setCustomSvg] = useState<string | null>(crew.header_svg ?? null);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [generating, setGenerating]       = useState(false);

  // Lock body scroll while sheet is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  async function aiGenerate() {
    if (!name.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/crew/generate-header", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: desc }),
      });
      const data = await res.json();
      if (data.svg) {
        setCustomSvg(data.svg);
        setStyle("ai");
      }
    } catch { /* ignore */ }
    setGenerating(false);
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    const isAiStyle = style === "ai" && !!customSvg;
    const updates = {
      name: name.trim(),
      description: desc.trim() || null,
      header_style: isAiStyle ? "custom" : style,
      header_svg: isAiStyle ? customSvg : null,
      icon,
    };
    await supabase.from("crews").update(updates).eq("id", crew.id);
    onSave(updates);
    setSaving(false);
    onClose();
  }

  async function deleteCrew() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/crew/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crewId: crew.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Delete failed");
      router.replace("/crews");
    } catch (err) {
      console.error("Delete crew error:", err);
      setDeleteError(err instanceof Error ? err.message : "Delete failed. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[55] backdrop-blur-sm" onClick={onClose} />

      {/* Delete confirmation overlay */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-6">
          <div className="w-full rounded-3xl p-6 flex flex-col gap-4"
               style={{ background: "var(--background)", border: "1px solid var(--c-border)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
            <div className="text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-lg font-black mb-1" style={{ color: "var(--c-text1)" }}>Delete crew?</h3>
              <p className="text-sm" style={{ color: "var(--c-text2)" }}>
                This will permanently delete <strong>{crew.name}</strong> and all its posts and members. This cannot be undone.
              </p>
            </div>
            {deleteError && (
              <p className="text-xs text-center px-2 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", color: "#DC2626" }}>
                {deleteError}
              </p>
            )}
            <button
              onClick={deleteCrew}
              disabled={deleting}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: "#DC2626" }}>
              {deleting ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              ) : null}
              {deleting ? "Deleting…" : "Yes, Delete Crew"}
            </button>
            <button
              onClick={() => { setConfirmDelete(false); setDeleteError(null); }}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold"
              style={{ background: "var(--c-muted)", color: "var(--c-text1)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] rounded-t-3xl"
           style={{
             background: "var(--background)",
             maxHeight: "92dvh",
             overflowY: "auto",
             overscrollBehavior: "contain",
             WebkitOverflowScrolling: "touch",
             boxShadow: "0 -8px 40px rgba(0,0,0,0.25)",
             paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px) + 16px)",
           }}>

        {/* Drag handle */}
        <div className="sticky top-0 pt-3 pb-2 flex justify-center"
             style={{ background: "var(--background)" }}>
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--c-border)" }} />
        </div>

        <div className="px-5 pb-2 flex flex-col gap-5">
          {/* Title + close */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black" style={{ color: "var(--c-text1)" }}>Edit Crew</h2>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "var(--c-muted)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="var(--c-text2)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: "var(--c-text3)" }}>
              Crew Name *
            </label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              maxLength={60}
              className="w-full rounded-2xl px-4 py-3.5 text-sm border focus:outline-none focus:ring-2"
              style={{ background: "var(--c-muted)", borderColor: "var(--c-border)", color: "var(--c-text1)" }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: "var(--c-text3)" }}>
              Description
            </label>
            <textarea
              value={desc} onChange={e => setDesc(e.target.value)}
              rows={3} maxLength={280}
              className="w-full rounded-2xl px-4 py-3.5 text-sm border focus:outline-none focus:ring-2 resize-none"
              style={{ background: "var(--c-muted)", borderColor: "var(--c-border)", color: "var(--c-text1)" }}
            />
          </div>

          {/* Header style */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-3 block" style={{ color: "var(--c-text3)" }}>
              Header Style
            </label>

            {/* AI Generate CTA */}
            <div className="rounded-2xl p-3.5 mb-3 flex flex-col gap-2.5"
                 style={{ background: "linear-gradient(135deg, #1e1045 0%, #2d1b6e 100%)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                     style={{ background: "rgba(255,255,255,0.12)" }}>✨</div>
                <div>
                  <p className="text-xs font-bold text-white">Generate a unique header</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Claude designs a custom graphic based on the crew name
                  </p>
                </div>
              </div>
              <button
                onClick={aiGenerate}
                disabled={generating || !name.trim()}
                className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-60"
                style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}>
                {generating ? (
                  <>
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Generating…
                  </>
                ) : "✨ Generate with AI"}
              </button>
            </div>

            {/* AI Result preview */}
            {customSvg && (
              <button
                onClick={() => setStyle("ai")}
                className="w-full rounded-2xl overflow-hidden border-2 text-left mb-3 transition-all active:scale-[0.98]"
                style={{
                  borderColor: style === "ai" ? "#4A27E8" : "var(--c-border)",
                  boxShadow: style === "ai" ? "0 0 0 1px #4A27E8" : "none",
                }}>
                <div className="h-24 relative overflow-hidden"
                     dangerouslySetInnerHTML={{ __html: customSvg.replace('viewBox="0 0 400 160"', 'viewBox="0 0 400 160" style="width:100%;height:100%"') }} />
                <div className="px-3 py-2 flex items-center justify-between"
                     style={{ background: "var(--c-card)" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: "var(--c-text1)" }}>AI Generated</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-semibold"
                          style={{ background: "#4A27E8" }}>Unique</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); aiGenerate(); }}
                    disabled={generating}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full active:scale-95 transition-transform disabled:opacity-50"
                    style={{ background: "rgba(74,39,232,0.1)", color: "var(--color-brand-fg)" }}>
                    {generating ? "…" : "Regenerate"}
                  </button>
                </div>
              </button>
            )}

            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map(opt => (
                <button key={opt.key} onClick={() => setStyle(opt.key)}
                  className="rounded-xl overflow-hidden transition-all active:scale-95"
                  style={{
                    border: style === opt.key ? "2px solid #4A27E8" : "2px solid transparent",
                    boxShadow: style === opt.key ? "0 0 0 1px #4A27E8" : "none",
                  }}>
                  <div className="p-2.5 text-center" style={{ background: opt.bg }}>
                    <div className="text-xl mb-1">{opt.emoji}</div>
                    <p className="text-[10px] font-bold" style={{ color: "rgba(0,0,0,0.55)" }}>{opt.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-3 block" style={{ color: "var(--c-text3)" }}>
              Icon
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ICONS.map(ic => (
                <button key={ic} onClick={() => setIcon(ic)}
                  className="aspect-square rounded-xl flex items-center justify-center text-xl active:scale-90 transition-all"
                  style={{
                    background: icon === ic ? "rgba(74,39,232,0.12)" : "var(--c-card)",
                    border: icon === ic ? "2px solid #4A27E8" : "1px solid var(--c-border)",
                  }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="w-full py-4 rounded-2xl text-white font-bold text-sm active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #3418C8 0%, #4A27E8 100%)" }}>
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Saving…
              </>
            ) : "Save Changes"}
          </button>

          {/* Danger zone — delete */}
          <div className="pt-2 pb-1">
            <div className="h-px mb-4" style={{ background: "var(--c-border)" }} />
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Delete Crew
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Reply Row (indented thread item) ──────────────────────────────────────────
function ReplyRow({ reply, onToggleLike }: {
  reply: Post;
  onToggleLike: (post: Post, isReply: boolean) => void;
}) {
  const name = reply.profile?.full_name ?? "Member";
  return (
    <div className="flex gap-2.5 pt-3">
      {/* Thread line + avatar */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-px flex-1 rounded-full" style={{ background: "var(--c-border)", minHeight: 8 }} />
        <Link href={`/profile/${reply.user_id}`} className="mt-1.5">
          <Avatar name={name} url={reply.profile?.avatar_url} size={8} />
        </Link>
      </div>
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-baseline gap-1.5 mb-1">
          <p className="text-xs font-bold" style={{ color: "var(--c-text1)" }}>{name}</p>
          <p className="text-[10px]" style={{ color: "var(--c-text3)" }}>{timeAgo(reply.created_at)}</p>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--c-text1)" }}>{reply.content}</p>
        <button onClick={() => onToggleLike(reply, true)}
          className="flex items-center gap-1 mt-1.5 px-2 py-1 rounded-full text-[10px] font-medium active:scale-95 transition-all"
          style={{
            background: reply.liked_by_me ? "rgba(74,39,232,0.08)" : "var(--c-muted)",
            color: reply.liked_by_me ? "#4A27E8" : "var(--c-text3)",
          }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill={reply.liked_by_me ? "currentColor" : "none"}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
          {reply.like_count > 0 ? reply.like_count : "Like"}
        </button>
      </div>
    </div>
  );
}

// ── Feed Tab ───────────────────────────────────────────────────────────────────
function FeedTab({ crewId, userId, accentColor }: { crewId: string; userId: string; accentColor: string }) {
  const supabase = createClient();
  const [posts, setPosts]       = useState<Post[]>([]);
  const [loading, setLoading]   = useState(true);
  const [content, setContent]   = useState("");
  const [posting, setPosting]   = useState(false);
  // Per-post reply state
  const [replyOpen, setReplyOpen]     = useState<Record<string, boolean>>({});
  const [repliesOpen, setRepliesOpen] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText]     = useState<Record<string, string>>({});
  const [replyPosting, setReplyPosting] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("crew_posts")
      .select("id, crew_id, user_id, content, created_at, parent_post_id")
      .eq("crew_id", crewId)
      .order("created_at", { ascending: true })
      .limit(100);

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

    const enriched: Post[] = data.map(p => ({
      ...p,
      profile: pMap[p.user_id],
      like_count: (likesByPost[p.id] ?? []).length,
      liked_by_me: (likesByPost[p.id] ?? []).includes(userId),
      replies: [],
    }));

    // Build tree: top-level posts + attach replies
    const byId = Object.fromEntries(enriched.map(p => [p.id, p]));
    const topLevel: Post[] = [];
    for (const p of enriched) {
      if (p.parent_post_id && byId[p.parent_post_id]) {
        byId[p.parent_post_id].replies = [...(byId[p.parent_post_id].replies ?? []), p];
      } else if (!p.parent_post_id) {
        topLevel.push(p);
      }
    }

    // Show newest top-level posts first
    setPosts(topLevel.reverse());
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

  async function submitReply(postId: string) {
    const text = replyText[postId]?.trim();
    if (!text) return;
    setReplyPosting(prev => ({ ...prev, [postId]: true }));
    await supabase.from("crew_posts").insert({
      crew_id: crewId, user_id: userId, content: text, parent_post_id: postId,
    });
    setReplyText(prev => ({ ...prev, [postId]: "" }));
    setReplyOpen(prev => ({ ...prev, [postId]: false }));
    setRepliesOpen(prev => ({ ...prev, [postId]: true }));
    await load();
    setReplyPosting(prev => ({ ...prev, [postId]: false }));
  }

  async function toggleLike(post: Post, isReply = false) {
    if (post.liked_by_me) {
      await supabase.from("crew_post_likes").delete().eq("post_id", post.id).eq("user_id", userId);
    } else {
      await supabase.from("crew_post_likes").insert({ post_id: post.id, user_id: userId });
    }
    // Optimistic update in nested structure
    setPosts(prev => prev.map(p => {
      if (!isReply && p.id === post.id) {
        return { ...p, like_count: p.like_count + (post.liked_by_me ? -1 : 1), liked_by_me: !post.liked_by_me };
      }
      if (isReply && p.replies?.some(r => r.id === post.id)) {
        return { ...p, replies: p.replies!.map(r => r.id === post.id
          ? { ...r, like_count: r.like_count + (post.liked_by_me ? -1 : 1), liked_by_me: !post.liked_by_me }
          : r) };
      }
      return p;
    }));
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
          const replyCount = post.replies?.length ?? 0;
          const isReplyOpen   = replyOpen[post.id];
          const isRepliesOpen = repliesOpen[post.id];

          return (
            <div key={post.id} className="rounded-2xl border overflow-hidden" style={{ background: "var(--c-card)", borderColor: "var(--c-border)" }}>
              {/* Main post */}
              <div className="p-4">
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

                {/* Action row */}
                <div className="flex items-center gap-1.5 mt-3">
                  {/* Like */}
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
                    {post.like_count > 0 ? post.like_count : "Like"}
                  </button>

                  {/* Reply toggle */}
                  <button
                    onClick={() => setReplyOpen(prev => ({ ...prev, [post.id]: !isReplyOpen }))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium active:scale-95 transition-all"
                    style={{
                      background: isReplyOpen ? "rgba(74,39,232,0.08)" : "var(--c-muted)",
                      color: isReplyOpen ? "#4A27E8" : "var(--c-text3)",
                      border: isReplyOpen ? "1px solid rgba(74,39,232,0.2)" : "1px solid transparent",
                    }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                    </svg>
                    Reply
                  </button>

                  {/* View replies */}
                  {replyCount > 0 && (
                    <button
                      onClick={() => setRepliesOpen(prev => ({ ...prev, [post.id]: !isRepliesOpen }))}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium active:scale-95 transition-all"
                      style={{ background: "var(--c-muted)", color: "var(--c-text3)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d={isRepliesOpen ? "M18 15L12 9L6 15" : "M6 9L12 15L18 9"}
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      {replyCount} {replyCount === 1 ? "reply" : "replies"}
                    </button>
                  )}
                </div>
              </div>

              {/* Inline reply composer */}
              {isReplyOpen && (
                <div className="px-4 pb-3 border-t" style={{ borderColor: "var(--c-border)" }}>
                  <div className="flex gap-2.5 pt-3">
                    <div className="w-px self-stretch rounded-full flex-shrink-0" style={{ background: "var(--c-border)" }} />
                    <div className="flex-1">
                      <textarea
                        autoFocus
                        value={replyText[post.id] ?? ""}
                        onChange={e => setReplyText(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder={`Reply to ${name}…`}
                        rows={2}
                        className="w-full text-sm resize-none focus:outline-none placeholder:text-zinc-400"
                        style={{ background: "transparent", color: "var(--c-text1)" }}
                      />
                      <div className="flex justify-end gap-2 mt-1.5">
                        <button
                          onClick={() => setReplyOpen(prev => ({ ...prev, [post.id]: false }))}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                          style={{ background: "var(--c-muted)", color: "var(--c-text3)" }}>
                          Cancel
                        </button>
                        <button
                          onClick={() => submitReply(post.id)}
                          disabled={!(replyText[post.id]?.trim()) || replyPosting[post.id]}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-40"
                          style={{ background: accentColor }}>
                          {replyPosting[post.id] ? "…" : "Reply"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Thread replies */}
              {isRepliesOpen && replyCount > 0 && (
                <div className="px-4 pb-3 border-t" style={{ borderColor: "var(--c-border)" }}>
                  {(post.replies ?? []).map(reply => (
                    <ReplyRow
                      key={reply.id}
                      reply={reply}
                      onToggleLike={toggleLike}
                    />
                  ))}
                </div>
              )}
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
                  <p className="text-xs" style={{ color: "var(--c-text3)" }}>{evt.rsvp_count} going</p>
                </div>
              </div>
            </div>
            {!isPast ? (
              <button onClick={() => toggleRsvp(evt)} disabled={rsvping === evt.id}
                className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-all disabled:opacity-50"
                style={evt.rsvp_by_me
                  ? { background: "rgba(52,211,153,0.1)", color: "#059669", border: "1px solid rgba(52,211,153,0.3)" }
                  : { background: accentColor, color: "white" }}>
                {rsvping === evt.id ? "…" : evt.rsvp_by_me ? "Going ✓ (cancel RSVP)" : "RSVP — I'm going!"}
              </button>
            ) : (
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
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: crewData } = await supabase
        .from("crews")
        .select("id, name, description, icon, header_style, header_svg, created_by, created_at")
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

  const theme = getCrewTheme(crew.id, crew.header_style);
  const isCreator = userId === crew.created_by;

  return (
    <div className="animate-fade-in pb-6">

      {/* Back nav */}
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

      {/* ── Hero card ── */}
      <div className="mx-4 rounded-3xl overflow-hidden relative mb-4"
           style={{ background: crew.header_svg ? "transparent" : theme.bg, border: `1px solid ${crew.header_svg ? "rgba(0,0,0,0.08)" : theme.border}` }}>

        {/* Custom AI-generated SVG fills the entire card background */}
        {crew.header_svg ? (
          <div className="absolute inset-0 pointer-events-none"
               dangerouslySetInnerHTML={{ __html: crew.header_svg.replace(
                 'viewBox="0 0 400 160"',
                 'viewBox="0 0 400 160" style="width:100%;height:100%;position:absolute;top:0;left:0"'
               ) }} />
        ) : (
          /* Preset theme illustration */
          <div className="absolute right-0 top-0 w-[55%] h-full opacity-90 pointer-events-none">
            {theme.illustration}
          </div>
        )}

        {/* Edit button — only for creator */}
        {isCreator && (
          <button onClick={() => setShowEdit(true)}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(4px)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={theme.accentText} strokeWidth="2" strokeLinecap="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={theme.accentText} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}

        {/* Gradient overlay to keep text legible over AI SVG */}
        {crew.header_svg && (
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: "linear-gradient(to right, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.18) 60%, transparent 100%)" }} />
        )}

        {/* Content */}
        <div className="relative p-5 pr-[46%]">
          <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
                style={{ background: theme.accentBadgeBg, color: theme.accent }}>
            {theme.label}
          </span>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-3xl leading-none">{crew.icon}</span>
          </div>
          <h1 className="text-[22px] font-black leading-tight mb-2" style={{ color: theme.accentText }}>
            {crew.name}
          </h1>
          {crew.description && (
            <p className="text-xs leading-relaxed mb-4" style={{ color: theme.accent, opacity: 0.75 }}>
              {crew.description}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: theme.accent, opacity: 0.65 }}>
              {memberCount} member{memberCount !== 1 ? "s" : ""}
            </span>
            {isMember ? (
              <>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                      style={{ background: theme.accentBadgeBg, color: theme.accent }}>
                  Joined ✓
                </span>
                <button onClick={leaveCrew} disabled={joining}
                  className="text-[11px] font-medium active:opacity-60 transition-opacity disabled:opacity-40 whitespace-nowrap"
                  style={{ color: theme.accent, opacity: 0.55 }}>
                  Leave
                </button>
              </>
            ) : (
              <button onClick={joinCrew} disabled={joining}
                className="text-[12px] font-bold px-4 py-1.5 rounded-full active:scale-95 transition-transform disabled:opacity-60 whitespace-nowrap"
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

      {/* Edit sheet */}
      {showEdit && isCreator && (
        <EditSheet
          crew={crew}
          onClose={() => setShowEdit(false)}
          onSave={updates => setCrew(prev => prev ? { ...prev, ...updates } : prev)}
        />
      )}
    </div>
  );
}
