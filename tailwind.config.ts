import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#0B0E14",
          soft: "#0F1320",
        },
        surface: {
          DEFAULT: "#141821",
          raised: "#1B2130",
        },
        ink: {
          DEFAULT: "#E7E9EE",
          muted: "#8B92A5",
          faint: "#565E70",
        },
        accent: {
          violet: "#7C5CFF",
          mint: "#00E5A0",
          amber: "#FFB800",
        },
        line: "#232838",
      },
      fontFamily: {
        display: ['"Chakra Petch"', "sans-serif"],
        body: ['"Sarabun"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,92,255,0.25), 0 0 24px rgba(124,92,255,0.20)",
        "glow-mint": "0 0 0 1px rgba(0,229,160,0.25), 0 0 24px rgba(0,229,160,0.18)",
      },
      backgroundImage: {
        scan: "repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px)",
      },
    },
  },
  plugins: [],
};
export default config;
