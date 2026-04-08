/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:   { DEFAULT: '#1B2A4A', light: '#243660', dark: '#111D34' },
        accent: { DEFAULT: '#2E75B6', light: '#3D8FD4', dark: '#1B5FA3' },
        slate:  { 50: '#f8fafc' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
