# Josh-Fy

![Josh-Fy Logo](src/assets/branding/logo.png)

Josh-Fy is a Spotify-inspired music discovery web app built with React, Vite, and Tailwind CSS.

Tagline: Your music space. Feel every beat.

## Stack

- React
- Vite
- Tailwind CSS
- React Router
- Zustand
- TanStack Query
- Lucide React
- Dexie kept in the project structure for future offline library work

## Features in this version

- Responsive Spotify-inspired interface
- Home discovery dashboard with branded hero banner
- Search experience with free-source adapters and fallback seed data
- Sticky mini-player and full player page
- Playlist and library UI foundations
- Vercel-ready setup with no special config required

## Branding Assets

- Logo: `src/assets/branding/logo.png`
- Banner: `src/assets/branding/banner.png`

## Environment variables

Copy `.env.example` to `.env` if you want to use a Jamendo API key.

```bash
cp .env.example .env
```

Set:

```bash
VITE_JAMENDO_CLIENT_ID=your_key_here
```

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

This app is ready to deploy as a standard Vite project.

Build command:

```bash
npm run build
```

Output directory:

```bash
dist
```

If you use environment variables, add them in the Vercel project settings.

## Platform strategy (maximum per platform)

Each platform is pushed to what it can actually do, rather than to a lowest
common denominator:

- **Web (browser):** Installable PWA with offline app-shell caching, plus full
  **MediaSession API** integration — the app owns the OS "now playing" surface
  (hardware media keys, Windows SMTC flyout, macOS Now Playing / Control Center),
  with artwork and a live scrubber.
- **Mobile (installed PWA):** Standalone/fullscreen shell, background audio, and
  lock-screen / notification media controls via MediaSession (Android, and iOS
  16.4+ as an installed PWA). Home-screen shortcuts jump to Search and Library.
  A system-wide overlay isn't possible on mobile, so the in-app full-screen
  visualizer fills that role.
- **Windows desktop:** A separate always-on Electron overlay (`desktop-overlay/`)
  that renders a click-through visualizer just above the taskbar on every
  monitor. It reacts **only to Josh-Fy**: the web app streams its own analyser
  data to the overlay over a local WebSocket (`127.0.0.1:17632`), so other apps'
  audio never triggers it. See `desktop-overlay/README.md`.

## Notes

- No Capacitor or Android native project is included; mobile is delivered as an
  installable PWA.
- No APK files are generated.
