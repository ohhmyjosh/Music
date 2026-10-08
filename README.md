# Josh-Fy

![Josh-Fy Logo](src/assets/branding/logo.png)

A free music app laid out like YouTube Music, with Spotify's catalogue feel. No subscriptions,
no ads, no accounts. Every device keeps its own library.

## What it does

- **Home**: mood chips, Listen again, Quick picks (radio from what you play), Mixed for you,
  Trending, Top charts, New releases, and mood shelves, all steered by the languages you pick.
- **Explore**: new albums and singles, charts, and a Moods & genres grid.
- **Search**: live suggestions, recent searches, a Top result, and filters for Songs, Albums,
  Artists, Playlists and Community.
- **Now Playing**: art or a live visualizer, plus **Up next** (drag to reorder, Autoplay, save
  the queue), **Lyrics** (time-synced, tap a line to seek) and **Related**.
- **Library**: Liked Music, your playlists, saved albums and playlists, subscribed artists,
  downloads, and history.
- **Album, playlist and artist pages**, including artist radio and Subscribe.
- **Offline**: download songs or whole playlists, or import audio files from the device.
- **Share links**: `/watch?v=<id>` opens and plays a song.
- **Keyboard**: Space play/pause, ←/→ seek, Shift+N/P next/previous, ↑/↓ volume, M mute,
  `/` search, +/- like/dislike.
- **PWA**: installable, with lock-screen and media-key controls through MediaSession.

## Where the music comes from

| Source | Used for | Notes |
|---|---|---|
| JioSaavn, via community deployments of the open-source jiosaavn-api | Songs, albums, artists, editorial playlists, 320 kbps streams | Several mirrors are listed in `src/api/saavn.js`; each request fails over between them |
| Audius | Indie and community uploads | Free, no API key |
| LRCLIB, with lyrics.ovh as fallback | Synced and plain lyrics | Free, no API key |
| iTunes Search API | Cover art when a track ships without any | Free, no API key |

No API keys or environment variables are needed.

## Run locally

```bash
npm install
npm run dev       # http://localhost:5173
npm run build
npm run preview   # serve the production build
```

The Windows desktop overlay (`desktop-overlay/`) is unchanged. See its README.

See [ARCHITECTURE.md](ARCHITECTURE.md) for how the app is put together.
