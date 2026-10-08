# Josh-Fy architecture

React 18 + Vite + Tailwind single-page app, deployed on Vercel as a PWA. It has no backend:
the browser talks to free public music APIs directly.

```
 pages/ ──► components/ ──► stores (zustand) ──► api/ ──► Saavn mirrors · Audius · LRCLIB · iTunes
                               │
                               └─► player/AudioEngine ──► <audio> ──► Web Audio analyser
                                                                         ├─► visualizer
                                                                         └─► desktop overlay (ws)
```

## Layers

**`src/api/`**: the data layer. Every function returns the same plain **track shape**
(`id, source, title, artist, artists[{id,name}], album, albumId, artwork, audioUrl, streamUrls,
duration, ...`) whichever source it came from.
- `saavn.js`: catalogue client with per-request mirror failover.
- `audius.js`: community uploads, with stream retry across discovery nodes.
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
  over the network.
- `uiStore`: Now Playing panel, ⋮ menu, dialogs and toasts.

**`src/lib/queries.js`**: the TanStack Query client and query factories. Cards and pages share
one cache, so pressing play on an album card and then opening the album fetches once.

**`src/components/player/AudioEngine.jsx`**: headless. It owns the single `<audio>` element and
wires it to the stores, MediaSession (lock screen and media keys), keyboard shortcuts and the
desktop overlay bridge. It walks a fallback list of stream URLs (quality tiers, then other
nodes) before skipping a song, and gives up after 3 failures in a row. A play counts toward
history after 10 seconds.

## Persistence keys

| Store | Where | Key |
|---|---|---|
| player (queue, volume, modes) | localStorage | `joshfy-player-v2` |
| library | IndexedDB `wavebox-offline-db` → `kv` | `joshfy-library` |
| downloads | IndexedDB `wavebox-offline-db` → `downloads` | track id |

Upgrades from the pre-rebuild app: likes and recent plays are read once from the old
`joshfy-player` localStorage key, and old offline tracks move from `offlineTracks` to
`downloads`.

## Known limits

- The catalogue depends on community Saavn mirrors. If every mirror in `MIRRORS` goes down,
  search and feeds come back empty until a live mirror is added. Audius keeps working.
- Libraries are per device. Moving to another device takes Settings → Export, then Import there.
