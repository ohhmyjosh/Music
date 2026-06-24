import { Download, Heart, Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { usePlayerStore } from "../../store/playerStore";
import { useLibraryStore } from "../../store/libraryStore";
import clsx from "clsx";

function formatTime(seconds) {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function FullPlayerCard() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    likedTrackIds,
    toggleLike,
    togglePlay,
    nextTrack,
    previousTrack,
    setVolume
  } = usePlayerStore();
  const saveTrackOffline = useLibraryStore((state) => state.saveTrackOffline);

  if (!currentTrack) return null;

  const canSaveOffline = Boolean(currentTrack.downloadUrl || currentTrack.localOnly);
  const liked = likedTrackIds.includes(currentTrack.id);

  return (
    <section className="glass-panel grid gap-8 rounded-[32px] p-6 shadow-glow lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
      <div>
        <img
          src={currentTrack.artwork}
          alt={currentTrack.title}
          className="aspect-square w-full rounded-[28px] object-cover"
        />
      </div>

      <div className="flex flex-col justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-accent-300">{currentTrack.genre}</p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-white">{currentTrack.title}</h1>
          <p className="mt-2 text-lg text-slate-300">{currentTrack.artist}</p>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
            {currentTrack.description ||
              "Josh-Fy's player view is built to feel premium now, while staying easy to evolve into richer metadata, queue controls, and offline features later."}
          </p>
        </div>

        <div className="space-y-5">
          <div className="h-1.5 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-accent-400"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || currentTrack.duration)}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-full p-3 text-slate-400 hover:bg-white/5 hover:text-white" onClick={previousTrack}>
              <SkipBack />
            </button>
            <button
              className="rounded-full bg-white p-4 text-slate-950 transition hover:bg-accent-300"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause /> : <Play />}
            </button>
            <button className="rounded-full p-3 text-slate-400 hover:bg-white/5 hover:text-white" onClick={nextTrack}>
              <SkipForward />
            </button>
            <button
              className={clsx(
                "rounded-full p-3 transition hover:bg-white/5",
                liked ? "text-rose-400" : "text-slate-400 hover:text-white"
              )}
              onClick={() => toggleLike(currentTrack.id)}
            >
              <Heart fill={liked ? "currentColor" : "none"} />
            </button>
            <button
              className="rounded-full p-3 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => saveTrackOffline(currentTrack)}
              disabled={!canSaveOffline}
              title={
                canSaveOffline
                  ? "Save for offline"
                  : "Offline save is only available for allowed downloads or imported files"
              }
            >
              <Download />
            </button>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <Volume2 className="text-slate-400" size={18} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="h-1 flex-1 accent-accent-400"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
