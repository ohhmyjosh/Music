import { create } from "zustand";

export const usePlayerStore = create((set, get) => ({
  // Start empty: the app opens with no fake "now playing" track. Real, streamable
  // songs (Audius) populate the queue as the feed loads, and any Play button sets
  // the current track together with its own queue.
  queue: [],
  currentTrack: null,
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
