import { Download, Heart, ListMusic, Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useLibraryStore } from "../../store/libraryStore";
import { usePlayerStore } from "../../store/playerStore";
import TrackRow from "../music/TrackRow";
import clsx from "clsx";

function formatTime(seconds) {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function FullPlayer({ lyrics, recommendations = [] }) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    queue,
    likedTrackIds,
    toggleLike,
    togglePlay,
    nextTrack,
    previousTrack,
    setVolume
  } = usePlayerStore();
  const saveTrackOffline = useLibraryStore((state) => state.saveTrackOffline);

  if (!currentTrack) return null;

  const liked = likedTrackIds.includes(currentTrack.id);
  const canSaveOffline = Boolean(currentTrack.downloadUrl || currentTrack.localOnly);

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/90 p-5 sm:p-6 xl:p-8">
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `url(${currentTrack.artwork})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          filter: "blur(50px)"
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/75 to-slate-950" />

      <div className="relative grid gap-6 xl:grid-cols-[1fr_0.9fr] xl:items-start">
        <div className="space-y-5">
          <img src={currentTrack.artwork} alt={currentTrack.title} className="mx-auto aspect-square w-full max-w-md rounded-[28px] object-cover soft-ring" />

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent-300">Now playing</p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">{currentTrack.title}</h1>
            <p className="mt-2 text-base text-slate-300">{currentTrack.artist}</p>
          </div>

          <div className="space-y-2">
            <div className="h-1.5 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-accent-400"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || currentTrack.duration)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-full p-3 text-slate-300 transition hover:bg-white/5 hover:text-white" onClick={previousTrack}>
              <SkipBack />
            </button>
            <button className="rounded-full bg-white p-4 text-slate-950 transition hover:bg-accent-300" onClick={togglePlay}>
              {isPlaying ? <Pause /> : <Play />}
            </button>
            <button className="rounded-full p-3 text-slate-300 transition hover:bg-white/5 hover:text-white" onClick={nextTrack}>
              <SkipForward />
            </button>
            <button
              className={clsx(
                "rounded-full p-3 transition hover:bg-white/5",
                liked ? "text-rose-400" : "text-slate-300 hover:text-white"
              )}
              onClick={() => toggleLike(currentTrack.id)}
            >
              <Heart fill={liked ? "currentColor" : "none"} />
            </button>
            <button
              className="rounded-full p-3 text-slate-300 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
              onClick={() => saveTrackOffline(currentTrack)}
              disabled={!canSaveOffline}
            >
              <Download />
            </button>
            <button className="rounded-full p-3 text-slate-300 transition hover:bg-white/5 hover:text-white" onClick={() => window.alert("Queue tools are coming soon.")}>
              <ListMusic />
            </button>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <Volume2 size={18} className="text-slate-400" />
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

        <div className="space-y-5">
          <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-white">Lyrics</h2>
              <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Live text</span>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-300">{lyrics?.text || "Lyrics will appear here."}</p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
            <h2 className="font-display text-lg font-semibold text-white">Find similar</h2>
            <div className="mt-4 space-y-3">
              {recommendations.slice(0, 3).map((track) => (
                <TrackRow key={track.id} track={track} queue={recommendations} showSource={false} />
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
            <h2 className="font-display text-lg font-semibold text-white">Queue</h2>
            <div className="mt-4 space-y-3">
              {queue.slice(0, 4).map((track) => (
                <TrackRow key={track.id} track={track} queue={queue} showSource={false} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
