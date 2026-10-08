import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildRadio } from "../api/radio";
import { slimTrack } from "../utils/track";
import { useLibraryStore } from "./libraryStore";

// The player's single source of truth. The <audio> element (player/AudioEngine)
// mirrors this state; every surface — player bar, Now Playing, media keys,
// desktop widget — talks to the store only.
//
// The queue is YouTube Music's model: an ordered list with a cursor (`index`).
// Items carry a unique `qid`, so the same song can be queued twice. With
// Autoplay on, a radio built from the current song is appended whenever the
// listener nears the end, so the music never just stops.

const QUEUE_LIMIT = 400;
const AUTOPLAY_THRESHOLD = 2; // songs left before radio tops the queue up

let qidCounter = 0;
// Bumped whenever the listener starts a new queue. Radio fetches remember the
// generation they started in and throw their result away if it changed, so a
// slow response for the previous song can never land in the new queue.
let generation = 0;
// The radio top-up in flight: { generation, promise }. Callers in the same
// generation share it instead of being turned away while it loads.
let topUp = null;

function withQid(track) {
  qidCounter += 1;
  return { ...slimTrack(track), qid: `q${Date.now().toString(36)}${qidCounter}` };
}

function shuffleArray(items) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Fast-moving playback position lives in its own store: it changes several
// times a second and must never trigger persistence or re-render the queue.
export const usePlaybackClock = create((set) => ({
  currentTime: 0,
  duration: 0,
  buffered: 0,
  setTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setBuffered: (buffered) => set({ buffered })
}));

