import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#111827",
          dark: "#0A0A0F",
          card: "#161622",
          border: "#1F1F2E",
        },
        orange: {
          DEFAULT: "#F97316",
          light: "#FB923C",
          dark: "#EA580C",
          glow: "rgba(249,115,22,0.15)",
        },
      },
      fontFamily: {
        vazir: ["Vazirmatn", "sans-serif"],
      },
      animation: {
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "fade-up": "fade-up 0.5s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(249,115,22,0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(249,115,22,0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-pattern": "radial-gradient(ellipse at 20% 50%, rgba(249,115,22,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(249,115,22,0.05) 0%, transparent 50%)",
      },
    },
  },
  plugins: [],
};

export default config;
