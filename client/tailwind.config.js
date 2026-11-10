/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        studio: {
          950: '#06070a',
          900: '#0b0d13',
          850: '#10131b',
          800: '#161a25',
          750: '#1d2332',
          700: '#262e42',
          600: '#38435f',
          500: '#526084',
          400: '#7e8ba8',
          300: '#adb8ce',
          200: '#d7deea',
          100: '#f1f4f9',
        },
        volt: {
          DEFAULT: '#22c55e',
          glow: '#16a34a',
          light: '#4ade80',
          dark: '#15803d',
        },
        amber: {
          glow: '#f59e0b',
        },
        cyan: {
          glow: '#06b6d4',
        }
      },
      boxShadow: {
        'neon-volt': '0 0 20px -3px rgba(34, 197, 94, 0.35)',
        'neon-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.35)',
        'neon-amber': '0 0 20px -3px rgba(245, 158, 11, 0.35)',
        'neon-rose': '0 0 20px -3px rgba(244, 63, 94, 0.35)',
      }
    },
  },
  plugins: [],
}
