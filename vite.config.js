import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Auto-update the installed app whenever you ship a new build.
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Josh-Fy",
        short_name: "Josh-Fy",
        description: "Your free music space.",
        theme_color: "#07110d",
        background_color: "#07110d",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        // Cache the app shell so it opens instantly and works offline.
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        // Don't let the SW hijack navigations that hit real APIs.
        navigateFallbackDenylist: [/^\/api/]
      }
    })
  ]
});
