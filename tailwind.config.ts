import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f6f3",
          100: "#ece9e1",
          200: "#d9d3c4",
          300: "#c0b6a0",
          400: "#a6977c",
          500: "#8f7d62",
          600: "#7a6a54",
          700: "#645646",
          800: "#54493c",
          900: "#483f35",
          950: "#272119",
        },
        sage: {
          50: "#f4f7f4",
          100: "#e4ebe4",
          200: "#c9d7ca",
          300: "#a3b8a5",
          400: "#77957a",
          500: "#5a7a5e",
          600: "#466149",
          700: "#394e3c",
          800: "#304032",
          900: "#29352b",
          950: "#141c15",
        },
        coral: {
          50: "#fff5f2",
          100: "#ffe8e1",
          200: "#ffd5c8",
          300: "#ffb8a1",
          400: "#ff8f6b",
          500: "#f86a3f",
          600: "#e54e22",
          700: "#c13d18",
          800: "#a03418",
          900: "#842f1a",
          950: "#48150a",
        },
      },
      fontFamily: {
        serif: ["var(--font-literata)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
