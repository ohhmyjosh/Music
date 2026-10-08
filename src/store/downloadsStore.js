import { create } from "zustand";
import {
  deleteDownload,
  getDownloadBlob,
  listDownloads,
  putDownload,
  takeLegacyOfflineTracks
} from "../db/offlineDb";
import { localTrack, slimTrack } from "../utils/track";

// Songs saved to this device for offline listening. The audio blob lives in
// IndexedDB; the player asks `resolveOfflineUrl` before streaming, so a
// downloaded song plays with no network at all.

const blobUrls = new Map(); // track id -> object URL, created once per session

export async function resolveOfflineUrl(trackId) {
  if (blobUrls.has(trackId)) return blobUrls.get(trackId);
  const blob = await getDownloadBlob(trackId);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  blobUrls.set(trackId, url);
  return url;
}

function forgetBlobUrl(trackId) {
  const url = blobUrls.get(trackId);
  if (url) URL.revokeObjectURL(url);
  blobUrls.delete(trackId);
}

export const useDownloadsStore = create((set, get) => ({
  items: [], // [{ track, size, savedAt }]
  pending: {}, // track id -> true while downloading
  hydrated: false,

  hydrate: async () => {
    // Move any pre-rebuild offline tracks into the downloads table first.
    const legacy = await takeLegacyOfflineTracks().catch(() => []);
    for (const record of legacy) {
      if (record.localBlob instanceof Blob) {
        await putDownload(slimTrack({ ...record, source: record.source || "local" }), record.localBlob);
      }
    }
    const rows = await listDownloads().catch(() => []);
    set({
      items: rows
        .map(({ track, size, savedAt }) => ({ track, size, savedAt }))
        .sort((a, b) => b.savedAt - a.savedAt),
      hydrated: true
    });
  },

  isDownloaded: (id) => get().items.some((item) => item.track.id === id),

  download: async (track) => {
    if (get().pending[track.id] || get().isDownloaded(track.id)) return;
    const url = track.streamUrls?.[0] || track.audioUrl;
    if (!url) throw new Error("This song can't be downloaded");
    set((state) => ({ pending: { ...state.pending, [track.id]: true } }));
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Download failed (${response.status})`);
      const blob = await response.blob();
      const slim = slimTrack(track);
      await putDownload(slim, blob);
      set((state) => ({
        items: [{ track: slim, size: blob.size, savedAt: Date.now() }, ...state.items]
      }));
    } finally {
      set((state) => {
        const pending = { ...state.pending };
        delete pending[track.id];
        return { pending };
      });
    }
  },

  importFiles: async (files) => {
    const added = [];
    for (const file of files) {
      if (!file.type.startsWith("audio/")) continue;
      const track = localTrack(file);
      await putDownload(track, file);
      added.push({ track, size: file.size, savedAt: Date.now() });
    }
    set((state) => ({
      items: [...added, ...state.items.filter((item) => !added.some((a) => a.track.id === item.track.id))]
    }));
    return added.length;
  },

  remove: async (id) => {
    await deleteDownload(id);
    forgetBlobUrl(id);
    set((state) => ({ items: state.items.filter((item) => item.track.id !== id) }));
  }
}));
