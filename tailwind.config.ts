import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0f766e",
          foreground: "#ffffff"
        }
      },
      boxShadow: {
        card: "0 2px 10px rgba(2, 6, 23, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
