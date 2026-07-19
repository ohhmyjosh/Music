import { useState } from "react";
import { Download, Heart, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useLibraryStore } from "../../store/libraryStore";
import { usePlayerStore } from "../../store/playerStore";
import Artwork from "../media/Artwork";
import WaveformVisualizer from "./WaveformVisualizer";
import clsx from "clsx";

function formatTime(seconds) {
  if (!seconds || !Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

const TABS = ["Up next", "Lyrics", "Related"];

// Compact queue row for the side panel (YT Music style: art, text, duration).
function QueueRow({ track, active, onPlay }) {
  return (
    <button
      className={clsx(
        "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition",
        active ? "bg-white/10" : "hover:bg-white/5"
      )}
      onClick={onPlay}
    >
      <Artwork src={track.artwork} alt={track.title} className="h-11 w-11 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className={clsx("truncate text-sm font-medium", active ? "text-white" : "text-slate-200")}>
          {track.title}
        </p>
        <p className="truncate text-xs text-slate-400">{track.artist}</p>
      </div>
      {active ? (
        <span className="text-[10px] font-semibold uppercase tracking-widest text-accent-300">Playing</span>
      ) : (
        <span className="text-xs tabular-nums text-slate-500">{formatTime(track.duration)}</span>
      )}
    </button>
  );
}

export default function FullPlayer({ lyrics, recommendations = [] }) {
  const [tab, setTab] = useState("Up next");
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    queue,
    shuffle,
    repeat,
    likedTrackIds,
    toggleLike,
    togglePlay,
    nextTrack,
    previousTrack,
    setVolume,
    toggleMute,
    seekTo,
    toggleShuffle,
    cycleRepeat,
    setTrack
  } = usePlayerStore();
  const saveTrackOffline = useLibraryStore((state) => state.saveTrackOffline);

  if (!currentTrack) {
    return (
      <section className="rounded-[30px] border border-white/10 bg-slate-950/90 p-10 text-center">
        <p className="font-display text-lg font-semibold text-white">Nothing playing yet</p>
        <p className="mt-2 text-sm text-slate-400">
          Pick a song from the home feed or search to start listening.
        </p>
      </section>
    );
  }

  const liked = likedTrackIds.includes(currentTrack.id);
  const canSaveOffline = Boolean(currentTrack.downloadUrl || currentTrack.localOnly);
  const total = duration || currentTrack.duration || 0;

  return (
    <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
      {/* ---- Left: the song ------------------------------------------------- */}
      <div className="mx-auto w-full max-w-xl space-y-6">
        <Artwork
          src={currentTrack.artwork}
          alt={currentTrack.title}
          className="mx-auto aspect-square w-full rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
        />

        {/* Big reactive audio visualizer — the in-app centerpiece. Same shared
            analyser as the mini-player, with the simulated wave as fallback. */}
        <div className="relative h-32 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/50 to-slate-950/80 ring-1 ring-white/10 sm:h-40">
          <WaveformVisualizer variant="inline" />
        </div>

        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">{currentTrack.title}</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            {currentTrack.artist}
            {currentTrack.album && currentTrack.album !== "Single" ? ` • ${currentTrack.album}` : ""}
          </p>
        </div>

        <div>
          <input
            type="range"
            min="0"
            max={total || 1}
            step="0.5"
            value={Math.min(currentTime, total || 0)}
            onChange={(event) => seekTo(Number(event.target.value))}
            className="h-1 w-full cursor-pointer accent-accent-400"
            aria-label="Seek"
          />
          <div className="mt-1 flex items-center justify-between text-xs tabular-nums text-slate-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(total)}</span>
          </div>
        </div>

        {/* Main transport, YT Music order: shuffle · prev · play · next · repeat */}
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          <button
            className={clsx(
              "rounded-full p-3 transition hover:bg-white/5",
              shuffle ? "text-accent-300" : "text-slate-400 hover:text-white"
            )}
            aria-label="Toggle shuffle"
            onClick={toggleShuffle}
          >
            <Shuffle size={20} />
          </button>
          <button className="rounded-full p-3 text-slate-200 transition hover:bg-white/5 hover:text-white" aria-label="Previous" onClick={previousTrack}>
            <SkipBack size={26} />
          </button>
          <button
            className="rounded-full bg-white p-5 text-slate-950 transition hover:scale-105"
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={togglePlay}
          >
            {isPlaying ? <Pause size={26} /> : <Play size={26} />}
          </button>
          <button className="rounded-full p-3 text-slate-200 transition hover:bg-white/5 hover:text-white" aria-label="Next" onClick={() => nextTrack()}>
            <SkipForward size={26} />
          </button>
          <button
            className={clsx(
              "rounded-full p-3 transition hover:bg-white/5",
              repeat !== "off" ? "text-accent-300" : "text-slate-400 hover:text-white"
            )}
            aria-label={`Repeat: ${repeat}`}
            onClick={cycleRepeat}
          >
            {repeat === "one" ? <Repeat1 size={20} /> : <Repeat size={20} />}
          </button>
        </div>

        {/* Secondary row: like · download · volume */}
        <div className="flex items-center justify-center gap-3">
          <button
            className={clsx(
              "rounded-full p-2.5 transition hover:bg-white/5",
              liked ? "text-rose-400" : "text-slate-400 hover:text-white"
            )}
            aria-label={liked ? "Unlike" : "Like"}
            onClick={() => toggleLike(currentTrack)}
          >
            <Heart size={19} fill={liked ? "currentColor" : "none"} />
          </button>
          <button
            className="rounded-full p-2.5 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-30"
            aria-label="Save offline"
            onClick={() => saveTrackOffline(currentTrack)}
            disabled={!canSaveOffline}
          >
            <Download size={19} />
          </button>
          <div className="flex items-center gap-2.5 rounded-full bg-white/5 px-3.5 py-2">
            <button className="text-slate-400 transition hover:text-white" aria-label={muted ? "Unmute" : "Mute"} onClick={toggleMute}>
              {muted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={muted ? 0 : volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="h-1 w-28 cursor-pointer accent-accent-400 sm:w-36"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>

      {/* ---- Right: Up next / Lyrics / Related tabs -------------------------- */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex border-b border-white/10">
          {TABS.map((name) => (
            <button
              key={name}
              className={clsx(
                "flex-1 px-2 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.18em] transition",
                tab === name
                  ? "border-b-2 border-white text-white"
                  : "text-slate-500 hover:text-slate-300"
              )}
              onClick={() => setTab(name)}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="feed-scroll max-h-[62vh] space-y-1 overflow-y-auto p-2.5 xl:max-h-[70vh]">
          {tab === "Up next" ? (
            queue.length ? (
              queue.map((track) => (
                <QueueRow
                  key={track.id}
                  track={track}
                  active={track.id === currentTrack.id}
                  onPlay={() => setTrack(track, queue)}
                />
              ))
            ) : (
              <p className="p-4 text-sm text-slate-500">The queue is empty.</p>
            )
          ) : null}

          {tab === "Lyrics" ? (
            <p className="whitespace-pre-line p-4 text-sm leading-7 text-slate-300">
              {lyrics?.text || "No lyrics found for this track."}
            </p>
          ) : null}

          {tab === "Related" ? (
            recommendations.length ? (
              recommendations.map((track) => (
                <QueueRow
                  key={track.id}
                  track={track}
                  active={false}
                  onPlay={() => setTrack(track, recommendations)}
                />
              ))
            ) : (
              <p className="p-4 text-sm text-slate-500">Related tracks will appear here.</p>
            )
          ) : null}
        </div>
      </div>
    </section>
  );
}
