/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        festival: {
          gold: '#FFD700',
          amber: '#FFBF00',
          night: '#0a0d1a',
          water: '#0c1b33',
        }
      },
      fontFamily: {
        thai: ['Sarabun', 'Noto Sans Thai', 'sans-serif']
      }
    },
  },
  plugins: [],
}
