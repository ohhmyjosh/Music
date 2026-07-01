# Josh-Fy Overlay

An always-on, transparent music visualizer that lives at the bottom of your
screen and reacts to **any** audio playing on your PC (Josh-Fy, Spotify,
YouTube — anything). It floats above every window and lets clicks pass straight
through, so it never gets in your way.

## Run it (dev)

```bash
cd desktop-overlay
npm install
npm start
```

- A **tray icon** appears (bottom-right, near the clock).
- **Left-click the tray icon** to toggle the visualizer on/off — this is the
  "off button".
- **Right-click the tray icon** for: turn off, "Start with Windows", and Quit.

Play music in any app and the green wave beats along the bottom of the screen.

## Build a real installer (.exe)

```bash
cd desktop-overlay
npm run build
```

The Windows installer lands in `desktop-overlay/release/`. Install it once, tick
"Start with Windows" in the tray menu, and the visualizer is available at all
times — even when the Josh-Fy web app is closed.

## Notes

- System-audio capture (loopback) is a Windows feature; it needs Windows 10/11.
- The overlay is a separate app from the Josh-Fy web app on purpose, so it can
  keep running when the browser is closed. It shares the same visual style.
