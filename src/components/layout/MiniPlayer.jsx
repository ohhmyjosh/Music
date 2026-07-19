import { useCallback, useEffect, useMemo, useRef } from "react";
import { Heart, Loader2, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { usePlayerStore } from "../../store/playerStore";
import Artwork from "../media/Artwork";
import WaveformVisualizer from "../player/WaveformVisualizer";
import { attachAnalyser, resumeAnalyser, unlockAudio, installAudioUnlock } from "../../audio/analyser";
import { startOverlayBridge } from "../../audio/overlayBridge";
import { getStreamCandidates } from "../../api/audius";
import {
  setMediaSessionMetadata,
  setMediaSessionPlaybackState,
  setMediaSessionPosition,
  setupMediaSessionHandlers
} from "../../audio/mediaSession";

export default function MiniPlayer() {
  const audioRef = useRef(null);
  // Stream-recovery bookkeeping for the CURRENT track: which candidate URL
  // we're on, and how many tracks in a row have failed (to stop skip storms).
  const recoveryRef = useRef({ trackId: null, candidates: [], index: 0 });
  const consecutiveFailuresRef = useRef(0);

  const {
    currentTrack,
    isPlaying,
    status,
    volume,
    muted,
    currentTime,
    duration,
    pendingSeek,
    likedTrackIds,
    play,
    pause,
    togglePlay,
    nextTrack,
    previousTrack,
    setCurrentTime,
    setDuration,
    setStatus,
    seekTo,
    seekBy,
    clearPendingSeek,
    toggleLike,
    toggleMute
  } = usePlayerStore();

  // ---- Load + play the current track --------------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.audioUrl) return;

    // New track: reset the candidate walk to its primary URL.
    if (recoveryRef.current.trackId !== currentTrack.id) {
      recoveryRef.current = {
        trackId: currentTrack.id,
        candidates: getStreamCandidates(currentTrack),
        index: 0
      };
    }

    const target = recoveryRef.current.candidates[recoveryRef.current.index] || currentTrack.audioUrl;
    if (audio.src !== target) {
      audio.src = target;
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

  // ---- Stream failure recovery ---------------------------------------------
  // A dead discovery node used to mean a song that silently never played.
  // Now: walk the alternate hosts for the same track, and if every host fails,
  // auto-advance (bounded, so a broken queue can't skip forever).
  const handleAudioError = useCallback(() => {
    const audio = audioRef.current;
    const rec = recoveryRef.current;
    if (!audio || !currentTrack) return;

    if (rec.index < rec.candidates.length - 1) {
      rec.index += 1;
      audio.src = rec.candidates[rec.index];
      audio.load();
      if (usePlayerStore.getState().isPlaying) audio.play().catch(() => {});
      return;
    }

    consecutiveFailuresRef.current += 1;
    setStatus("error");
    if (consecutiveFailuresRef.current <= 3) {
      nextTrack(true);
    } else {
      pause();
    }
  }, [currentTrack, nextTrack, pause, setStatus]);

  // ---- Apply seeks posted to the store -------------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && pendingSeek !== null && Number.isFinite(pendingSeek)) {
      audio.currentTime = pendingSeek;
      clearPendingSeek();
    }
  }, [pendingSeek, clearPendingSeek]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  // Begin streaming this app's own audio data to the desktop overlay (if it's
  // running), so the overlay visualizes only Josh-Fy.
  useEffect(() => {
    startOverlayBridge();
    installAudioUnlock();
  }, []);

  // ---- Keyboard shortcuts (Spotify-style) ----------------------------------
  // Space: play/pause · ←/→: seek 10s · Ctrl+←/→: prev/next · M: mute
  useEffect(() => {
    const onKey = (event) => {
      const el = event.target;
      const typing =
        el instanceof HTMLElement &&
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (typing || !usePlayerStore.getState().currentTrack) return;

      switch (event.code) {
        case "Space":
          event.preventDefault();
          unlockAudio();
          togglePlay();
          break;
        case "ArrowLeft":
          event.preventDefault();
          if (event.ctrlKey) previousTrack();
          else seekBy(-10);
          break;
        case "ArrowRight":
          event.preventDefault();
          if (event.ctrlKey) nextTrack();
          else seekBy(10);
          break;
        case "KeyM":
          toggleMute();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, previousTrack, nextTrack, seekBy, toggleMute]);

  // ---- OS media surface (media keys, SMTC, lock screen) ---------------------
  useEffect(() => {
    setupMediaSessionHandlers({
      play,
      pause,
      next: nextTrack,
      previous: previousTrack,
      seek: seekTo,
      fastSeek: seekTo,
      seekBy
    });
  }, [play, pause, nextTrack, previousTrack, seekTo, seekBy]);

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

  // Click/drag anywhere on the progress strip to scrub.
  const scrub = useCallback(
    (event) => {
      const total = usePlayerStore.getState().duration || currentTrack?.duration || 0;
      if (!total) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
      seekTo(ratio * total);
    },
    [currentTrack?.duration, seekTo]
  );

  if (!currentTrack) return null;

  const liked = likedTrackIds.includes(currentTrack.id);
  const buffering = isPlaying && status === "loading";

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
        onWaiting={() => setStatus("loading")}
        onPlaying={() => {
          // Sound is actually coming out: clear the failure streak.
          consecutiveFailuresRef.current = 0;
          setStatus("playing");
        }}
        onPause={() => setStatus("paused")}
        onError={handleAudioError}
        onStalled={() => setStatus("loading")}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          setCurrentTime(audio.currentTime);
          setMediaSessionPosition({
            duration: audio.duration || currentTrack.duration || 0,
            position: audio.currentTime,
            playbackRate: audio.playbackRate
          });
        }}
        onEnded={() => nextTrack(true)}
      />

      <div className="fixed bottom-[calc(68px+env(safe-area-inset-bottom))] left-0 right-0 z-30 px-2 xl:bottom-4 xl:left-24 xl:px-6">
        <div className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[22px] border border-white/10 bg-[#0c0b13] shadow-[0_12px_50px_rgba(0,0,0,0.45)]">
          {/* Signature monochrome equalizer, contained to the card's bottom edge. */}
          <WaveformVisualizer variant="mini" />

          {/* Scrubbable progress strip (taller hit area than the visible bar). */}
          <div
            className="group/seek relative z-10 flex h-3 w-full cursor-pointer items-end"
            onPointerDown={scrub}
          >
            <div className="h-[3px] w-full bg-white/5 transition-all group-hover/seek:h-[5px]">
              <div className="h-full bg-accent-400 transition-[width]" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 px-3 py-2.5 sm:px-4 xl:px-5">
            <Link to="/player" className="flex min-w-0 flex-1 items-center gap-3">
              <Artwork src={currentTrack.artwork} alt={currentTrack.title} className="h-12 w-12 rounded-xl" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{currentTrack.title}</p>
                <p className="truncate text-xs text-slate-400">
                  {status === "error" ? "Couldn't play — skipping…" : currentTrack.artist}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                className={clsx(
                  "hidden rounded-full p-2 transition hover:bg-white/5 sm:block",
                  liked ? "text-rose-400" : "text-slate-400 hover:text-white"
                )}
                aria-label={liked ? "Remove from liked songs" : "Add to liked songs"}
                onClick={() => toggleLike(currentTrack)}
              >
                <Heart size={17} fill={liked ? "currentColor" : "none"} />
              </button>
              <button
                className="hidden rounded-full p-2 text-slate-300 transition hover:bg-white/5 hover:text-white sm:block"
                aria-label="Previous track"
                onClick={previousTrack}
              >
                <SkipBack size={18} />
              </button>
              <button
                className="rounded-full bg-white p-2.5 text-slate-950 transition hover:bg-accent-300"
                aria-label={isPlaying ? "Pause" : "Play"}
                onClick={() => {
                  unlockAudio();
                  togglePlay();
                }}
              >
                {buffering ? <Loader2 size={16} className="animate-spin" /> : isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                className="rounded-full p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                aria-label="Next track"
                onClick={() => nextTrack()}
              >
                <SkipForward size={18} />
              </button>
              <button
                className="hidden rounded-full p-2 text-slate-400 transition hover:bg-white/5 hover:text-white xl:block"
                aria-label={muted ? "Unmute" : "Mute"}
                onClick={toggleMute}
              >
                {muted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
