/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "'Sora'", "system-ui", "sans-serif"],
      },
      colors: {
        cyan: {
          DEFAULT: "#00D2C4",
          dim: "rgba(0,210,196,0.11)",
          border: "rgba(0,210,196,0.22)",
          glow: "rgba(0,210,196,0.38)",
        },
      },
    },
  },
  plugins: [],
}