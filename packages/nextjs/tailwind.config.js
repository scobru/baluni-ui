/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./utils/**/*.{js,ts,jsx,tsx}"],
  plugins: [require("daisyui")],
  darkTheme: "scaffoldEthDark",
  // DaisyUI theme colors
  daisyui: {
    themes: [
      "sunset",
      "fantasy",
      "forest",
      "aqua",
      "deep",
      "luxury",
      "corporate",
      "synthwave",
      "retro",
      "cyberpunk",
      "valentine",
      "halloween",
      "garden",
      "forest",
      "dracula",
    ],
  },
  theme: {
    extend: {
      boxShadow: {
        center: "0 0 12px -2px rgb(0 0 0 / 0.05)",
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      backgroundImage: {
        back: "url('/images/back.webp')",
        back2: "url('/images/back2.webp')",
        back3: "url('/images/back3.jpeg')",
        back4: "url('/images/back4.jpeg')",
      },
      fontFamily: {
        reddit: ["Reddit Sans"],
      },
    },
  },
};
