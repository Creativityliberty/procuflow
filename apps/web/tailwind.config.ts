import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#211a2f",
        muted: "#756b86",
        violetBrand: "#7c3aed",
        violetSoft: "#ede9fe",
        borderSoft: "#e9ddff"
      },
      borderRadius: {
        panel: "2rem"
      },
      boxShadow: {
        panel: "0 24px 70px rgba(80, 49, 140, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;

