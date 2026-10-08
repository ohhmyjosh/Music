export const fallbackArtwork =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%237c3aed'/%3E%3Cstop offset='55%25' stop-color='%231a1a23'/%3E%3Cstop offset='100%25' stop-color='%230a0a0f'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='600' height='600' fill='url(%23g)'/%3E%3Ctext x='60' y='330' fill='white' font-family='Arial,sans-serif' font-size='96' font-weight='700'%3EJF%3C/text%3E%3C/svg%3E";

export function formatTime(seconds) {
  if (!seconds || !Number.isFinite(seconds)) return "0:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = String(total % 60).padStart(2, "0");
  return hours ? `${hours}:${String(mins).padStart(2, "0")}:${secs}` : `${mins}:${secs}`;
}

export function formatCount(value) {
  const n = Number(value) || 0;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace(/\.0$/, "")}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export function totalDuration(tracks = []) {
  const seconds = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return hours ? `${hours} hr ${mins} min` : `${mins} min`;
}

// The fields worth persisting. Strips anything transient (queue ids, blob URLs)
// so libraries stay small and stored tracks stay playable after a reload.
export function slimTrack(track) {
  return {
    id: track.id,
    sourceId: track.sourceId || "",
    source: track.source,
    title: track.title,
    artist: track.artist,
    artists: track.artists || [],
    album: track.album || "",
    albumId: track.albumId || "",
    artwork: track.artwork || "",
    artworkSmall: track.artworkSmall || "",
    audioUrl: track.source === "local" ? "" : track.audioUrl || "",
    streamUrls: track.streamUrls || [],
    duration: track.duration || 0,
    language: track.language || "",
    genre: track.genre || "",
    year: track.year || "",
    explicit: Boolean(track.explicit)
  };
}

// A file the listener imported from their own device. Its audio lives only in
// the downloads table, so it's playable but never streamable.
export function localTrack(file) {
  return {
    id: `local-${file.name}-${file.lastModified}`,
    sourceId: "",
    source: "local",
    title: file.name.replace(/\.[^/.]+$/, "").replace(/_+/g, " "),
    artist: "On this device",
    artists: [],
    album: "Imported files",
    albumId: "",
    artwork: "",
    artworkSmall: "",
    audioUrl: "",
    streamUrls: [],
    duration: 0,
    language: "",
    genre: "",
    year: "",
    explicit: false
  };
}

export function trackSubtitle(track) {
  return [track.artist, track.album].filter(Boolean).join(" • ");
}
