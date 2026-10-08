import { create } from "zustand";

// Transient UI state shared across distant components: the Now Playing panel,
// the "⋮" menu, the save-to-playlist dialog and toasts.
let toastId = 0;

export const useUiStore = create((set, get) => ({
  nowPlayingOpen: false,
  nowPlayingTab: "upnext", // upnext | lyrics | related
  sidebarCollapsed: false,

  // { item (song or catalog card), x, y, context: { playlistId?, qid?, from? } }
  menu: null,
  // tracks waiting to be saved into a playlist
  saveTarget: null,
  createPlaylist: null, // { tracks } when the "New playlist" dialog is open
  toasts: [],

  openNowPlaying: (tab) => set({ nowPlayingOpen: true, ...(tab ? { nowPlayingTab: tab } : {}) }),
  closeNowPlaying: () => set({ nowPlayingOpen: false }),
  toggleNowPlaying: () => set((state) => ({ nowPlayingOpen: !state.nowPlayingOpen })),
  setNowPlayingTab: (nowPlayingTab) => set({ nowPlayingTab }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  openMenu: (menu) => set({ menu }),
  closeMenu: () => set({ menu: null }),

  openSaveDialog: (tracks) => set({ saveTarget: tracks, menu: null }),
  closeSaveDialog: () => set({ saveTarget: null }),
  openCreatePlaylist: (tracks = []) => set({ createPlaylist: { tracks }, saveTarget: null, menu: null }),
  closeCreatePlaylist: () => set({ createPlaylist: null }),

  toast: (message, action = null) => {
    toastId += 1;
    const id = toastId;
    set((state) => ({ toasts: [...state.toasts.slice(-2), { id, message, action }] }));
    setTimeout(() => get().dismissToast(id), 3500);
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
}));
