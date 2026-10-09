import { create } from "zustand";
import { persist } from "zustand/middleware";

// Device preferences that aren't part of the library.
//
// The visualizer routes audio through Web Audio. That's solid on desktop, but
// phones (iOS especially) suspend the audio graph in the background, so it
// starts off there and on everywhere else. Either way the music never needs it.
const touchDevice =
  typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches && !window.matchMedia?.("(pointer: fine)").matches;

export const useSettingsStore = create(
  persist(
    (set) => ({
      visualizer: !touchDevice,
      setVisualizer: (visualizer) => set({ visualizer: Boolean(visualizer) }),
      toggleVisualizer: () => set((state) => ({ visualizer: !state.visualizer }))
    }),
    { name: "joshfy-settings", version: 1 }
  )
);
