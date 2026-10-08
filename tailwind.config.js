/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Josh-Fy brand violet, used where YouTube Music uses its red.
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
        // YouTube Music's dark surfaces.
        yt: {
          base: "#030303",
          raised: "#0f0f0f",
          bar: "#212121",
          menu: "#282828",
          border: "rgba(255,255,255,0.1)",
          muted: "#aaaaaa",
          dim: "#717171"
        }
      },
      fontFamily: {
        sans: ["Roboto", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Roboto", "system-ui", "sans-serif"]
      },
      keyframes: {
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" }
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "pop-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" }
        },
        eq: {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" }
        },
        shimmer: { "100%": { transform: "translateX(100%)" } }
      },
      animation: {
        "slide-up": "slide-up 280ms cubic-bezier(0.2, 0, 0, 1)",
        "fade-in": "fade-in 180ms ease-out",
        "pop-in": "pop-in 140ms ease-out",
        eq: "eq 900ms ease-in-out infinite",
        shimmer: "shimmer 1.4s infinite"
      }
    }
  },
  plugins: []
};
