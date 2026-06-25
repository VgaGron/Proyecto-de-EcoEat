/** @type {import('tailwindcss').Config} */
module.exports = {
  // Aquí le decimos a Tailwind en qué carpetas están tus pantallas
  content: [
    "./app/**/*.{js,jsx,ts,tsx}", 
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}