import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      boxShadow: {
        felt: "inset 0 0 80px rgba(0,0,0,.45), 0 24px 70px rgba(0,0,0,.38)"
      }
    }
  },
  plugins: []
};

export default config;
