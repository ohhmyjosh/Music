import { memo } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { Download, Pause, Play, ThumbsUp } from "lucide-react";
import Artwork from "../media/Artwork";
import ArtistLinks from "./ArtistLinks";
import MenuButton, { openItemMenu } from "./MenuButton";
import PlayingBars from "./PlayingBars";
import { usePlayerStore } from "../../store/playerStore";
import { useIsLiked, useLibraryStore } from "../../store/libraryStore";
import { useDownloadsStore } from "../../store/downloadsStore";
import { formatTime } from "../../utils/track";

// One song in a list. Clicking it plays the whole list from this song (the
// list becomes the queue), exactly like YouTube Music.
//   index    -> show a track number instead of artwork (album pages)
//   onPlay   -> custom play handler; defaults to playing `tracks` from here
function SongRow({ track, tracks, position, from, index, showAlbum = true, context, onPlay }) {
  const isCurrent = usePlayerStore((state) => state.currentTrack?.id === track.id);
  const isPlaying = usePlayerStore((state) => state.isPlaying && state.currentTrack?.id === track.id);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const liked = useIsLiked(track.id);
  const toggleLike = useLibraryStore((state) => state.toggleLike);
  const downloaded = useDownloadsStore((state) => state.items.some((item) => item.track.id === track.id));
  const playable = Boolean(track.audioUrl || track.source === "local");

  const play = () => {
    if (!playable) return;
    if (isCurrent) {
      togglePlay();
      return;
    }
    if (onPlay) onPlay();
    else usePlayerStore.getState().playTracks(tracks || [track], position ?? 0, from || null);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={play}
      onKeyDown={(event) => {
        if (event.key === "Enter") play();
      }}
      onContextMenu={(event) => openItemMenu(event, track, context)}
      className={clsx(
        "group flex h-14 items-center gap-3 rounded-md px-2 outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/10 sm:gap-4",
        isCurrent && "bg-white/[0.07]",
        !playable && "opacity-40"
      )}
    >
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
        {index !== undefined ? (
          <span className={clsx("text-sm text-yt-muted", "group-hover:invisible", isCurrent && "invisible")}>
            {index}
          </span>
        ) : (
          <Artwork
            src={track.artworkSmall || track.artwork}
            artist={track.artist}
            title={track.title}
            className="h-10 w-10 rounded"
          />
        )}
        <span
          className={clsx(
            "absolute inset-0 flex items-center justify-center rounded",
            index === undefined && "bg-black/50",
            isCurrent ? "flex" : "hidden group-hover:flex"
          )}
        >
          {isCurrent && isPlaying ? (
            <>
              <PlayingBars className="group-hover:hidden" />
              <Pause size={18} fill="currentColor" className="hidden group-hover:block" />
            </>
          ) : (
            <Play size={18} fill="currentColor" />
          )}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className={clsx("flex items-center gap-1.5 truncate text-[15px]", isCurrent && "font-medium")}>
          <span className="truncate">{track.title}</span>
          {track.explicit ? (
            <span className="shrink-0 rounded-sm bg-white/30 px-1 text-[10px] font-bold leading-4 text-black">E</span>
          ) : null}
        </p>
        <p className="flex items-center gap-1 truncate text-sm text-yt-muted">
          {downloaded ? <Download size={12} className="shrink-0 text-accent-300" /> : null}
          <ArtistLinks track={track} className="truncate" />
          {showAlbum && track.album ? (
            <span className="truncate md:hidden"> • {track.album}</span>
          ) : null}
        </p>
      </div>

      {showAlbum ? (
        <div className="hidden min-w-0 flex-1 truncate text-sm text-yt-muted md:block">
          {track.albumId ? (
            <Link
              to={`/album/${track.albumId}`}
              className="hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {track.album}
            </Link>
          ) : (
            track.album
          )}
        </div>
      ) : null}

      <button
        className={clsx(
          "icon-btn hidden sm:inline-flex",
          liked ? "text-white" : "invisible group-hover:visible"
        )}
        aria-label={liked ? "Remove like" : "Like"}
        onClick={(event) => {
          event.stopPropagation();
          toggleLike(track);
        }}
      >
        <ThumbsUp size={18} fill={liked ? "currentColor" : "none"} />
      </button>
      <span className="w-12 shrink-0 text-right text-sm tabular-nums text-yt-muted">
        {track.duration ? formatTime(track.duration) : ""}
      </span>
      <MenuButton item={track} context={context} className="-mr-1" />
    </div>
  );
}

export default memo(SongRow);
