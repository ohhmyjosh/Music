import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { idbStorage } from "../db/offlineDb";
import { slimTrack } from "../utils/track";

// The listener's library: everything they own or that describes their taste.
// Persisted to this device's IndexedDB. No accounts — one library per device.

const HISTORY_LIMIT = 300;
const SEARCH_HISTORY_LIMIT = 12;

function now() {
  return Date.now();
}

function collectionSummary(item) {
  return {
    kind: item.kind,
    id: item.id,
    title: item.title,
    subtitle: item.subtitle || "",
    artwork: item.artwork || "",
    savedAt: now()
  };
}

// Likes from the pre-rebuild player store lived in localStorage; pull them in
// once so nobody loses their Liked Music on upgrade.
function legacyLikes() {
  try {
    const raw = localStorage.getItem("joshfy-player");
    if (!raw) return { liked: [], history: [] };
    const state = JSON.parse(raw)?.state || {};
    const usable = (track) => track?.id && track.audioUrl && !String(track.id).startsWith("demo");
    return {
      liked: (state.likedTracks || []).filter(usable).map(slimTrack),
      history: (state.recentlyPlayed || [])
        .filter(usable)
        .map((track, index) => ({ track: slimTrack(track), playedAt: now() - index * 1000 }))
    };
  } catch {
    return { liked: [], history: [] };
  }
}

