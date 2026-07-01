import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Auto-update the installed app whenever you ship a new build.
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "apple-touch-icon.png"],
      manifest: {
        name: "Josh-Fy",
        short_name: "Josh-Fy",
        description: "Your music space. Feel every beat.",
        theme_color: "#0a0a0f",
        background_color: "#0a0a0f",
        display: "standalone",
        // Prefer the most immersive shell the platform allows, then degrade.
        display_override: ["window-controls-overlay", "standalone"],
        orientation: "portrait-primary",
        start_url: "/",
        scope: "/",
        lang: "en",
        categories: ["music", "entertainment"],
        // Long-press / jump-list shortcuts on Android, Windows and desktop PWAs.
        shortcuts: [
          {
            name: "Search",
            short_name: "Search",
            url: "/search",
            icons: [{ src: "pwa-192.png", sizes: "192x192", type: "image/png" }]
          },
          {
            name: "Your Library",
            short_name: "Library",
            url: "/library",
            icons: [{ src: "pwa-192.png", sizes: "192x192", type: "image/png" }]
          }
        ],
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          {
            src: "pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
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
