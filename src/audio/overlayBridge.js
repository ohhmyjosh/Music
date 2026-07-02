// Streams Josh-Fy's OWN audio-reactive data to the desktop overlay.
//
// Why this exists: the overlay used to visualize Windows system loopback audio,
// which reacts to EVERYTHING playing on the PC. Josh-Fy runs as a browser tab,
// and the OS can't isolate a single tab's audio (per-app capture would grab the
// whole browser). So instead of fighting that, we invert the flow: this app is
// the source of truth and pushes its own analyser data to the overlay over a
// local WebSocket. The overlay then renders ONLY Josh-Fy — nothing else.
//
// The overlay's Electron main process hosts the server on 127.0.0.1:17632.
// If the overlay isn't running we simply keep retrying quietly; the web app is
// unaffected.

import { getAnalyser } from "./analyser";
import { usePlayerStore } from "../store/playerStore";

const OVERLAY_URL = "ws://127.0.0.1:17632";
const FPS = 30;

let socket = null;
let started = false;
let freqData = null;
let reconnectDelay = 1000;
let reconnectTimer = null;

function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(connect, reconnectDelay);
  reconnectDelay = Math.min(reconnectDelay * 1.5, 8000); // gentle backoff
}

function connect() {
  try {
    socket = new WebSocket(OVERLAY_URL);
  } catch {
    scheduleReconnect();
    return;
  }
  socket.onopen = () => {
    reconnectDelay = 1000;
  };
  socket.onclose = () => {
    socket = null;
    scheduleReconnect();
  };
  socket.onerror = () => {
    try {
      socket.close();
    } catch {
      /* ignore */
    }
  };
}

// Sample the shared analyser and push one frame to the overlay.
function tick() {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  const { isPlaying, currentTrack } = usePlayerStore.getState();
  const analyser = getAnalyser();

  let real = false;
  let bins = [];
  if (analyser) {
    if (!freqData || freqData.length !== analyser.frequencyBinCount) {
      freqData = new Uint8Array(analyser.frequencyBinCount);
    }
    analyser.getByteFrequencyData(freqData);
    // Cross-origin streams report all-zero data; flag whether it's real so the
    // overlay can fall back to the same simulated wave the in-app visualizer uses.
    for (let i = 0; i < freqData.length; i += 1) {
      if (freqData[i] > 0) {
        real = true;
        break;
      }
    }
    bins = Array.from(freqData);
  }

  try {
    socket.send(
      JSON.stringify({
        t: "joshfy-audio",
        playing: Boolean(isPlaying && currentTrack),
        real,
        bins,
        title: currentTrack?.title || null,
        artist: currentTrack?.artist || null
      })
    );
  } catch {
    /* socket closing — next reconnect handles it */
  }
}

// Start streaming. Safe to call more than once; only the first call takes effect.
export function startOverlayBridge() {
  if (started || typeof window === "undefined" || !("WebSocket" in window)) return;

  // The overlay's server is plain ws:// on the loopback address. An HTTPS page
  // cannot open an insecure ws:// socket (mixed content is blocked), and a phone
  // or remote device can't reach the user's PC anyway. So only bridge from a
  // local http origin (dev server / desktop). Otherwise we'd spin a 30fps timer
  // and reconnect loop forever, spamming the console on the deployed web app.
  const { protocol, hostname } = window.location;
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
  if (protocol !== "http:" || !isLocalHost) return;

  started = true;
  connect();
  setInterval(tick, Math.round(1000 / FPS));
}
