import { useEffect, useMemo, useRef } from "react";
import { Pause, Play, SkipForward } from "lucide-react";
import { Link } from "react-router-dom";
import { usePlayerStore } from "../../store/playerStore";
import { attachAnalyser, resumeAnalyser } from "../../audio/analyser";

export default function MiniPlayer() {
  const audioRef = useRef(null);
  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    setCurrentTime,
    setDuration
  } = usePlayerStore();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.audioUrl) return;

    if (audio.src !== currentTrack.audioUrl) {
      audio.src = currentTrack.audioUrl;
      audio.load();
    }

    if (isPlaying) {
      // Route audio through the shared analyser and unlock the AudioContext on
      // this user-driven play so the waveform can read live data.
      attachAnalyser(audio);
      resumeAnalyser();
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
    const total = duration || currentTrack?.duration || 0;
    return total ? (currentTime / total) * 100 : 0;
  }, [currentTime, currentTrack?.duration, duration]);

  if (!currentTrack) return null;

  return (
    <>
      <audio
        ref={audioRef}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || currentTrack.duration || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={nextTrack}
      />

      <div className="fixed bottom-[72px] left-0 right-0 z-30 px-2 xl:bottom-4 xl:left-24 xl:px-6">
        <div className="mx-auto max-w-[1180px] overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/95 shadow-[0_12px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="h-[3px] w-full bg-white/5">
            <div className="h-full bg-accent-400 transition-all" style={{ width: `${progress}%` }} />
          </div>

          <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4 xl:px-5">
            <Link to="/player" className="flex min-w-0 flex-1 items-center gap-3">
              <img src={currentTrack.artwork} alt={currentTrack.title} className="h-12 w-12 rounded-xl object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{currentTrack.title}</p>
                <p className="truncate text-xs text-slate-400">{currentTrack.artist}</p>
              </div>
            </Link>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                className="rounded-full bg-white p-2.5 text-slate-950 transition hover:bg-accent-300"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button className="rounded-full p-2 text-slate-300 transition hover:bg-white/5 hover:text-white" onClick={nextTrack}>
                <SkipForward size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
