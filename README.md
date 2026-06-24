# Josh-Fy

Josh-Fy is a Spotify-inspired music discovery web app built with React, Vite, and Tailwind CSS.

Tagline: Your free music space.

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
- Home discovery dashboard
- Search experience with free-source adapters and fallback seed data
- Sticky mini-player and full player page
- Playlist and library UI foundations
- Vercel-ready setup with no special config required

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

## Notes

- No Capacitor or Android setup is included.
- No APK files are generated.
- PWA support can be added later without changing the overall app structure.
