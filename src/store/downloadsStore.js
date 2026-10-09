import { create } from "zustand";
import {
  deleteDownload,
  getDownloadBlob,
  listDownloads,
  migrateLegacyOfflineTracks,
  putDownload
} from "../db/offlineDb";
import { audiusStreamCandidates } from "../api/audius";
import { localTrack, slimTrack } from "../utils/track";

// Songs saved to this device for offline listening. The audio blob lives in
// IndexedDB; the player asks `resolveOfflineUrl` before streaming, so a
// downloaded song plays with no network at all.

// A fresh object URL for a downloaded song, or null. The caller owns it and
// revokes it when done (the player does so on every track change), so a
// download deleted mid-song keeps playing until the song changes.
export async function resolveOfflineUrl(trackId) {
  const blob = await getDownloadBlob(trackId);
  return blob ? URL.createObjectURL(blob) : null;
}

// Anything smaller than this isn't a song (an error page, a captive portal).
const MIN_AUDIO_BYTES = 32 * 1024;
const AUDIO_EXTENSIONS = /\.(mp3|m4a|mp4|aac|wav|flac|ogg|oga|opus|webm|weba)$/i;

function downloadCandidates(track) {
  const urls = track.source === "audius" ? audiusStreamCandidates(track) : [...(track.streamUrls || []), track.audioUrl];
  return [...new Set(urls.filter(Boolean))].slice(0, 4);
}

// Fetch one URL into a Blob, reporting progress (0..1) when the size is known.
async function fetchAudio(url, onProgress) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed (${response.status})`);
  const type = (response.headers.get("content-type") || "").toLowerCase();
  if (type && !/^(audio\/|video\/mp4|application\/octet-stream|binary\/octet-stream)/.test(type)) {
    throw new Error(`Not audio (${type})`);
  }
  const total = Number(response.headers.get("content-length")) || 0;
  let blob;
  if (response.body && total) {
    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      onProgress(Math.min(0.99, received / total));
    }
    blob = new Blob(chunks, { type: type || "audio/mp4" });
  } else {
    blob = await response.blob();
  }
  if (blob.size < MIN_AUDIO_BYTES) throw new Error("Download was too small to be a song");
  return blob;
}

const inFlight = new Map(); // track id -> promise, so a double tap downloads once

export const useDownloadsStore = create((set, get) => ({
  items: [], // [{ track, size, savedAt }]
  pending: {}, // track id -> progress 0..1 while downloading
  hydrated: false,

  hydrate: async () => {
    // Move any pre-rebuild offline tracks into the downloads table first.
    await migrateLegacyOfflineTracks((record) => slimTrack({ ...record, source: record.source || "local" })).catch(() => {});
    const rows = await listDownloads().catch(() => []);
    set((state) => {
      // Keep anything saved while the table was being read.
      const byId = new Map(rows.map(({ track, size, savedAt }) => [track.id, { track, size, savedAt }]));
      for (const item of state.items) if (!byId.has(item.track.id)) byId.set(item.track.id, item);
      return { items: [...byId.values()].sort((a, b) => b.savedAt - a.savedAt), hydrated: true };
    });
  },

  isDownloaded: (id) => get().items.some((item) => item.track.id === id),

  download: (track) => {
    if (inFlight.has(track.id)) return inFlight.get(track.id);
    if (get().isDownloaded(track.id)) return Promise.resolve();
    const urls = downloadCandidates(track);
    if (!urls.length) return Promise.reject(new Error("This song can't be downloaded"));

    // Whole percents only, so a download doesn't re-render the UI per chunk.
    let shown = -1;
    const setProgress = (value) => {
      const percent = Math.floor(value * 100);
      if (percent === shown) return;
      shown = percent;
      set((state) => ({ pending: { ...state.pending, [track.id]: percent / 100 } }));
    };

    const job = (async () => {
      setProgress(0);
      try {
        let blob = null;
        let lastError = null;
        // Best quality first; a failing tier or node falls back to the next.
        for (const url of urls) {
          try {
            blob = await fetchAudio(url, setProgress);
            break;
          } catch (error) {
            lastError = error;
          }
        }
        if (!blob) throw lastError || new Error("Download failed");
        const slim = slimTrack(track);
        const savedAt = Date.now();
        // Nothing is listed until the audio is safely stored.
        await putDownload(slim, blob);
        set((state) => ({
          items: [{ track: slim, size: blob.size, savedAt }, ...state.items.filter((item) => item.track.id !== slim.id)]
        }));
      } finally {
        inFlight.delete(track.id);
        set((state) => {
          const pending = { ...state.pending };
          delete pending[track.id];
          return { pending };
        });
      }
    })();
    inFlight.set(track.id, job);
    return job;
  },

  importFiles: async (files) => {
    const added = [];
    for (const file of files) {
      // Some systems report no MIME type for FLAC/OPUS; trust the extension then.
      if (!file.type.startsWith("audio/") && !AUDIO_EXTENSIONS.test(file.name)) continue;
      const track = localTrack(file);
      try {
        await putDownload(track, file);
        added.push({ track, size: file.size, savedAt: Date.now() });
      } catch {
        /* storage full: skip this file, keep the rest */
      }
    }
    set((state) => ({
      items: [...added, ...state.items.filter((item) => !added.some((a) => a.track.id === item.track.id))]
    }));
    return added.length;
  },

  remove: async (id) => {
    await deleteDownload(id);
    set((state) => ({ items: state.items.filter((item) => item.track.id !== id) }));
  }
}));
