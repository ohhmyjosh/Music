import { useEffect, useMemo, useRef } from "react";
import { Heart, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Link } from "react-router-dom";
import { usePlayerStore } from "../../store/playerStore";
import clsx from "clsx";

function formatTime(seconds) {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function MiniPlayer() {
  const audioRef = useRef(null);
  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    likedTrackIds,
    toggleLike,
    togglePlay,
    nextTrack,
    previousTrack,
    setCurrentTime,
    setDuration
  } = usePlayerStore();

  const liked = likedTrackIds.includes(currentTrack?.id);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.audioUrl) return;

    if (audio.src !== currentTrack.audioUrl) {
      audio.src = currentTrack.audioUrl;
      audio.load();
    }

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const progress = useMemo(() => {
    if (!duration) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  if (!currentTrack) return null;

  return (
    <>
      <audio
        ref={audioRef}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || currentTrack.duration || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={nextTrack}
      />

      <div className="fixed bottom-[72px] left-0 right-0 z-30 px-3 xl:bottom-0 xl:left-72 xl:px-6">
        <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/85 shadow-glow backdrop-blur-2xl">
          <div className="h-1 w-full bg-white/5">
            <div className="h-full bg-accent-400 transition-all" style={{ width: `${progress}%` }} />
          </div>

          <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center">
            <Link to="/player" className="flex min-w-0 flex-1 items-center gap-4">
              <img
                src={currentTrack.artwork}
                alt={currentTrack.title}
                className="h-14 w-14 rounded-2xl object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{currentTrack.title}</p>
                <p className="truncate text-xs text-slate-400">
                  {currentTrack.artist} • {currentTrack.genre}
                </p>
              </div>
            </Link>

            <div className="flex items-center justify-between gap-3 lg:justify-center">
              <button className="rounded-full p-2 text-slate-400 hover:text-white" onClick={previousTrack}>
                <SkipBack size={18} />
              </button>
              <button
                className="rounded-full bg-white px-4 py-3 text-slate-950 transition hover:bg-accent-300"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button className="rounded-full p-2 text-slate-400 hover:text-white" onClick={nextTrack}>
                <SkipForward size={18} />
              </button>
              <button
                className={clsx(
                  "rounded-full p-2 transition",
                  liked ? "text-rose-400" : "text-slate-400 hover:text-white"
                )}
                onClick={() => toggleLike(currentTrack.id)}
              >
                <Heart size={18} fill={liked ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="flex min-w-[180px] items-center gap-3 text-xs text-slate-400">
              <span>{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || currentTrack.duration || 1}
                value={currentTime}
                onChange={(event) => {
                  const nextTime = Number(event.target.value);
                  setCurrentTime(nextTime);
                  if (audioRef.current) audioRef.current.currentTime = nextTime;
                }}
                className="h-1 flex-1 accent-accent-400"
              />
              <span>{formatTime(duration || currentTrack.duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
