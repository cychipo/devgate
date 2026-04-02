/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  plugins: [require("@kobalte/tailwindcss")],
  theme: {
    extend: {
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      colors: {
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f6831e",
          600: "#e57210",
          700: "#c25d0e",
          800: "#9a4a12",
          900: "#7c3d12",
        },
        background: {
          dark: "#221810",
          light: "#f8f7f5",
        },
        surface: {
          dark: "#2b211a",
          light: "#ffffff",
        },
        // Semantic status colors
        status: {
          error: "#ef4444",
          info: "#3b82f6",
          success: "#10b981",
          warning: "#f59e0b",
        },
      },
    },
  },
};
