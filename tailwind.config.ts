import type { Config } from "tailwindcss";

const config: Config = {
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
        // SkyLink brand palette
        sky: {
          50:  "#f0f7ff",
          100: "#e0efff",
          200: "#baddff",
          300: "#7ec0fd",
          400: "#3e9ef8",
          500: "#1580eb",
          600: "#0A63CA",
          700: "#0A4FA3",
          800: "#0A3B7A",
          900: "#0A2463",
        },
        navy: {
          50:  "#eef2f9",
          100: "#d5dff0",
          200: "#adc0e1",
          300: "#7898cd",
          400: "#4a72b8",
          500: "#2d57a0",
          600: "#1e4287",
          700: "#193670",
          800: "#0D2248",
          900: "#070F24",
        },
        accent: {
          teal: "#00B4D8",
          amber: "#F9A825",
          rose: "#F43F5E",
          green: "#22C55E",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F5F7FA",
          card: "#FFFFFF",
          border: "#E4E9F0",
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
        card: "0 2px 12px 0 rgba(10, 36, 99, 0.08)",
        "card-hover": "0 8px 24px 0 rgba(10, 36, 99, 0.14)",
        nav: "0 -2px 16px 0 rgba(10, 36, 99, 0.08)",
        glass: "0 4px 24px 0 rgba(10, 36, 99, 0.12)",
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
        "safe-top": "env(safe-area-inset-top)",
        "nav-height": "64px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
