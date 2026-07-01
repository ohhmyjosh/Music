# Josh-Fy Overlay

An always-on, transparent music visualizer that sits just above your taskbar (or
at the top of the screen) and reacts **only to Josh-Fy** — not to anything else
playing on your PC. It floats above every window on **every monitor** and lets
clicks pass straight through, so it never gets in your way.

## Only Josh-Fy drives it (by design)

Earlier the overlay listened to Windows system audio, which reacts to everything
(Spotify, YouTube, notifications…). Because Josh-Fy runs as a browser tab, the OS
can't isolate a single tab's audio. So the architecture was inverted:

- The **Josh-Fy web app** analyses its own audio and streams the data to the
  overlay over a local WebSocket (`127.0.0.1:17632`).
- The overlay renders **only** those frames. When Josh-Fy is paused or closed,
  the wave fades away. Nothing else can trigger it.

The track name shown above the wave also comes from Josh-Fy, so it's always in
sync with what you're actually listening to.

## Run it (dev)

```bash
cd desktop-overlay
npm install
npm start
```

- A **tray icon** appears (bottom-right, near the clock).
- **Left-click the tray icon** to toggle the visualizer on/off.
- **Right-click the tray icon** for:
  - Turn visualizer on/off
  - **Position** — dock the strip just above the taskbar (bottom) or at the top
  - **Show track name** — toggle the now-playing label
  - **Start with Windows**
  - Quit

Your choices persist between launches.

Then open the Josh-Fy web app (`npm run dev` in the project root →
http://localhost:5173) and press play. The green wave beats along the edge of
every screen, in sync with Josh-Fy only.

## Build a real installer (.exe)

```bash
cd desktop-overlay
npm run build
```

The Windows installer lands in `desktop-overlay/release/`. Install it once, tick
"Start with Windows" in the tray menu, and the visualizer is available whenever
Josh-Fy is playing.

## Notes

- The overlay is a separate app from the Josh-Fy web app on purpose, so it can
  keep running in the tray while the browser is closed. It shares the same
  visual style.
- The web app connects to `ws://127.0.0.1:17632`. When you run Josh-Fy locally
  over http this works out of the box. (A page served over https can't open a
  plain-ws localhost socket due to mixed-content rules — run Josh-Fy locally, or
  serve the overlay bridge over wss, to pair them.)
- The web/mobile app also owns its own OS "now playing" surface (lock screen,
  media keys, Control Center) via the MediaSession API — see the main README.
