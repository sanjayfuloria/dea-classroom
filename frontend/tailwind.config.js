/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy:  { DEFAULT: '#0A2342', light: '#1C3557', dark: '#061428' },
        teal:  { DEFAULT: '#028090', light: '#03A6B8', dark: '#016070' },
        gold:  { DEFAULT: '#C47A2A', light: '#E8940F', dark: '#9A5E1E' },
        slate: { DEFAULT: '#374151' },
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Crimson Pro', 'Georgia', 'serif'],
        mono:  ['JetBrains Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
