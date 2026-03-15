/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: '#6366f1', hover: '#4f46e5', light: '#e0e7ff' },
        secondary:{ DEFAULT: '#0ea5e9', hover: '#0284c7' },
        success:  '#22c55e',
        warning:  '#f59e0b',
        danger:   '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
