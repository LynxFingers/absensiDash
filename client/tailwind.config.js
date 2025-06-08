/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'orange-custom': '#FDE68A',
        'red-custom': '#F87171',
        'yellow-custom': '#FBBF24',
        'green-custom': '#34D399',
        'blue-custom': '#60A5FA', // <-- TAMBAHKAN INI
      }
    },
  },
  plugins: [],
}