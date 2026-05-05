import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          50: "#fdfaf3",
          100: "#faf6ec",
          200: "#f4ede0",
          300: "#ece2cf",
          400: "#e0d3b9",
        },
        ink: {
          DEFAULT: "#1f1a14",
          soft: "#3a3127",
          muted: "#6b5e4d",
          faint: "#9a8e7c",
        },
        line: {
          DEFAULT: "#e8dfcf",
          strong: "#d8cdb6",
        },
        gold: {
          50: "#fbf3df",
          100: "#f4e2b3",
          300: "#dcb35a",
          500: "#b8893d",
          600: "#9c7028",
          700: "#7a571c",
        },
        sage: {
          100: "#dde6d2",
          500: "#7a8c6b",
          700: "#536450",
        },
        terracotta: {
          100: "#f1d9c8",
          500: "#b56b4a",
          700: "#8a4d31",
        },
        rose: {
          100: "#ecc8be",
          500: "#a85944",
          700: "#7d3a2a",
        },
      },
      fontFamily: {
        sans: ['"Helvetica Neue"', "Helvetica", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        md: "10px",
        lg: "14px",
        xl: "18px",
      },
      boxShadow: {
        ledger: "0 1px 0 rgba(58,49,39,0.04), 0 8px 24px -16px rgba(58,49,39,0.18)",
        raised: "0 2px 0 rgba(58,49,39,0.04), 0 12px 32px -18px rgba(58,49,39,0.22)",
        stamp: "inset 0 0 0 1px rgba(184,137,61,0.18), 0 1px 0 rgba(58,49,39,0.04)",
      },
      backgroundImage: {
        "paper-grain":
          "radial-gradient(rgba(122,87,28,0.05) 1px, transparent 1px), radial-gradient(rgba(122,87,28,0.04) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
