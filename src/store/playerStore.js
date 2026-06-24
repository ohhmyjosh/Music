import { create } from "zustand";
import { normalizeTrack } from "../utils/normalizeTrack";
import { demoTracks } from "../data/demoTracks";

const demoQueue = demoTracks.map((track) => normalizeTrack(track, "demo"));

export const usePlayerStore = create((set, get) => ({
  queue: demoQueue,
  currentTrack: demoQueue[0],
  isPlaying: false,
  volume: 0.85,
  currentTime: 0,
  duration: 0,
  likedTrackIds: [],
  recentlyPlayed: [],
  setQueue: (queue) => set({ queue }),
  setTrack: (track, queue) =>
    set((state) => ({
      currentTrack: track,
      queue: queue?.length ? queue : state.queue,
      isPlaying: true,
      recentlyPlayed: [
        track,
        ...state.recentlyPlayed.filter((item) => item.id !== track.id)
      ].slice(0, 8)
    })),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  seekTo: (time) => set({ currentTime: time }),
  nextTrack: () => {
    const { currentTrack, queue } = get();
    if (!queue.length) return;
    const currentIndex = queue.findIndex((track) => track.id === currentTrack?.id);
    const next = queue[(currentIndex + 1) % queue.length];
    set({ currentTrack: next, isPlaying: true });
  },
  previousTrack: () => {
    const { currentTrack, queue } = get();
    if (!queue.length) return;
    const currentIndex = queue.findIndex((track) => track.id === currentTrack?.id);
    const previous = queue[(currentIndex - 1 + queue.length) % queue.length];
    set({ currentTrack: previous, isPlaying: true });
  },
  toggleLike: (trackId) =>
    set((state) => ({
      likedTrackIds: state.likedTrackIds.includes(trackId)
        ? state.likedTrackIds.filter((id) => id !== trackId)
        : [...state.likedTrackIds, trackId]
    }))
}));
