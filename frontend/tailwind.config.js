/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f8fafc", // bg-slate-50
        card: "#ffffff",
        text: "#1e293b", // text-slate-800
        primary: "#4f46e5", // bg-indigo-600
      }
    },
  },
  plugins: [],
}
