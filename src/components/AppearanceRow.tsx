"use client";

import { useTheme } from "./ThemeProvider";

export function AppearanceRow() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-3 py-3.5 active:bg-surface-muted transition -mx-4 px-4 w-full"
    >
      <span className="text-lg w-7 text-center">{theme === "dark" ? "☀️" : "🌙"}</span>
      <span className="flex-1 text-sm font-medium text-left" style={{ color: "var(--c-text1)" }}>
        {theme === "dark" ? "Light Mode" : "Dark Mode"}
      </span>
      {/* Toggle pill */}
      <div
        className="w-11 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0"
        style={{ background: theme === "dark" ? "#4A27E8" : "#D4D4D8" }}
      >
        <div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300"
          style={{ left: theme === "dark" ? "calc(100% - 20px)" : "4px" }}
        />
      </div>
    </button>
  );
}
