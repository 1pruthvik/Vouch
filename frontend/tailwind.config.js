/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#161920',
          raised: '#1c1f29',
          overlay: '#222631',
        },
        accent: {
          teal: '#2dd4a8',
          amber: '#f5a623',
          violet: '#8b5cf6',
          rose: '#f43f5e',
          sky: '#38bdf8',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      borderRadius: {
        'v-sm': '8px',
        'v-md': '14px',
        'v-lg': '20px',
        'v-xl': '28px',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 0.4s ease both',
        'scale-in': 'scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-down': 'slideDown 0.3s ease both',
        'pulse-soft': 'pulse-soft 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
