import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Album,
  Check,
  Download,
  ListEnd,
  ListMinus,
  ListPlus,
  ListStart,
  Radio,
  Share2,
  Shuffle,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  UserRound,
  UserRoundCheck,
  UserRoundPlus,
  Library,
  Play
} from "lucide-react";
import Artwork from "../media/Artwork";
import { useUiStore } from "../../store/uiStore";
import { usePlayerStore } from "../../store/playerStore";
import { useLibraryStore } from "../../store/libraryStore";
import { useDownloadsStore } from "../../store/downloadsStore";
import { collectionPath, loadCollectionTracks, playCollection } from "../../lib/queries";

function isTrack(item) {
  return Boolean(item?.source);
}

async function copyLink(path, toast) {
  const url = `${window.location.origin}${path}`;
  try {
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast("Link copied");
  } catch {
    /* share sheet dismissed */
  }
}

// Builds the entries for whatever the menu was opened on.
function useEntries(item, context, close) {
  const navigate = useNavigate();
  const toast = useUiStore((state) => state.toast);
  const openSaveDialog = useUiStore((state) => state.openSaveDialog);
  const player = usePlayerStore.getState();
  const library = useLibraryStore();
  const downloads = useDownloadsStore();

  if (!item) return [];

  const withTracks = (fn) => async () => {
    close();
    try {
      const tracks = await loadCollectionTracks(item);
      if (tracks.length) fn(tracks);
    } catch {
      toast("Couldn't load that — check your connection");
    }
  };

  if (isTrack(item)) {
    const liked = library.liked.some((track) => track.id === item.id);
    const disliked = library.disliked.includes(item.id);
    const downloaded = downloads.items.some((entry) => entry.track.id === item.id);
    const progress = downloads.pending[item.id];
    const pending = progress !== undefined;
    const streamable = item.source !== "local";
    return [
      streamable && {
        icon: Radio,
        label: "Start radio",
        run: () => player.startRadio(item)
      },
      { icon: ListStart, label: "Play next", run: () => (player.playNext(item), toast("Song will play next")) },
      { icon: ListEnd, label: "Add to queue", run: () => (player.addToQueue(item), toast("Song added to queue")) },
      context?.qid && {
        icon: ListMinus,
        label: "Remove from queue",
        run: () => player.removeFromQueue(context.qid)
      },
      { divider: true },
      { icon: ListPlus, label: "Save to playlist", run: () => openSaveDialog([item]), keepOpen: true },
      context?.playlistId && {
        icon: Trash2,
        label: "Remove from playlist",
        run: () => {
          library.removeFromPlaylist(context.playlistId, item.id);
          toast("Removed from playlist");
        }
      },
      {
        icon: ThumbsUp,
        label: liked ? "Remove from liked songs" : "Like",
        active: liked,
        run: () => toast(library.toggleLike(item) ? "Added to Liked Music" : "Removed from Liked Music")
      },
      {
        icon: ThumbsDown,
        label: disliked ? "Undo dislike" : "Dislike",
        active: disliked,
        run: () => {
          const nowDisliked = library.toggleDislike(item);
          if (nowDisliked && usePlayerStore.getState().currentTrack?.id === item.id) player.next();
          toast(nowDisliked ? "We won't suggest this song" : "Dislike removed");
        }
      },
      streamable && {
        icon: downloaded ? Check : Download,
        label: downloaded ? "Remove download" : pending ? `Downloading… ${Math.round(progress * 100)}%` : "Download",
        disabled: pending,
        run: () => {
          if (downloaded) {
            downloads.remove(item.id);
            toast("Download removed");
          } else {
            toast("Downloading…");
            downloads
              .download(item)
              .then(() => toast(`"${item.title}" is available offline`))
              .catch(() => toast(`Couldn't download "${item.title}"`));
          }
        }
      },
      // Imported files live only on this device; this is how they're deleted.
      !streamable &&
        downloaded && {
          icon: Trash2,
          label: "Remove from this device",
          run: () => {
            downloads.remove(item.id);
            toast("Removed from this device");
          }
        },
      { divider: true },
      item.albumId && { icon: Album, label: "Go to album", run: () => navigate(`/album/${item.albumId}`) },
      ...(item.artists || []).slice(0, 2).map((artist) => ({
        icon: UserRound,
        label: item.artists.length > 1 ? `Go to ${artist.name}` : "Go to artist",
        run: () => navigate(`/artist/${artist.id}`)
      })),
      item.source === "saavn" && {
        icon: Share2,
        label: "Share",
        run: () => copyLink(`/watch?v=${item.sourceId}`, toast)
      }
    ];
  }

  if (item.kind === "local-playlist") {
    return [
      { icon: Play, label: "Play", run: () => playCollection(item) },
      { icon: Shuffle, label: "Shuffle play", run: () => playCollection(item, { shuffle: true }) },
      { icon: ListStart, label: "Play next", run: () => item.tracks.length && player.playNext(item.tracks) },
      { icon: ListEnd, label: "Add to queue", run: () => item.tracks.length && player.addToQueue(item.tracks) },
      { divider: true },
      {
        icon: Trash2,
        label: "Delete playlist",
        run: () => {
          library.deletePlaylist(item.id);
          toast(`Deleted "${item.title}"`);
          if (window.location.pathname === collectionPath(item)) navigate("/library");
        }
      }
    ];
  }

  if (item.kind === "mix") {
    return [{ icon: Radio, label: "Start radio", run: () => player.startRadio(item.seed, item.title) }];
  }

  const saved = library.isSaved(item.kind, item.id);
  const entries = [
    { icon: Shuffle, label: "Shuffle play", run: () => playCollection(item, { shuffle: true }) },
    item.kind === "artist" && {
      icon: Radio,
      label: "Start radio",
      run: withTracks((tracks) => player.startRadio(tracks[0], `${item.title} radio`))
    },
    { icon: ListStart, label: "Play next", run: withTracks((tracks) => player.playNext(tracks)), keepOpen: true },
    { icon: ListEnd, label: "Add to queue", run: withTracks((tracks) => player.addToQueue(tracks)), keepOpen: true },
    item.kind !== "artist" && {
      icon: ListPlus,
      label: "Save to playlist",
      run: withTracks((tracks) => openSaveDialog(tracks)),
      keepOpen: true
    },
    { divider: true },
    item.kind === "artist"
      ? {
          icon: saved ? UserRoundCheck : UserRoundPlus,
          label: saved ? "Unsubscribe" : "Subscribe",
          run: () => toast(library.toggleSaved(item) ? `Subscribed to ${item.title}` : "Unsubscribed")
        }
      : {
          icon: Library,
          label: saved ? "Remove from library" : "Save to library",
          run: () => toast(library.toggleSaved(item) ? "Saved to library" : "Removed from library")
        },
    item.kind === "album" &&
      item.artists?.[0] && {
        icon: UserRound,
        label: "Go to artist",
        run: () => navigate(`/artist/${item.artists[0].id}`)
      },
    { icon: Share2, label: "Share", run: () => copyLink(collectionPath(item), toast) }
  ];
  return entries;
}

