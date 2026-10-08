import { useState } from "react";
import clsx from "clsx";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  ThumbsDown,
  ThumbsUp,
  Volume1,
  Volume2,
  VolumeX
} from "lucide-react";
import Artwork from "../media/Artwork";
import ArtistLinks from "../music/ArtistLinks";
import MenuButton from "../music/MenuButton";
import ProgressBar from "./ProgressBar";
import { usePlaybackClock, usePlayerStore } from "../../store/playerStore";
import { useIsDisliked, useIsLiked, useLibraryStore } from "../../store/libraryStore";
import { useUiStore } from "../../store/uiStore";
import { unlockAudio } from "../../audio/analyser";
import { formatTime } from "../../utils/track";

export function PlayPauseIcon({ size = 24 }) {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const buffering = usePlayerStore((state) => state.isPlaying && state.status === "loading");
  if (buffering) return <Loader2 size={size} className="animate-spin" />;
  return isPlaying ? <Pause size={size} fill="currentColor" /> : <Play size={size} fill="currentColor" />;
}

function TimeReadout() {
  const currentTime = usePlaybackClock((state) => state.currentTime);
  const duration = usePlaybackClock((state) => state.duration);
  return (
    <span className="whitespace-nowrap text-xs tabular-nums text-yt-muted">
      {formatTime(currentTime)} / {formatTime(duration)}
    </span>
  );
}

