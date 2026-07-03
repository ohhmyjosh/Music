// Secure bridge between the main process and the transparent overlay renderer.
// contextIsolation stays on; we expose only read-only event subscriptions.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("joshfy", {
  // Live audio frames streamed from the Josh-Fy web app (frequency bins +
  // playing state). This is the ONLY thing that drives the visualizer, so the
  // overlay reacts to Josh-Fy alone and never to other apps' sound.
  onAudioData: (cb) =>
    ipcRenderer.on("audio-data", (_event, data) => cb(data)),
  // Current track title/artist, also from the Josh-Fy web app.
  onNowPlaying: (cb) =>
    ipcRenderer.on("now-playing", (_event, data) => cb(data)),
  // Overlay settings (dock position, now-playing label on/off).
  onConfig: (cb) => ipcRenderer.on("config", (_event, data) => cb(data)),
  // Widget -> player controls. Relayed to the Josh-Fy web app over the bridge.
  // action: "toggle" | "play" | "pause" | "next" | "prev".
  sendControl: (action) => ipcRenderer.send("widget-control", action)
});
