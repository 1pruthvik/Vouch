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
        'blink-3': 'blink3Times 1.8s ease-in-out forwards',
        'pulse-glow': 'pulseGlow 2.5s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        blink3Times: {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1.02)',
            boxShadow: '0 0 25px rgba(136, 13, 25, 0.6)',
            borderColor: '#880d19',
          },
          '16%, 50%, 83%': {
            opacity: '0.25',
            transform: 'scale(1.0)',
            boxShadow: '0 0 0px transparent',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          },
          '33%, 66%': {
            opacity: '1',
            transform: 'scale(1.02)',
            boxShadow: '0 0 35px rgba(136, 13, 25, 0.85)',
            borderColor: '#9b111e',
          },
        },
        pulseGlow: {
          '0%, 100%': {
            boxShadow: '0 0 15px rgba(136, 13, 25, 0.3)',
            borderColor: 'rgba(136, 13, 25, 0.4)',
          },
          '50%': {
            boxShadow: '0 0 25px rgba(249, 128, 128, 0.6)',
            borderColor: 'rgba(249, 128, 128, 0.8)',
          },
        }
      }
    },
  },
  plugins: [],
}
