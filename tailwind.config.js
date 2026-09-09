/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'cw-bg': {
          primary: '#0a0e1a',
          secondary: '#0f1420',
          tertiary: '#141a2a',
        },
        'cw-accent': {
          cyan: '#22d3ee',
          blue: '#3b82f6',
          electric: '#06b6d4',
        },
        'cw-warning': '#fbbf24',
        'cw-danger': '#ef4444',
        'cw-safe': '#22c55e',
        'cw-text': {
          primary: '#e2e8f0',
          secondary: '#94a3b8',
          muted: '#64748b',
        },
        'cw-border': {
          default: 'rgba(34, 211, 238, 0.12)',
          strong: 'rgba(34, 211, 238, 0.25)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'glow-pulse': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
