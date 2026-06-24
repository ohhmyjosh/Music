/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          50: "#edfdf4",
          100: "#d5f9e2",
          200: "#adf1c6",
          300: "#7fe3a4",
          400: "#4ace7d",
          500: "#22b35f",
          600: "#16924a",
          700: "#14723d",
          800: "#155b34",
          900: "#154a2d"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.05), 0 30px 120px rgba(34,179,95,0.16)"
      },
      backgroundImage: {
        aurora:
          "radial-gradient(circle at top left, rgba(34,179,95,0.18), transparent 26%), radial-gradient(circle at top right, rgba(234,179,8,0.12), transparent 22%), linear-gradient(180deg, #0a120f 0%, #070a08 52%, #040504 100%)"
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
