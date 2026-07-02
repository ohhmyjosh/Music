import { useEffect, useMemo, useRef } from "react";
import { Pause, Play, SkipForward } from "lucide-react";
import { Link } from "react-router-dom";
import { usePlayerStore } from "../../store/playerStore";
import { attachAnalyser, resumeAnalyser, unlockAudio, installAudioUnlock } from "../../audio/analyser";
import { startOverlayBridge } from "../../audio/overlayBridge";
import {
  setMediaSessionMetadata,
  setMediaSessionPlaybackState,
  setMediaSessionPosition,
  setupMediaSessionHandlers
} from "../../audio/mediaSession";

export default function MiniPlayer() {
  const audioRef = useRef(null);
  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    play,
    pause,
    togglePlay,
    nextTrack,
    previousTrack,
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

  // Begin streaming this app's own audio data to the desktop overlay (if it's
  // running), so the overlay visualizes only Josh-Fy.
  useEffect(() => {
    startOverlayBridge();
  }, []);

  // Unlock the AudioContext on the first user gesture anywhere in the app, so it
  // is already running by the time playback routes audio through it. Without this
  // the context can stay suspended and produce total silence.
  useEffect(() => {
    installAudioUnlock();
  }, []);

  // Register OS media-control handlers once. These drive hardware media keys and
  // the lock-screen / SMTC / Control Center buttons on every supported platform.
  useEffect(() => {
    const seekTo = (time) => {
      const audio = audioRef.current;
      if (audio && Number.isFinite(time)) {
        audio.currentTime = Math.max(0, time);
        setCurrentTime(audio.currentTime);
      }
    };
    setupMediaSessionHandlers({
      play,
      pause,
      next: nextTrack,
      previous: previousTrack,
      seek: seekTo,
      fastSeek: seekTo,
      seekBy: (delta) => {
        const audio = audioRef.current;
        if (audio) seekTo(audio.currentTime + delta);
      }
    });
  }, [play, pause, nextTrack, previousTrack, setCurrentTime]);

  // Mirror the current track and play/pause state onto the OS media surface.
  useEffect(() => {
    setMediaSessionMetadata(currentTrack);
  }, [currentTrack]);

  useEffect(() => {
    setMediaSessionPlaybackState(isPlaying);
  }, [isPlaying]);

  const progress = useMemo(() => {
    const total = duration || currentTrack?.duration || 0;
    return total ? (currentTime / total) * 100 : 0;
  }, [currentTime, currentTrack?.duration, duration]);

  if (!currentTrack) return null;

  return (
    <>
      <audio
        ref={audioRef}
        // Request the stream with CORS. Routing a cross-origin <audio> element
        // through createMediaElementSource taints the graph and outputs pure
        // silence unless the resource is CORS-clean. Audius (and the demo
        // fallback) send Access-Control-Allow-Origin: *, so this both restores
        // sound AND gives the visualizer real, non-zero frequency data.
        crossOrigin="anonymous"
        onLoadedMetadata={(event) => {
          const dur = event.currentTarget.duration || currentTrack.duration || 0;
          setDuration(dur);
          setMediaSessionPosition({ duration: dur, position: 0 });
        }}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          setCurrentTime(audio.currentTime);
          setMediaSessionPosition({
            duration: audio.duration || currentTrack.duration || 0,
            position: audio.currentTime,
            playbackRate: audio.playbackRate
          });
        }}
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
                onClick={() => {
                  unlockAudio();
                  togglePlay();
                }}
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
