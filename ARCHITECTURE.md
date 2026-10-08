# Josh-Fy architecture

React 18 + Vite + Tailwind single-page app, deployed on Vercel as a PWA. It has no backend:
the browser talks to free public music APIs directly.

```
 pages/ ──► components/ ──► stores (zustand) ──► api/ ──► Saavn mirrors · Audius · LRCLIB · iTunes
                               │
                               └─► player/AudioEngine ──► <audio> ──► speakers
                                                            └ (visualizer ON only) ─► Web Audio analyser
                                                                                        ├─► visualizer
                                                                                        └─► desktop overlay (ws)
```

## Layers

**`src/api/`**: the data layer. Every function returns the same plain **track shape**
(`id, source, title, artist, artists[{id,name}], album, albumId, artwork, audioUrl, streamUrls,
duration, ...`) whichever source it came from.
- `saavn.js`: catalogue client with per-request mirror failover. Each mirror gets a 7s
  timeout; one that times out or errors cools down (15s, doubling to 5 min) and is only
  tried as a last resort meanwhile. Errors are typed: `CatalogError` with kind
  `not-found` (the catalogue answered; never retried) or `unavailable` (no mirror could
  answer).
- `audius.js`: community uploads, with stream retry across discovery nodes. A node that
  fails a request is dropped for the session and the request retried on another.
- `radio.js`: builds a station from a seed song: the artist's top songs plus similar artists'
  songs, interleaved and deduplicated. Powers Autoplay, Start radio, Quick picks and Related.
- `feed.js`: moods, genres and languages, mapped to editorial playlist searches.
- `lyrics.js`: LRCLIB synced lyrics parsed from LRC, with a plain-text fallback.

**`src/store/`**: state, split by how often it changes and where it lives.
- `playerStore`: the queue (YT Music model: a list plus a cursor; every item has a unique
  `qid`), transport, shuffle/repeat/autoplay. Persisted to localStorage, so the queue survives
  a reload.
- `usePlaybackClock` (in `playerStore.js`): current time, duration and buffered. Kept separate
  and *not* persisted, because it updates about 4×/s and would otherwise re-serialise the queue
  and re-render every subscriber.
- `libraryStore`: likes, dislikes, playlists, saved items, subscriptions, history, play counts,
  languages and profile name. Persisted to IndexedDB through a Dexie-backed storage adapter.
  Export/import in Settings is the backup, since there are no accounts.
- `downloadsStore`: offline audio blobs in IndexedDB. The engine prefers a downloaded copy
  over the network, looked up in IndexedDB directly so it works before the list loads.
  Downloads try each quality tier, reject anything that isn't audio, report whole-percent
  progress, and only appear once the blob is stored. A second tap shares the first download.
- `settingsStore`: device preferences (localStorage `joshfy-settings`). Today: the Music
  visualizer switch, on by default on desktop and off on touch devices.
- `uiStore`: Now Playing panel, ⋮ menu, dialogs and toasts.

**`src/lib/queries.js`**: the TanStack Query client and query factories. Cards and pages share
one cache, so pressing play on an album card and then opening the album fetches once.

**`src/components/player/AudioEngine.jsx`**: headless. It owns the single `<audio>` element and
wires it to the stores, MediaSession (lock screen and media keys), keyboard shortcuts and the
desktop overlay bridge. A play counts toward history after 10 seconds.

- **Every track load has an id.** Async work (offline lookup, URL refresh, retries) checks it
  and drops itself if a newer song started, and events from an abandoned source are ignored.
- **Recovery ladder, per song:** retry once without CORS (visualizer mode only) → if the
  device is offline, wait for `online` → if the song had already played, it's the network:
  retry in place at the same position with backoff (~35s) → next stream candidate (quality
  tiers, other Audius nodes) → fetch fresh stream URLs from the catalogue once → give up.
  Giving up pauses on a network failure, skips a broken song (3 in a row at most), and does
  nothing at all for a song nobody pressed play on (a restored queue). A stall watchdog
  (12s without progress) feeds the same ladder.
- **The visualizer is never in the playback path.** Two element modes: `plain` (no CORS, never
  routed) and `viz` (loaded with CORS so the analyser may route it). An element routed through
  Web Audio can't be un-routed, so switching mode swaps in a new element at the same position.
  `audio/analyser.js` only routes once the AudioContext is actually running, and if the
  context stops while music plays it reports a failure and the engine drops to `plain`.
- The playing position is saved (localStorage `joshfy-position`) every few seconds and on
  `pagehide`, so a reload resumes the song where it was, paused.

**`playerStore` queue generations.** Starting a new queue bumps a generation counter. Radio and
Autoplay top-ups remember the generation they started in and discard their result if it changed,
so a slow response for the previous song never lands in the new queue. One top-up runs per
generation; a song that ends while it loads waits for it instead of stopping.

## Persistence keys

| Store | Where | Key |
|---|---|---|
| player (queue, volume, modes) | localStorage | `joshfy-player-v2` |
| playing position | localStorage | `joshfy-position` |
| device settings (visualizer) | localStorage | `joshfy-settings` |
| library | IndexedDB `wavebox-offline-db` → `kv` | `joshfy-library` |
| downloads | IndexedDB `wavebox-offline-db` → `downloads` | track id |

Upgrades from the pre-rebuild app: likes and recent plays are read once from the old
`joshfy-player` localStorage key, and old offline tracks move from `offlineTracks` to
`downloads`. A legacy row is deleted only after its copy is stored; rows with no audio blob
are left in place.

## Desktop overlay (`desktop-overlay/`)

An Electron tray app. It serves the built web app on `http://127.0.0.1:17650` (the bridge only
runs from a local http origin), hosts a WebSocket on `127.0.0.1:17632`, and draws a
click-through, always-on-top strip on every monitor plus a small control widget.

- Web app → overlay: `{ t: "joshfy-audio", playing, viz, real, bins, title, artist, artwork }`.
  30 fps only while the visualizer is on and music is playing; otherwise one now-playing
  message a second with no bins.
- Widget → web app: `{ t: "joshfy-control", action: toggle|play|pause|next|prev }`.
- It never captures system audio: the strip only ever draws what Josh-Fy sends.
- Tray settings (persisted in the app's `settings.json`): on/off, top/bottom, height,
  intensity, widget style/size, track label, start with Windows.

## Known limits

- The catalogue depends on community Saavn mirrors. If every mirror in `MIRRORS` goes down,
  search and feeds come back empty until a live mirror is added. Audius keeps working.
- Libraries are per device. Moving to another device takes Settings → Export, then Import there.
- iOS only starts audio from a tap and suspends Web Audio in the background; see TESTING.md.
