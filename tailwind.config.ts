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
        brand: {
          DEFAULT: "#3D32CF",
          light: "#5A51D8",
          dark: "#2A22A0",
          50:  "#EDEEFF",
          100: "#D4D2FF",
          200: "#ABA7FF",
          300: "#7C76FF",
          400: "#5A51D8",
          500: "#3D32CF",
          600: "#2A22A0",
          700: "#1E1878",
          800: "#130F50",
          900: "#090728",
        },
        sky: {
          50:  "#f0f7ff",
          100: "#e0efff",
          200: "#baddff",
          300: "#7ec0fd",
          400: "#3e9ef8",
          500: "#1580eb",
          600: "#3D32CF",
          700: "#2A22A0",
          800: "#1E1878",
          900: "#130F50",
        },
        navy: {
          50:  "#f0efff",
          100: "#dddcff",
          200: "#bbb9ff",
          300: "#8e8bff",
          400: "#6560f0",
          500: "#4A45D8",
          600: "#3D32CF",
          700: "#2A22A0",
          800: "#1E1878",
          900: "#130F50",
        },
        accent: {
          pink:  "#EE4080",
          gold:  "#F0A829",
          teal:  "#2EC9A0",
          rose:  "#EE4080",
          amber: "#F0A829",
          green: "#2EC9A0",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F5F4FF",
          card: "#FFFFFF",
          border: "#E4E1FF",
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
