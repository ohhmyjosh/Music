import { QueryClient } from "@tanstack/react-query";
import { getAlbum, getPlaylist } from "../api/saavn";
import { getArtistCached } from "../api/radio";
import { usePlayerStore } from "../store/playerStore";
import { useUiStore } from "../store/uiStore";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // catalog data barely changes within a session
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export const albumQuery = (id) => ({ queryKey: ["album", id], queryFn: () => getAlbum(id) });
export const playlistQuery = (id) => ({ queryKey: ["playlist", id], queryFn: () => getPlaylist(id, 150) });
export const artistQuery = (id) => ({ queryKey: ["artist", id], queryFn: () => getArtistCached(id) });

// The songs behind any catalog card, fetched through the shared cache.
export async function loadCollectionTracks(item) {
  if (item.kind === "album") return (await queryClient.fetchQuery(albumQuery(item.id))).songs;
  if (item.kind === "playlist") return (await queryClient.fetchQuery(playlistQuery(item.id))).songs;
  if (item.kind === "artist") return (await queryClient.fetchQuery(artistQuery(item.id))).topSongs;
  return item.tracks || [];
}

export function collectionPath(item) {
  if (item.kind === "album") return `/album/${item.id}`;
  if (item.kind === "playlist") return `/playlist/${item.id}`;
  if (item.kind === "artist") return `/artist/${item.id}`;
  if (item.kind === "local-playlist") return `/library/playlist/${item.id}`;
  return null;
}

// Play (or shuffle) a card's songs without opening its page.
export async function playCollection(item, { shuffle = false } = {}) {
  try {
    const tracks = await loadCollectionTracks(item);
    if (!tracks.length) {
      useUiStore.getState().toast("Nothing playable here yet");
      return;
    }
    const from = { label: item.title, path: collectionPath(item) };
    const player = usePlayerStore.getState();
    if (shuffle) player.shufflePlay(tracks, from);
    else player.playTracks(tracks, 0, from);
  } catch {
    useUiStore.getState().toast("Couldn't load that — check your connection");
  }
}
