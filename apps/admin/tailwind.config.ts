import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        orange: { DEFAULT: "#F97316", light: "#FB923C", dark: "#EA580C" },
      },
      fontFamily: { vazir: ["Vazirmatn", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
