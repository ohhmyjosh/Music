import { create } from "zustand";
import {
  getOfflineTracks,
  getPlaylists,
  removeOfflineTrack,
  saveOfflineTrack,
  savePlaylist
} from "../db/offlineDb";
import { normalizeTrack } from "../utils/normalizeTrack";

export const useLibraryStore = create((set, get) => ({
  offlineTracks: [],
  playlists: [
    {
      id: "playlist-favs",
      name: "Starter Mix",
      description: "A default playlist to demo Josh-Fy's collection UI.",
      trackIds: []
    }
  ],
  isHydrated: false,
  hydrate: async () => {
    const [offlineTracks, playlists] = await Promise.all([
      getOfflineTracks(),
      getPlaylists()
    ]);

    set((state) => ({
      offlineTracks,
      playlists: playlists.length ? playlists : state.playlists,
      isHydrated: true
    }));
  },
  saveTrackOffline: async (track) => {
    if (!track.downloadUrl && !track.audioUrl.startsWith("blob:")) {
      throw new Error("This track does not expose an allowed download URL.");
    }

    const blob =
      track.audioUrl.startsWith("blob:")
        ? await fetch(track.audioUrl).then((response) => response.blob())
        : await fetch(track.downloadUrl || track.audioUrl).then((response) => response.blob());

    const stored = await saveOfflineTrack(track, blob);
    set((state) => ({
      offlineTracks: [
        stored,
        ...state.offlineTracks.filter((item) => item.id !== stored.id)
      ]
    }));
  },
  importLocalTrack: async (file) => {
    const track = normalizeTrack(
      {
        id: `local-${file.name}-${file.lastModified}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Local Import",
        album: "Imported Files",
        genre: "Local",
        mood: "Offline",
        audioUrl: URL.createObjectURL(file),
        downloadUrl: "",
        isOffline: true,
        localOnly: true
      },
      "local"
    );

    const stored = await saveOfflineTrack(track, file);
    set((state) => ({
      offlineTracks: [
        stored,
        ...state.offlineTracks.filter((item) => item.id !== stored.id)
      ]
    }));
  },
  removeOfflineTrack: async (trackId) => {
    await removeOfflineTrack(trackId);
    set((state) => ({
      offlineTracks: state.offlineTracks.filter((track) => track.id !== trackId)
    }));
  },
  createPlaylist: async (name) => {
    const nextPlaylist = {
      id: `playlist-${Date.now()}`,
      name,
      description: "Custom playlist",
      trackIds: []
    };

    await savePlaylist(nextPlaylist);
    set((state) => ({
      playlists: [nextPlaylist, ...state.playlists]
    }));
  },
  addTrackToPlaylist: async (playlistId, trackId) => {
    const nextPlaylists = get().playlists.map((playlist) =>
      playlist.id === playlistId
        ? {
            ...playlist,
            trackIds: Array.from(new Set([...playlist.trackIds, trackId]))
          }
        : playlist
    );

    const updated = nextPlaylists.find((playlist) => playlist.id === playlistId);
    if (updated) await savePlaylist(updated);
    set({ playlists: nextPlaylists });
  }
}));