export const usePlayerStore = create(
  persist(
    (set, get) => {
      // Point the cursor at a queue position and start loading it.
      const goTo = (index, extra = {}) => {
        const track = get().queue[index];
        if (!track) return;
        usePlaybackClock.setState({ currentTime: 0, duration: track.duration || 0, buffered: 0 });
        set({ index, currentTrack: track, isPlaying: true, status: "loading", pendingSeek: null, ...extra });
        get().ensureUpcoming();
      };

      return {
        queue: [],
        index: -1,
        currentTrack: null,
        isPlaying: false,
        // idle | loading | playing | paused | error
        status: "idle",
        volume: 0.85,
        muted: false,
        pendingSeek: null,
        repeat: "off", // off | all | one
        shuffle: false,
        unshuffledOrder: null, // qids in pre-shuffle order, to restore on un-shuffle
        autoplay: true,
        autoplayLoading: false,
        playingFrom: null, // { label, path }

        // ---- Starting playback ----------------------------------------------
        // Replace the queue with `tracks` and start at `start` (YT Music: playing
        // anything from an album/playlist/search makes that list the queue).
        playTracks: (tracks, start = 0, playingFrom = null) => {
          const playable = tracks.filter((track) => track && (track.audioUrl || track.source === "local"));
          if (!playable.length) return;
          const startTrack = tracks[start];
          let ordered = playable.map(withQid);
          let index = Math.max(0, playable.indexOf(startTrack));
          let unshuffledOrder = null;
          if (get().shuffle) {
            unshuffledOrder = ordered.map((item) => item.qid);
            const first = ordered[index];
            ordered = [first, ...shuffleArray(ordered.filter((item) => item !== first))];
            index = 0;
          }
          generation += 1;
          set({ queue: ordered.slice(0, QUEUE_LIMIT), unshuffledOrder, playingFrom, autoplayLoading: false });
          goTo(index);
        },
        playTrack: (track, playingFrom = null) => get().playTracks([track], 0, playingFrom),
        shufflePlay: (tracks, playingFrom = null) => {
          const playable = tracks.filter((track) => track.audioUrl || track.source === "local");
          if (!playable.length) return;
          set({ shuffle: true });
          get().playTracks(playable, Math.floor(Math.random() * playable.length), playingFrom);
        },

        // A radio: the seed plays now, similar music fills the queue behind it.
        startRadio: async (seed, label) => {
          get().playTracks([seed], 0, { label: label || `${seed.title} radio`, path: null });
          const mine = generation;
          set({ autoplayLoading: true });
          try {
            const disliked = new Set(useLibraryStore.getState().disliked);
            const radio = await buildRadio(seed, { exclude: disliked, limit: 30 });
            // The listener may have started something else while this loaded.
            if (generation !== mine) return;
            const queued = new Set(get().queue.map((item) => item.id));
            const fresh = radio.filter((track) => !queued.has(track.id));
            set((state) => ({ queue: [...state.queue, ...fresh.map(withQid)].slice(0, QUEUE_LIMIT) }));
          } catch {
            /* catalog down: the seed still plays */
          } finally {
            if (generation === mine) set({ autoplayLoading: false });
          }
        },

        // ---- Queue editing ---------------------------------------------------
        playNext: (tracks) => {
          const list = (Array.isArray(tracks) ? tracks : [tracks]).map(withQid);
          const { queue, index } = get();
          if (index < 0) {
            get().playTracks(list, 0);
            return;
          }
          set({ queue: [...queue.slice(0, index + 1), ...list, ...queue.slice(index + 1)] });
        },
        addToQueue: (tracks) => {
          const list = (Array.isArray(tracks) ? tracks : [tracks]).map(withQid);
          if (get().index < 0) {
            get().playTracks(list, 0);
            return;
          }
          set((state) => ({ queue: [...state.queue, ...list].slice(0, QUEUE_LIMIT) }));
        },
        removeFromQueue: (qid) => {
          const { queue, index } = get();
          const at = queue.findIndex((item) => item.qid === qid);
          if (at < 0 || at === index) return;
          const next = queue.filter((item) => item.qid !== qid);
          const nextIndex = at < index ? index - 1 : index;
          set({ queue: next, index: nextIndex, currentTrack: next[nextIndex] || null });
        },
        moveInQueue: (from, to) => {
          const { queue, index } = get();
          if (from === to || !queue[from] || to < 0 || to >= queue.length) return;
          const next = [...queue];
          const [item] = next.splice(from, 1);
          next.splice(to, 0, item);
          const current = queue[index];
          set({ queue: next, index: next.indexOf(current) });
        },
        jumpTo: (index) => goTo(index),
        clearUpNext: () => {
          const { queue, index } = get();
          set({ queue: queue.slice(0, index + 1) });
        },

        // ---- Transport -------------------------------------------------------
        togglePlay: () => {
          if (!get().currentTrack) return;
          set((state) => ({ isPlaying: !state.isPlaying }));
        },
        play: () => get().currentTrack && set({ isPlaying: true }),
        pause: () => set({ isPlaying: false }),
        setStatus: (status) => set({ status }),

        // auto=true means the song ended on its own (vs the listener pressing
        // next). Repeat-one only loops on a natural end.
        next: async (auto = false) => {
          const { queue, index, repeat, autoplay } = get();
          if (!queue.length) return;
          if (auto && repeat === "one") {
            set({ pendingSeek: 0, isPlaying: true });
            return;
          }
          if (index < queue.length - 1) {
            goTo(index + 1);
            return;
          }
          if (repeat === "all") {
            goTo(0);
            return;
          }
          if (autoplay) {
            const mine = generation;
            const qid = get().currentTrack?.qid;
            await get().ensureUpcoming(true);
            // Something else started while the radio loaded: that wins.
            if (generation !== mine || get().currentTrack?.qid !== qid) return;
            if (get().index < get().queue.length - 1) {
              goTo(get().index + 1);
              return;
            }
          }
          if (auto) set({ isPlaying: false, status: "paused" });
        },
        previous: () => {
          const { index } = get();
          // YT Music/Spotify: a few seconds in, "previous" restarts the song.
          if (usePlaybackClock.getState().currentTime > 3 || index <= 0) {
            get().seekTo(0);
            set({ isPlaying: true });
            return;
          }
          goTo(index - 1);
        },

        // Top the queue up with radio when the listener is near its end.
        ensureUpcoming: async (force = false) => {
          const { autoplay, queue, index, currentTrack } = get();
          if (!autoplay || !currentTrack) return;
          // One top-up per queue at a time; later callers wait on the same one.
          if (topUp?.generation === generation) return topUp.promise;
          if (!force && queue.length - 1 - index > AUTOPLAY_THRESHOLD) return;
          const mine = generation;
          set({ autoplayLoading: true });
          const promise = (async () => {
            try {
              const exclude = new Set([
                ...queue.map((item) => item.id),
                ...useLibraryStore.getState().disliked
              ]);
              const radio = await buildRadio(currentTrack, { exclude, limit: 15 });
              // A new queue started while this loaded: it isn't ours to extend.
              if (generation !== mine || !radio.length) return;
              const queued = new Set(get().queue.map((item) => item.id));
              const fresh = radio.filter((track) => !queued.has(track.id));
              set((state) => ({
                queue: [...state.queue, ...fresh.map((track) => ({ ...withQid(track), autoplay: true }))]
                  .slice(-QUEUE_LIMIT)
              }));
              // Trimming from the front (very long sessions) shifts the cursor.
              const current = get().currentTrack;
              const at = get().queue.findIndex((item) => item.qid === current?.qid);
              if (at >= 0 && at !== get().index) set({ index: at });
            } catch {
              /* offline or catalog down — the queue simply ends */
            } finally {
              if (topUp?.promise === promise) topUp = null;
              if (generation === mine) set({ autoplayLoading: false });
            }
          })();
          topUp = { generation: mine, promise };
          return promise;
        },

        // ---- Position, volume, modes --------------------------------------------
        seekTo: (time) => {
          const target = Math.max(0, time);
          usePlaybackClock.setState({ currentTime: target });
          set({ pendingSeek: target });
        },
        seekBy: (delta) => {
          const { currentTime, duration } = usePlaybackClock.getState();
          get().seekTo(Math.min(Math.max(0, currentTime + delta), duration || Infinity));
        },
        clearPendingSeek: () => set({ pendingSeek: null }),
        setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)), muted: false }),
        toggleMute: () => set((state) => ({ muted: !state.muted })),
        cycleRepeat: () =>
          set((state) => ({ repeat: state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off" })),
        toggleAutoplay: () => {
          set((state) => ({ autoplay: !state.autoplay }));
          if (get().autoplay) get().ensureUpcoming();
        },
        // Shuffling reorders only what's still to come; un-shuffling restores the
        // original order around the song that's playing.
        toggleShuffle: () => {
          const { shuffle, queue, index, unshuffledOrder } = get();
          if (!shuffle) {
            const head = queue.slice(0, index + 1);
            const tail = shuffleArray(queue.slice(index + 1));
            set({ shuffle: true, unshuffledOrder: queue.map((item) => item.qid), queue: [...head, ...tail] });
            return;
          }
          if (!unshuffledOrder) {
            set({ shuffle: false });
            return;
          }
          const position = new Map(unshuffledOrder.map((qid, i) => [qid, i]));
          const restored = [...queue].sort(
            (a, b) => (position.get(a.qid) ?? Infinity) - (position.get(b.qid) ?? Infinity)
          );
          const current = queue[index];
          set({ shuffle: false, unshuffledOrder: null, queue: restored, index: restored.indexOf(current) });
        }
      };
    },
    {
      name: "joshfy-player-v2",
      version: 1,
      // The queue survives a reload (paused at its song, like YT Music); live
      // playback state never does.
      partialize: (state) => ({
        queue: state.queue,
        index: state.index,
        currentTrack: state.currentTrack,
        volume: state.volume,
        muted: state.muted,
        repeat: state.repeat,
        shuffle: state.shuffle,
        unshuffledOrder: state.unshuffledOrder,
        autoplay: state.autoplay,
        playingFrom: state.playingFrom
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.currentTrack) {
          usePlaybackClock.setState({ duration: state.currentTrack.duration || 0 });
          usePlayerStore.setState({ status: "paused" });
        }
      }
    }
  )
);