// Drop dividers that would sit at an edge or next to another divider once
// conditional entries have been filtered out.
function tidy(entries) {
  const out = [];
  for (const entry of entries.filter(Boolean)) {
    if (entry.divider && (!out.length || out[out.length - 1].divider)) continue;
    out.push(entry);
  }
  while (out.length && out[out.length - 1].divider) out.pop();
  return out;
}

export default function ItemMenu() {
  const menu = useUiStore((state) => state.menu);
  return menu ? <MenuPopup menu={menu} /> : null;
}

function MenuPopup({ menu }) {
  const closeMenu = useUiStore((state) => state.closeMenu);
  const ref = useRef(null);
  const [position, setPosition] = useState(null);
  const entries = tidy(useEntries(menu.item, menu.context, closeMenu));
  const sheet = window.innerWidth < 640;

  // Keep the popup inside the viewport: flip left/up when it would overflow.
  useLayoutEffect(() => {
    if (sheet || !ref.current) {
      setPosition(null);
      return;
    }
    const { width, height } = ref.current.getBoundingClientRect();
    const margin = 8;
    let left = menu.x - width;
    if (left < margin) left = Math.min(menu.x, window.innerWidth - width - margin);
    let top = menu.y;
    if (top + height > window.innerHeight - margin) top = Math.max(margin, menu.y - height);
    setPosition({ left, top });
  }, [menu, sheet]);

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && closeMenu();
    const onScroll = () => !sheet && closeMenu();
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", closeMenu);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", closeMenu);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [closeMenu, sheet]);

  const { item } = menu;
  const subtitle = isTrack(item) ? item.artist : item.subtitle;

  return (
    <div
      className="fixed inset-0 z-[70]"
      onClick={closeMenu}
      onContextMenu={(event) => {
        event.preventDefault();
        closeMenu();
      }}
    >
      {sheet ? <div className="absolute inset-0 animate-fade-in bg-black/60" /> : null}
      <div
        ref={ref}
        role="menu"
        onClick={(event) => event.stopPropagation()}
        style={sheet ? undefined : position || { left: -9999, top: 0 }}
        className={
          sheet
            ? "absolute inset-x-0 bottom-0 max-h-[80vh] animate-slide-up overflow-y-auto rounded-t-2xl bg-yt-menu pb-[env(safe-area-inset-bottom)]"
            : "absolute max-h-[70vh] w-72 animate-pop-in overflow-y-auto rounded-lg bg-yt-menu py-2 shadow-2xl ring-1 ring-white/10"
        }
      >
        {sheet ? (
          <div className="flex items-center gap-3 border-b border-white/10 p-4">
            <Artwork
              src={item.artworkSmall || item.artwork}
              className={item.kind === "artist" ? "h-12 w-12 rounded-full" : "h-12 w-12 rounded"}
            />
            <div className="min-w-0">
              <p className="truncate font-medium">{item.title}</p>
              <p className="truncate text-sm text-yt-muted">{subtitle}</p>
            </div>
          </div>
        ) : null}
        {entries.map((entry, index) =>
          entry.divider ? (
            <div key={`d${index}`} className="my-1 h-px bg-white/10" />
          ) : (
            <button
              key={entry.label}
              role="menuitem"
              disabled={entry.disabled}
              className="flex w-full items-center gap-4 px-4 py-2.5 text-left text-[15px] hover:bg-white/10 disabled:opacity-40 sm:py-2 sm:text-sm"
              onClick={() => {
                if (!entry.keepOpen) closeMenu();
                entry.run();
              }}
            >
              <entry.icon size={20} className="shrink-0" fill={entry.active ? "currentColor" : "none"} />
              {entry.label}
            </button>
          )
        )}
      </div>
    </div>
  );
}
