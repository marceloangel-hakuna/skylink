import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "c-card":   "var(--c-card)",
        "c-muted":  "var(--c-muted)",
        "c-border": "var(--c-border)",
        "c-text1":  "var(--c-text1)",
        "c-text2":  "var(--c-text2)",
        "c-text3":  "var(--c-text3)",
        brand: {
          DEFAULT: "#4A27E8",
          light:   "#6B4AF0",
          dark:    "#3418C8",
          50:  "#F0EBFF",
          100: "#DDD4FD",
          200: "#BCAAFC",
          300: "#9A80FA",
          400: "#7955F3",
          500: "#4A27E8",
          600: "#3418C8",
          700: "#250FA0",
          800: "#170A78",
          900: "#0C0550",
        },
        navy: {
          50:  "#F0EBFF",
          100: "#DDD4FD",
          200: "#BCAAFC",
          300: "#9A80FA",
          400: "#7955F3",
          500: "#4A27E8",
          600: "#3418C8",
          700: "#250FA0",
          800: "#170A78",
          900: "#1A1A1A",
        },
        accent: {
          pink:  "#EC4899",
          gold:  "#EAB308",
          green: "#34D399",
        },
        surface: {
          DEFAULT: "var(--c-muted)",
          muted:   "var(--c-muted)",
          card:    "var(--c-card)",
          border:  "var(--c-border)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        card:       "0 1px 8px 0 rgba(0,0,0,0.06)",
        "card-hover":"0 6px 20px 0 rgba(74,39,232,0.12)",
        nav:        "0 -1px 12px 0 rgba(0,0,0,0.06)",
        glass:      "0 4px 24px 0 rgba(74,39,232,0.10)",
      },
      screens: {
        xs: "375px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-top":    "env(safe-area-inset-top)",
        "nav-height":  "64px",
      },
      animation: {
        "fade-in":    "fadeIn 0.3s ease-in-out",
        "slide-up":   "slideUp 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