export function LikeButtons({ track, size = 20, className }) {
  const liked = useIsLiked(track.id);
  const disliked = useIsDisliked(track.id);
  const toggleLike = useLibraryStore((state) => state.toggleLike);
  const toggleDislike = useLibraryStore((state) => state.toggleDislike);
  const toast = useUiStore((state) => state.toast);
  return (
    <div className={clsx("flex items-center", className)}>
      <button
        className="icon-btn"
        aria-label={disliked ? "Undo dislike" : "Dislike"}
        aria-pressed={disliked}
        onClick={(event) => {
          event.stopPropagation();
          if (toggleDislike(track)) {
            toast("We won't suggest this song");
            usePlayerStore.getState().next();
          }
        }}
      >
        <ThumbsDown size={size} fill={disliked ? "currentColor" : "none"} />
      </button>
      <button
        className="icon-btn"
        aria-label={liked ? "Remove like" : "Like"}
        aria-pressed={liked}
        onClick={(event) => {
          event.stopPropagation();
          toast(toggleLike(track) ? "Saved to Liked Music" : "Removed from Liked Music");
        }}
      >
        <ThumbsUp size={size} fill={liked ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

export function RepeatButton({ size = 22 }) {
  const repeat = usePlayerStore((state) => state.repeat);
  const cycleRepeat = usePlayerStore((state) => state.cycleRepeat);
  const Icon = repeat === "one" ? Repeat1 : Repeat;
  return (
    <button
      className={clsx("icon-btn", repeat === "off" && "text-white/50")}
      aria-label={`Repeat ${repeat === "off" ? "off" : repeat === "all" ? "all" : "one"}`}
      onClick={(event) => {
        event.stopPropagation();
        cycleRepeat();
      }}
    >
      <Icon size={size} />
    </button>
  );
}

export function ShuffleButton({ size = 22 }) {
  const shuffle = usePlayerStore((state) => state.shuffle);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  return (
    <button
      className={clsx("icon-btn", !shuffle && "text-white/50")}
      aria-label={shuffle ? "Shuffle on" : "Shuffle off"}
      aria-pressed={shuffle}
      onClick={(event) => {
        event.stopPropagation();
        toggleShuffle();
      }}
    >
      <Shuffle size={size} />
    </button>
  );
}

// Isolated so the clock ticking re-renders only this line, not the whole bar.
function MiniProgress() {
  const progress = usePlaybackClock((state) =>
    state.duration ? Math.min(100, (state.currentTime / state.duration) * 100) : 0
  );
  return (
    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/10">
      <div className="h-full bg-accent-500" style={{ width: `${progress}%` }} />
    </div>
  );
}

function VolumeControl() {
  const volume = usePlayerStore((state) => state.volume);
  const muted = usePlayerStore((state) => state.muted);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const toggleMute = usePlayerStore((state) => state.toggleMute);
  const [open, setOpen] = useState(false);
  const level = muted ? 0 : volume;
  const Icon = level === 0 ? VolumeX : level < 0.5 ? Volume1 : Volume2;

  return (
    <div
      className="flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(event) => event.stopPropagation()}
    >
      <div className={clsx("overflow-hidden transition-[width] duration-200", open ? "w-24" : "w-0")}>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={level}
          aria-label="Volume"
          onChange={(event) => setVolume(Number(event.target.value))}
          className="range mx-2 w-20"
          style={{ backgroundSize: `${level * 100}% 100%` }}
        />
      </div>
      <button className="icon-btn" aria-label={muted ? "Unmute" : "Mute"} onClick={toggleMute}>
        <Icon size={22} />
      </button>
    </div>
  );
}

export default function PlayerBar() {
  const track = usePlayerStore((state) => state.currentTrack);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const next = usePlayerStore((state) => state.next);
  const previous = usePlayerStore((state) => state.previous);
  const status = usePlayerStore((state) => state.status);
  const nowPlayingOpen = useUiStore((state) => state.nowPlayingOpen);
  const toggleNowPlaying = useUiStore((state) => state.toggleNowPlaying);
  const openNowPlaying = useUiStore((state) => state.openNowPlaying);

  if (!track) return null;

  const play = (event) => {
    event.stopPropagation();
    unlockAudio();
    togglePlay();
  };
  const meta = [track.album, track.year].filter(Boolean);

  return (
    <>
      {/* ---- Desktop bar ------------------------------------------------------- */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 hidden h-[var(--player-h)] cursor-pointer bg-yt-bar lg:block"
        onClick={toggleNowPlaying}
      >
        <ProgressBar className="absolute inset-x-0 -top-2" />
        <div className="grid h-full grid-cols-[minmax(240px,1fr)_minmax(0,2fr)_minmax(240px,1fr)] items-center px-2">
          <div className="flex items-center gap-1">
            <button
              className="icon-btn"
              aria-label="Previous"
              onClick={(event) => {
                event.stopPropagation();
                previous();
              }}
            >
              <SkipBack size={24} fill="currentColor" />
            </button>
            <button className="icon-btn h-12 w-12" aria-label="Play or pause" onClick={play}>
              <PlayPauseIcon size={30} />
            </button>
            <button
              className="icon-btn"
              aria-label="Next"
              onClick={(event) => {
                event.stopPropagation();
                next();
              }}
            >
              <SkipForward size={24} fill="currentColor" />
            </button>
            <span className="ml-3">
              <TimeReadout />
            </span>
          </div>

          <div className="flex min-w-0 items-center justify-center gap-4">
            <Artwork
              src={track.artworkSmall || track.artwork}
              artist={track.artist}
              title={track.title}
              className="h-10 w-10 rounded"
            />
            <div className="min-w-0 max-w-md">
              <p className="truncate text-[15px] font-medium">{track.title}</p>
              <p className="truncate text-sm text-yt-muted">
                {status === "error" ? (
                  "Couldn't play this song"
                ) : (
                  <>
                    <ArtistLinks track={track} />
                    {meta.length ? ` • ${meta.join(" • ")}` : ""}
                  </>
                )}
              </p>
            </div>
            <LikeButtons track={track} />
            <MenuButton item={track} />
          </div>

          <div className="flex items-center justify-end gap-1">
            <VolumeControl />
            <RepeatButton />
            <ShuffleButton />
            <button className="icon-btn" aria-label={nowPlayingOpen ? "Close player" : "Open player"}>
              {nowPlayingOpen ? <ChevronDown size={26} /> : <ChevronUp size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* ---- Mobile mini player --------------------------------------------------- */}
      <div
        className={clsx(
          "fixed inset-x-0 z-40 lg:hidden",
          "bottom-[calc(var(--mobile-nav-h)+env(safe-area-inset-bottom))]",
          nowPlayingOpen && "hidden"
        )}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => openNowPlaying()}
          onKeyDown={(event) => event.key === "Enter" && openNowPlaying()}
          className="relative flex h-[var(--mobile-mini-h)] items-center gap-3 border-t border-white/10 bg-yt-bar px-3"
        >
          <Artwork
            src={track.artworkSmall || track.artwork}
            artist={track.artist}
            title={track.title}
            className="h-11 w-11 rounded"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium">{track.title}</p>
            <p className="truncate text-sm text-yt-muted">{track.artist}</p>
          </div>
          <button className="icon-btn h-11 w-11" aria-label="Play or pause" onClick={play}>
            <PlayPauseIcon size={26} />
          </button>
          <button
            className="icon-btn h-11 w-11"
            aria-label="Next"
            onClick={(event) => {
              event.stopPropagation();
              next();
            }}
          >
            <SkipForward size={24} fill="currentColor" />
          </button>
          <MiniProgress />
        </div>
      </div>
    </>
  );
}
