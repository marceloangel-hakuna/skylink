export const THEME_OPTIONS = [
  { key: "city",    label: "City Life",  bg: "linear-gradient(135deg, #FFF7ED, #FED7AA)", emoji: "🏙️" },
  { key: "tech",    label: "Tech & AI",  bg: "linear-gradient(135deg, #EFF6FF, #BFDBFE)", emoji: "💡" },
  { key: "globe",   label: "Global",     bg: "linear-gradient(135deg, #ECFDF5, #A7F3D0)", emoji: "🌎" },
  { key: "valley",  label: "Bay Area",   bg: "linear-gradient(135deg, #FEFCE8, #FDE68A)", emoji: "🌉" },
  { key: "vibrant", label: "Vibrant",    bg: "linear-gradient(135deg, #FFF1F2, #FECDD3)", emoji: "✨" },
  { key: "ocean",   label: "Ocean",      bg: "linear-gradient(135deg, #F0FDFA, #99F6E4)", emoji: "🌊" },
] as const;

export type ThemeKey = typeof THEME_OPTIONS[number]["key"];
