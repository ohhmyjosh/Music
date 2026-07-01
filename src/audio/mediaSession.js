// Media Session integration — the maximum OS-level "now playing" surface a web
// app can reach. Wiring navigator.mediaSession gives us, for free and on every
// platform that supports it:
//
//   - Android: rich lock-screen + notification media controls with artwork
//   - iOS/iPadOS (16.4+ / installed PWA): lock-screen + Control Center controls
//   - Windows: SMTC flyout (volume/media popup) + hardware media keys
//   - macOS: Now Playing in Control Center + Touch Bar + media keys
//
// This is intentionally the platform ceiling for a browser context: you cannot
// draw a system-wide overlay from the web, but you CAN own the OS media surface.
// The desktop Electron overlay covers the always-on-top visual layer separately.

const hasMediaSession =
  typeof navigator !== "undefined" && "mediaSession" in navigator;

// Build a spread of artwork sizes the OS can pick from. Remote/data URIs are both
// fine; we advertise several sizes so lock screens choose a crisp one.
function artworkFor(track) {
  const src = track?.artwork || track?.image;
  if (!src) return [];
  const type = src.startsWith("data:image/svg") ? "image/svg+xml" : "image/png";
  return ["96x96", "128x128", "192x192", "256x256", "384x384", "512x512"].map(
    (sizes) => ({ src, sizes, type })
  );
}

// Push the current track's metadata to the OS. Safe to call on every track change.
export function setMediaSessionMetadata(track) {
  if (!hasMediaSession || !track) return;
  try {
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: track.title || "Unknown title",
      artist: track.artist || "Unknown artist",
      album: track.album || "Josh-Fy",
      artwork: artworkFor(track)
    });
  } catch {
    // MediaMetadata unsupported — ignore, playback is unaffected.
  }
}

// Reflect play/pause so the OS shows the right button and state.
export function setMediaSessionPlaybackState(isPlaying) {
  if (!hasMediaSession) return;
  try {
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  } catch {
    /* no-op */
  }
}

// Feed the OS the scrubber position so the lock screen shows a live progress bar
// and users can seek from it. Guarded because bad values throw.
export function setMediaSessionPosition({ duration, position, playbackRate = 1 }) {
  if (!hasMediaSession || typeof navigator.mediaSession.setPositionState !== "function") {
    return;
  }
  if (!Number.isFinite(duration) || duration <= 0) return;
  const clamped = Math.max(0, Math.min(position || 0, duration));
  try {
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate: playbackRate || 1,
      position: clamped
    });
  } catch {
    /* no-op */
  }
}

// Wire the hardware/OS control buttons to app actions. Call once; handlers read
// live callbacks so we don't need to re-register on every render.
export function setupMediaSessionHandlers(handlers) {
  if (!hasMediaSession) return;
  const bind = (action, fn) => {
    try {
      navigator.mediaSession.setActionHandler(action, fn);
    } catch {
      // Action unsupported on this platform — that's fine, it's optional.
    }
  };

  bind("play", () => handlers.play?.());
  bind("pause", () => handlers.pause?.());
  bind("previoustrack", () => handlers.previous?.());
  bind("nexttrack", () => handlers.next?.());
  bind("stop", () => handlers.pause?.());
  bind("seekto", (details) => {
    if (details.fastSeek && handlers.fastSeek) return handlers.fastSeek(details.seekTime);
    handlers.seek?.(details.seekTime);
  });
  bind("seekbackward", (details) =>
    handlers.seekBy?.(-(details.seekOffset || 10))
  );
  bind("seekforward", (details) =>
    handlers.seekBy?.(details.seekOffset || 10)
  );
}
