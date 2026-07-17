import { create } from "zustand";
import { persist } from "zustand/middleware";

// The player's single source of truth. The <audio> element in layout/MiniPlayer
// mirrors this state; everything else (pages, widget bridge, media keys) talks
// to the store only.
//
// Seeking flows one way: seekTo() posts a pendingSeek, the audio element applies
// it and calls clearPendingSeek(). That keeps scrubbing from any surface (full
// player slider, mini-player bar, media keys, desktop widget) on one code path.
export const usePlayerStore = create(
  persist(
    (set, get) => ({
      // Start empty: the app opens with no fake "now playing" track. Real,
      // streamable songs populate the queue as the feed loads.
      queue: [],
      currentTrack: null,
      isPlaying: false,
      // idle | loading | playing | paused | error — drives buffering spinners
      // and the "couldn't play" toast.
      status: "idle",
      volume: 0.85,
      muted: false,
      currentTime: 0,
      duration: 0,
      pendingSeek: null,
      shuffle: false,
      repeat: "off", // off | all | one
      likedTrackIds: [],
      likedTracks: [],
      recentlyPlayed: [],

      setQueue: (queue) => set({ queue }),
      setTrack: (track, queue) =>
        set((state) => ({
          currentTrack: track,
          queue: queue?.length ? queue : state.queue,
          isPlaying: true,
          status: "loading",
          currentTime: 0,
          pendingSeek: null,
          recentlyPlayed: [
            track,
            ...state.recentlyPlayed.filter((item) => item.id !== track.id)
          ].slice(0, 12)
        })),

      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      setStatus: (status) => set({ status }),

      setVolume: (volume) => set({ volume, muted: volume === 0 ? get().muted : false }),
      toggleMute: () => set((state) => ({ muted: !state.muted })),

      setCurrentTime: (currentTime) => set({ currentTime }),
      setDuration: (duration) => set({ duration }),
      seekTo: (time) => set({ pendingSeek: Math.max(0, time), currentTime: Math.max(0, time) }),
      seekBy: (delta) => {
        const { currentTime, duration } = get();
        const target = Math.min(Math.max(0, currentTime + delta), duration || Infinity);
        set({ pendingSeek: target, currentTime: target });
      },
      clearPendingSeek: () => set({ pendingSeek: null }),

      toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
      cycleRepeat: () =>
        set((state) => ({
          repeat: state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off"
        })),

      // auto=true means the track ended on its own (vs the user pressing next).
      // Repeat-one only loops on natural end; a deliberate "next" always moves on.
      nextTrack: (auto = false) => {
        const { currentTrack, queue, shuffle, repeat } = get();
        if (!queue.length) return;

        if (auto && repeat === "one" && currentTrack) {
          set({ pendingSeek: 0, currentTime: 0, isPlaying: true });
          return;
        }

        const currentIndex = queue.findIndex((track) => track.id === currentTrack?.id);

        if (shuffle && queue.length > 1) {
          let pick = currentIndex;
          while (pick === currentIndex) {
            pick = Math.floor(Math.random() * queue.length);
          }
          set({ currentTrack: queue[pick], isPlaying: true, status: "loading", currentTime: 0 });
          return;
        }

        const atEnd = currentIndex === queue.length - 1;
        if (auto && atEnd && repeat === "off") {
          // Natural end of the queue: stop cleanly instead of looping forever.
          set({ isPlaying: false, status: "paused" });
          return;
        }
        const next = queue[(currentIndex + 1) % queue.length];
        set({ currentTrack: next, isPlaying: true, status: "loading", currentTime: 0 });
      },

      previousTrack: () => {
        const { currentTrack, queue, currentTime } = get();
        // Spotify behavior: past 3s into a song, "previous" restarts it.
        if (currentTime > 3) {
          set({ pendingSeek: 0, currentTime: 0, isPlaying: true });
          return;
        }
        if (!queue.length) return;
        const currentIndex = queue.findIndex((track) => track.id === currentTrack?.id);
        const previous = queue[(currentIndex - 1 + queue.length) % queue.length];
        set({ currentTrack: previous, isPlaying: true, status: "loading", currentTime: 0 });
      },

      playTrackAt: (index) => {
        const { queue } = get();
        if (!queue[index]) return;
        set({ currentTrack: queue[index], isPlaying: true, status: "loading", currentTime: 0 });
      },

      toggleLike: (trackOrId) => {
        const id = typeof trackOrId === "object" ? trackOrId.id : trackOrId;
        const track = typeof trackOrId === "object" ? trackOrId : null;
        set((state) => {
          const liked = state.likedTrackIds.includes(id);
          return {
            likedTrackIds: liked
              ? state.likedTrackIds.filter((existing) => existing !== id)
              : [...state.likedTrackIds, id],
            likedTracks: liked
              ? state.likedTracks.filter((existing) => existing.id !== id)
              : track
                ? [track, ...state.likedTracks]
                : state.likedTracks
          };
        });
      }
    }),
    {
      name: "joshfy-player",
      // Only durable listener state persists; live playback state never does.
      partialize: (state) => ({
        volume: state.volume,
        muted: state.muted,
        shuffle: state.shuffle,
        repeat: state.repeat,
        likedTrackIds: state.likedTrackIds,
        likedTracks: state.likedTracks,
        recentlyPlayed: state.recentlyPlayed
      })
    }
  )
);
