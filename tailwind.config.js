/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Josh-Fy brand: violet core (#7C3AED / #8B5CF6) with pink + cyan accents.
        accent: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95"
        },
        brand: {
          purple: "#7c3aed",
          violet: "#8b5cf6",
          pink: "#ec4899",
          cyan: "#06b6d4",
          ink: "#0a0a0f",
          panel: "#1a1a23",
          elevated: "#2a2a3a",
          mist: "#e5e7eb"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.05), 0 30px 120px rgba(124,58,237,0.22)"
      },
      backgroundImage: {
        aurora:
          "radial-gradient(circle at top left, rgba(124,58,237,0.22), transparent 26%), radial-gradient(circle at top right, rgba(6,182,212,0.16), transparent 24%), radial-gradient(circle at 50% 120%, rgba(236,72,153,0.14), transparent 40%), linear-gradient(180deg, #12101c 0%, #0c0b13 52%, #0a0a0f 100%)"
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
