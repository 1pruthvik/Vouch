/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "#000000",
        dark: {
          950: "#050505",
          900: "#0c0c0c",
          850: "#121212",
          800: "#181818",
          700: "#222222",
        },
        royal: {
          50: "#fdf2f2",
          100: "#fde8e8",
          200: "#fbd5d5",
          300: "#f8b4b4",
          400: "#f98080",
          500: "#9b111e", // Royal Carmine / Ruby
          600: "#880d19", // Deep Royal Red
          700: "#750a14",
          800: "#60060e",
          900: "#4c050a",
        }
      }
    },
  },
  plugins: [],
}
