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
        indigo: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "slide-in-from-bottom-4": {
          from: { transform: "translateY(16px)", opacity: "0" },
          to:   { transform: "translateY(0)",    opacity: "1" },
        },
        "slide-in-from-right-8": {
          from: { transform: "translateX(32px)", opacity: "0" },
          to:   { transform: "translateX(0)",    opacity: "1" },
        },
        "zoom-in-50": {
          from: { transform: "scale(0.5)", opacity: "0" },
          to:   { transform: "scale(1)",   opacity: "1" },
        },
        "zoom-in-95": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to:   { transform: "scale(1)",    opacity: "1" },
        },
      },
      animation: {
        "fade-in":                "fade-in 0.4s ease both",
        "slide-in-from-bottom-4": "slide-in-from-bottom-4 0.5s ease both",
        "slide-in-from-right-8":  "slide-in-from-right-8 0.5s ease both",
        "zoom-in-50":             "zoom-in-50 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "zoom-in-95":             "zoom-in-95 0.4s ease both",
      },
    },
  },
  plugins: [],
};
export default config;