export const useLibraryStore = create(
  persist(
    (set, get) => ({
      profileName: "",
      languages: ["hindi", "english"],
      liked: [],
      disliked: [],
      history: [],
      playCounts: {},
      playlists: [],
      savedAlbums: [],
      savedPlaylists: [],
      subscriptions: [],
      searchHistory: [],
      hydrated: false,

      setProfileName: (profileName) => set({ profileName: profileName.slice(0, 40) }),
      setLanguages: (languages) => set({ languages }),

      // ---- Likes / dislikes ---------------------------------------------------
      isLiked: (id) => get().liked.some((track) => track.id === id),
      toggleLike: (track) => {
        const liked = get().liked;
        const has = liked.some((item) => item.id === track.id);
        set({
          liked: has ? liked.filter((item) => item.id !== track.id) : [slimTrack(track), ...liked],
          disliked: get().disliked.filter((id) => id !== track.id)
        });
        return !has;
      },
      toggleDislike: (track) => {
        const disliked = get().disliked;
        const has = disliked.includes(track.id);
        set({
          disliked: has ? disliked.filter((id) => id !== track.id) : [...disliked, track.id],
          liked: get().liked.filter((item) => item.id !== track.id)
        });
        return !has;
      },

      // ---- Listening history ---------------------------------------------------
      recordPlay: (track) =>
        set((state) => ({
          history: [
            { track: slimTrack(track), playedAt: now() },
            ...state.history.filter((entry) => entry.track.id !== track.id)
          ].slice(0, HISTORY_LIMIT),
          playCounts: { ...state.playCounts, [track.id]: (state.playCounts[track.id] || 0) + 1 }
        })),
      removeFromHistory: (id) =>
        set((state) => ({ history: state.history.filter((entry) => entry.track.id !== id) })),
      clearHistory: () => set({ history: [], playCounts: {} }),

      // ---- Your playlists --------------------------------------------------------
      createPlaylist: (title, tracks = [], description = "") => {
        const playlist = {
          id: `pl-${now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          title: title.trim() || "Untitled playlist",
          description,
          tracks: tracks.map(slimTrack),
          createdAt: now(),
          updatedAt: now()
        };
        set((state) => ({ playlists: [playlist, ...state.playlists] }));
        return playlist.id;
      },
      updatePlaylist: (id, patch) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === id ? { ...playlist, ...patch, updatedAt: now() } : playlist
          )
        })),
      deletePlaylist: (id) =>
        set((state) => ({ playlists: state.playlists.filter((playlist) => playlist.id !== id) })),
      // Returns how many tracks were actually new to the playlist.
      addToPlaylist: (id, tracks) => {
        let added = 0;
        set((state) => ({
          playlists: state.playlists.map((playlist) => {
            if (playlist.id !== id) return playlist;
            const existing = new Set(playlist.tracks.map((track) => track.id));
            const fresh = tracks.filter((track) => !existing.has(track.id)).map(slimTrack);
            added = fresh.length;
            return { ...playlist, tracks: [...playlist.tracks, ...fresh], updatedAt: now() };
          })
        }));
        return added;
      },
      removeFromPlaylist: (id, trackId) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === id
              ? {
                  ...playlist,
                  tracks: playlist.tracks.filter((track) => track.id !== trackId),
                  updatedAt: now()
                }
              : playlist
          )
        })),
      movePlaylistTrack: (id, from, to) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) => {
            if (playlist.id !== id) return playlist;
            const tracks = [...playlist.tracks];
            const [item] = tracks.splice(from, 1);
            tracks.splice(to, 0, item);
            return { ...playlist, tracks, updatedAt: now() };
          })
        })),

      // ---- Saved albums / playlists, subscribed artists ----------------------
      isSaved: (kind, id) => {
        const list =
          kind === "album" ? get().savedAlbums : kind === "playlist" ? get().savedPlaylists : get().subscriptions;
        return list.some((item) => item.id === id);
      },
      toggleSaved: (item) => {
        const key =
          item.kind === "album" ? "savedAlbums" : item.kind === "playlist" ? "savedPlaylists" : "subscriptions";
        const list = get()[key];
        const has = list.some((entry) => entry.id === item.id);
        set({
          [key]: has ? list.filter((entry) => entry.id !== item.id) : [collectionSummary(item), ...list]
        });
        return !has;
      },

      // ---- Search history ----------------------------------------------------
      addSearch: (query) => {
        const text = query.trim();
        if (!text) return;
        set((state) => ({
          searchHistory: [
            text,
            ...state.searchHistory.filter((entry) => entry.toLowerCase() !== text.toLowerCase())
          ].slice(0, SEARCH_HISTORY_LIMIT)
        }));
      },
      removeSearch: (query) =>
        set((state) => ({ searchHistory: state.searchHistory.filter((entry) => entry !== query) })),
      clearSearchHistory: () => set({ searchHistory: [] }),

      // ---- Backup / restore (the library is per device) -----------------------
      exportLibrary: () => {
        const {
          profileName,
          languages,
          liked,
          disliked,
          history,
          playCounts,
          playlists,
          savedAlbums,
          savedPlaylists,
          subscriptions
        } = get();
        return {
          app: "josh-fy",
          version: 1,
          exportedAt: new Date().toISOString(),
          library: {
            profileName,
            languages,
            liked,
            disliked,
            history,
            playCounts,
            playlists,
            savedAlbums,
            savedPlaylists,
            subscriptions
          }
        };
      },
      // Merges a backup into this device's library instead of overwriting it.
      importLibrary: (backup) => {
        if (backup?.app !== "josh-fy" || !backup.library) throw new Error("Not a Josh-Fy backup file");
        const incoming = backup.library;
        const mergeById = (mine, theirs = []) => {
          const ids = new Set(mine.map((item) => item.id));
          return [...mine, ...theirs.filter((item) => item?.id && !ids.has(item.id))];
        };
        set((state) => ({
          profileName: state.profileName || incoming.profileName || "",
          languages: state.languages.length ? state.languages : incoming.languages || [],
          liked: mergeById(state.liked, incoming.liked),
          disliked: [...new Set([...state.disliked, ...(incoming.disliked || [])])],
          playlists: mergeById(state.playlists, incoming.playlists),
          savedAlbums: mergeById(state.savedAlbums, incoming.savedAlbums),
          savedPlaylists: mergeById(state.savedPlaylists, incoming.savedPlaylists),
          subscriptions: mergeById(state.subscriptions, incoming.subscriptions),
          history: state.history.length ? state.history : incoming.history || [],
          playCounts: { ...(incoming.playCounts || {}), ...state.playCounts }
        }));
      }
    }),
    {
      name: "joshfy-library",
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => {
        const { hydrated, ...rest } = state;
        return Object.fromEntries(Object.entries(rest).filter(([, value]) => typeof value !== "function"));
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!state.liked.length && !state.history.length) {
          const legacy = legacyLikes();
          if (legacy.liked.length || legacy.history.length) {
            useLibraryStore.setState({ liked: legacy.liked, history: legacy.history });
          }
        }
        useLibraryStore.setState({ hydrated: true });
      }
    }
  )
);

export function useIsLiked(id) {
  return useLibraryStore((state) => state.liked.some((track) => track.id === id));
}

export function useIsDisliked(id) {
  return useLibraryStore((state) => state.disliked.includes(id));
}
