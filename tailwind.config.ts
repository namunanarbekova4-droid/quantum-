import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080808",
        surface: "#111111",
        "surface-2": "#161616",
        border: "#1a1a1a",
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E8C97A",
          dark: "#A07830",
        },
        quantum: {
          bg: "#06040F",
          surface: "#0F0A1F",
          border: "#1A1040",
          purple: "#7C3AED",
          purpleLight: "#A855F7",
          gold: "#C9A84C",
          goldLight: "#E8C97A",
          textSecondary: "#8B7CF8",
        },
        "text-primary": "#FFFFFF",
        "text-secondary": "#888888",
        "text-muted": "#444444",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "var(--font-noto-sc)", "Noto Sans SC", "sans-serif"],
        josefin: ["var(--font-josefin)", "'Josefin Sans'", "sans-serif"],
        cormorant: ["var(--font-cormorant)", "'Cormorant Garamond'", "serif"],
        mono: ["'Geist Mono'", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "6px",
        lg: "8px",
        xl: "8px",
        "2xl": "8px",
        full: "9999px",
      },
      boxShadow: {
        gold: "0 0 20px rgba(201, 168, 76, 0.15)",
        "gold-lg": "0 0 40px rgba(201, 168, 76, 0.25)",
        surface: "0 4px 24px rgba(0, 0, 0, 0.5)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease forwards",
        "slide-up": "slideUp 0.5s ease forwards",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
