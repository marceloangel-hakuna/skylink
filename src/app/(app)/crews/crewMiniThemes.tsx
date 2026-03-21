import React from "react";

export const CREW_ID_TO_STYLE: Record<string, string> = {
  "11111111-0000-0000-0000-000000000001": "city",
  "11111111-0000-0000-0000-000000000002": "tech",
  "11111111-0000-0000-0000-000000000003": "globe",
  "11111111-0000-0000-0000-000000000004": "valley",
};

export function hashCrewTheme(id: string): string {
  const keys = ["city", "tech", "globe", "valley", "vibrant", "ocean"];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return keys[h % keys.length];
}

export function resolveCrewThemeKey(id: string, headerStyle: string | null | undefined): string {
  if (headerStyle && headerStyle !== "auto" && headerStyle !== "custom") return headerStyle;
  return CREW_ID_TO_STYLE[id] ?? hashCrewTheme(id);
}

export type CrewMiniTheme = {
  bg: string;
  accent: string;
  border: string;
  mini: React.ReactNode;
};

export const CREW_MINI_THEMES: Record<string, CrewMiniTheme> = {
  city: {
    bg:     "linear-gradient(150deg, #FFF7ED 0%, #FFEDD5 60%, #FED7AA 100%)",
    accent: "#C2410C", border: "#FED7AA",
    mini: (
      <svg viewBox="0 0 28 44" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        <rect x="4"   y="20" width="6"   height="28" rx="0.5" fill="#C2410C" fillOpacity="0.18"/>
        <rect x="12"  y="12" width="8"   height="36" rx="0.5" fill="#C2410C" fillOpacity="0.22"/>
        <rect x="22"  y="18" width="5"   height="30" rx="0.5" fill="#C2410C" fillOpacity="0.15"/>
        <rect x="5"   y="22" width="1.5" height="2"  rx="0.2" fill="#C2410C" fillOpacity="0.4"/>
        <rect x="7.5" y="22" width="1.5" height="2"  rx="0.2" fill="#C2410C" fillOpacity="0.4"/>
        <rect x="13"  y="15" width="2"   height="2.5" rx="0.2" fill="#C2410C" fillOpacity="0.4"/>
        <rect x="16"  y="15" width="2"   height="2.5" rx="0.2" fill="#C2410C" fillOpacity="0.4"/>
      </svg>
    ),
  },
  tech: {
    bg:     "linear-gradient(150deg, #EFF6FF 0%, #DBEAFE 60%, #BFDBFE 100%)",
    accent: "#1D4ED8", border: "#BFDBFE",
    mini: (
      <svg viewBox="0 0 28 44" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        <circle cx="14" cy="12" r="4"   stroke="#1D4ED8" strokeOpacity="0.35" strokeWidth="1.2"/>
        <circle cx="6"  cy="26" r="3"   stroke="#1D4ED8" strokeOpacity="0.25" strokeWidth="1"/>
        <circle cx="22" cy="24" r="3"   stroke="#1D4ED8" strokeOpacity="0.3"  strokeWidth="1"/>
        <circle cx="12" cy="36" r="2.5" stroke="#1D4ED8" strokeOpacity="0.2"  strokeWidth="1"/>
        <line x1="14" y1="16" x2="6"  y2="23"   stroke="#1D4ED8" strokeOpacity="0.2"  strokeWidth="0.8"/>
        <line x1="14" y1="16" x2="22" y2="21"   stroke="#1D4ED8" strokeOpacity="0.2"  strokeWidth="0.8"/>
        <line x1="6"  y1="29" x2="12" y2="33.5" stroke="#1D4ED8" strokeOpacity="0.15" strokeWidth="0.8"/>
        <line x1="22" y1="27" x2="12" y2="33.5" stroke="#1D4ED8" strokeOpacity="0.15" strokeWidth="0.8"/>
        <circle cx="14" cy="12" r="1.5" fill="#1D4ED8" fillOpacity="0.4"/>
        <circle cx="6"  cy="26" r="1"   fill="#1D4ED8" fillOpacity="0.3"/>
        <circle cx="22" cy="24" r="1"   fill="#1D4ED8" fillOpacity="0.35"/>
      </svg>
    ),
  },
  globe: {
    bg:     "linear-gradient(150deg, #ECFDF5 0%, #D1FAE5 60%, #A7F3D0 100%)",
    accent: "#065F46", border: "#A7F3D0",
    mini: (
      <svg viewBox="0 0 28 44" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        <circle cx="14" cy="22" r="12" stroke="#065F46" strokeOpacity="0.25" strokeWidth="1"/>
        <ellipse cx="14" cy="22" rx="6" ry="12" stroke="#065F46" strokeOpacity="0.2" strokeWidth="0.8"/>
        <line x1="2"  y1="22" x2="26" y2="22" stroke="#065F46" strokeOpacity="0.2"  strokeWidth="0.8"/>
        <line x1="4"  y1="16" x2="24" y2="16" stroke="#065F46" strokeOpacity="0.12" strokeWidth="0.6"/>
        <line x1="4"  y1="28" x2="24" y2="28" stroke="#065F46" strokeOpacity="0.12" strokeWidth="0.6"/>
        <path d="M8 14c2 1 4 2 6 2s4-1 6-2" stroke="#065F46" strokeOpacity="0.25" strokeWidth="0.8" fill="none"/>
      </svg>
    ),
  },
  valley: {
    bg:     "linear-gradient(150deg, #FEFCE8 0%, #FEF9C3 55%, #FDE68A 100%)",
    accent: "#92400E", border: "#FDE68A",
    mini: (
      <svg viewBox="0 0 28 44" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        <rect x="7"    y="14" width="3.5" height="22" rx="0.4" fill="#92400E" fillOpacity="0.22"/>
        <rect x="17.5" y="14" width="3.5" height="22" rx="0.4" fill="#92400E" fillOpacity="0.22"/>
        <path d="M7 14l1.75-5 1.75 5"    fill="#92400E" fillOpacity="0.3"/>
        <path d="M17.5 14l1.75-5 1.75 5" fill="#92400E" fillOpacity="0.3"/>
        <path d="M8.75 14 Q14 20 19.25 14" stroke="#92400E" strokeOpacity="0.3" strokeWidth="0.8" fill="none"/>
        <rect x="2" y="36" width="24" height="1.5" rx="0.4" fill="#92400E" fillOpacity="0.2"/>
        <line x1="10.5" y1="17.5" x2="10.5" y2="36" stroke="#92400E" strokeOpacity="0.15" strokeWidth="0.5"/>
        <line x1="13"   y1="18.5" x2="13"   y2="36" stroke="#92400E" strokeOpacity="0.15" strokeWidth="0.5"/>
        <line x1="15"   y1="18.5" x2="15"   y2="36" stroke="#92400E" strokeOpacity="0.15" strokeWidth="0.5"/>
        <line x1="17.5" y1="17.5" x2="17.5" y2="36" stroke="#92400E" strokeOpacity="0.15" strokeWidth="0.5"/>
        <path d="M2 39 Q8 37.5 14 39 Q20 40.5 26 39" stroke="#92400E" strokeOpacity="0.18" strokeWidth="0.8" fill="none"/>
      </svg>
    ),
  },
  vibrant: {
    bg:     "linear-gradient(150deg, #FFF1F2 0%, #FFE4E6 60%, #FECDD3 100%)",
    accent: "#BE123C", border: "#FECDD3",
    mini: (
      <svg viewBox="0 0 28 44" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        <path d="M14 8l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"                               fill="#BE123C" fillOpacity="0.35"/>
        <path d="M22 18l0.7 2.1 2.1 0.7-2.1 0.7-0.7 2.1-0.7-2.1-2.1-0.7 2.1-0.7z" fill="#BE123C" fillOpacity="0.25"/>
        <path d="M8 28l0.6 1.8 1.8 0.6-1.8 0.6-0.6 1.8-0.6-1.8-1.8-0.6 1.8-0.6z"  fill="#BE123C" fillOpacity="0.3"/>
        <circle cx="22" cy="10" r="1.5" fill="#BE123C" fillOpacity="0.25"/>
        <circle cx="6"  cy="18" r="1"   fill="#BE123C" fillOpacity="0.2"/>
        <circle cx="18" cy="32" r="1.5" fill="#BE123C" fillOpacity="0.22"/>
        <circle cx="10" cy="38" r="1"   fill="#BE123C" fillOpacity="0.18"/>
        <rect x="4"  y="12" width="3" height="1.5" rx="0.3" fill="#BE123C" fillOpacity="0.2" transform="rotate(-20 4 12)"/>
        <rect x="20" y="26" width="3" height="1.5" rx="0.3" fill="#BE123C" fillOpacity="0.2" transform="rotate(15 20 26)"/>
      </svg>
    ),
  },
  ocean: {
    bg:     "linear-gradient(150deg, #F0FDFA 0%, #CCFBF1 60%, #99F6E4 100%)",
    accent: "#0F766E", border: "#99F6E4",
    mini: (
      <svg viewBox="0 0 28 44" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        <path d="M-2 24 Q3.5 20 9 24 Q14.5 28 20 24 Q25.5 20 31 24" stroke="#0F766E" strokeOpacity="0.3"  strokeWidth="1.2" fill="none"/>
        <path d="M-2 30 Q3.5 26 9 30 Q14.5 34 20 30 Q25.5 26 31 30" stroke="#0F766E" strokeOpacity="0.22" strokeWidth="1"   fill="none"/>
        <path d="M-2 36 Q3.5 32 9 36 Q14.5 40 20 36 Q25.5 32 31 36" stroke="#0F766E" strokeOpacity="0.15" strokeWidth="0.8" fill="none"/>
        <circle cx="8"  cy="10" r="1"   fill="#0F766E" fillOpacity="0.3"/>
        <circle cx="16" cy="8"  r="0.7" fill="#0F766E" fillOpacity="0.22"/>
        <circle cx="22" cy="13" r="1"   fill="#0F766E" fillOpacity="0.25"/>
        <path d="M12 14a5 5 0 000-6 6 6 0 100 6z" fill="#0F766E" fillOpacity="0.2"/>
      </svg>
    ),
  },
};
