import { useCallback, useEffect, useRef } from "react";
import { usePlaybackClock, usePlayerStore } from "../../store/playerStore";
import { useLibraryStore } from "../../store/libraryStore";
import { resolveOfflineUrl, useDownloadsStore } from "../../store/downloadsStore";
import { useUiStore } from "../../store/uiStore";
import { audiusStreamCandidates } from "../../api/audius";
import { attachAnalyser, installAudioUnlock, resumeAnalyser, unlockAudio } from "../../audio/analyser";
import { startOverlayBridge } from "../../audio/overlayBridge";
import {
  setMediaSessionMetadata,
  setMediaSessionPlaybackState,
  setMediaSessionPosition,
  setupMediaSessionHandlers
} from "../../audio/mediaSession";

// A play counts toward history (Listen again, Quick picks) after this much
// listening — the same idea as YouTube's view threshold, so skipped songs
// don't shape the feed.
const PLAY_COUNT_SECONDS = 10;
const MAX_CONSECUTIVE_FAILURES = 3;

// Every URL that could serve a track, best first. Saavn carries a quality
// ladder (320k -> 12k); Audius tracks can be rebuilt on any discovery node.
function streamCandidates(track) {
  if (track.source === "audius") return audiusStreamCandidates(track);
  if (track.streamUrls?.length) return track.streamUrls.slice(0, 4);
  return track.audioUrl ? [track.audioUrl] : [];
}

function isTyping(target) {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
  );
}

// Headless: owns the one <audio> element and wires it to the stores, the OS
// media controls, keyboard shortcuts and the desktop overlay. Renders no UI.
export default function AudioEngine() {
  const audioRef = useRef(null);
  const loadRef = useRef({ qid: null, candidates: [], index: 0 });
  const failuresRef = useRef(0);
  const countedRef = useRef(null);

  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const volume = usePlayerStore((state) => state.volume);
  const muted = usePlayerStore((state) => state.muted);
  const pendingSeek = usePlayerStore((state) => state.pendingSeek);

  // ---- Load the current track ------------------------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (loadRef.current.qid === currentTrack.qid) return;

    const qid = currentTrack.qid;
    loadRef.current = { qid, candidates: streamCandidates(currentTrack), index: 0 };
    let cancelled = false;

    (async () => {
      // A downloaded copy always wins: it plays with no network at all.
      const offline = useDownloadsStore.getState().isDownloaded(currentTrack.id)
        ? await resolveOfflineUrl(currentTrack.id)
        : null;
      if (cancelled || loadRef.current.qid !== qid) return;
      if (offline) loadRef.current.candidates = [offline, ...loadRef.current.candidates];

      const src = loadRef.current.candidates[0];
      if (!src) {
        usePlayerStore.getState().setStatus("error");
        return;
      }
      audio.src = src;
      audio.load();
      if (usePlayerStore.getState().isPlaying) {
        attachAnalyser(audio);
        resumeAnalyser();
        audio.play().catch(() => {});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentTrack]);

  // ---- Play / pause ----------------------------------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    if (isPlaying) {
      attachAnalyser(audio);
      resumeAnalyser();
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || pendingSeek === null || !Number.isFinite(pendingSeek)) return;
    audio.currentTime = pendingSeek;
    const state = usePlayerStore.getState();
    state.clearPendingSeek();
    // Repeat-one and "previous" seek a song that already ended back to 0 —
    // the element is paused by then, so restart it explicitly.
    if (state.isPlaying && audio.paused && audio.src) audio.play().catch(() => {});
  }, [pendingSeek]);

  // ---- Stream failure recovery -------------------------------------------------
  // Walk the remaining candidates for this song; if all fail, skip ahead — but
  // a bounded number of times, so a dead catalog can't cause a skip storm.
  const handleError = useCallback(() => {
    const audio = audioRef.current;
    const load = loadRef.current;
    if (!audio || !load.qid) return;

    if (load.index < load.candidates.length - 1) {
      load.index += 1;
      audio.src = load.candidates[load.index];
      audio.load();
      if (usePlayerStore.getState().isPlaying) audio.play().catch(() => {});
      return;
    }

    failuresRef.current += 1;
    const player = usePlayerStore.getState();
    player.setStatus("error");
    if (failuresRef.current <= MAX_CONSECUTIVE_FAILURES) {
      useUiStore.getState().toast(`Couldn't play "${player.currentTrack?.title}" — skipping`);
      player.next(true);
    } else {
      player.pause();
      useUiStore.getState().toast("Playback keeps failing — check your connection");
    }
  }, []);

  // ---- One-time wiring: overlay, audio unlock, media keys, shortcuts ------------
  useEffect(() => {
    startOverlayBridge();
    installAudioUnlock();

    const player = () => usePlayerStore.getState();
    setupMediaSessionHandlers({
      play: () => player().play(),
      pause: () => player().pause(),
      next: () => player().next(),
      previous: () => player().previous(),
      seek: (time) => player().seekTo(time),
      fastSeek: (time) => player().seekTo(time),
      seekBy: (delta) => player().seekBy(delta)
    });

    // Space play/pause · ←/→ seek 10s · Shift+N/P next/prev · M mute
    // ↑/↓ volume · "/" search · +/- like/dislike (YouTube Music's keys).
    const onKey = (event) => {
      if (isTyping(event.target) || event.metaKey || event.altKey) return;
      const state = player();
      if (event.key === "/") {
        event.preventDefault();
        document.getElementById("joshfy-search")?.focus();
        return;
      }
      if (!state.currentTrack) return;
      if (event.code === "Space" && !event.ctrlKey) {
        event.preventDefault();
        unlockAudio();
        state.togglePlay();
      } else if (event.key === "ArrowLeft" && !event.shiftKey) {
        event.preventDefault();
        if (event.ctrlKey) state.previous();
        else state.seekBy(-10);
      } else if (event.key === "ArrowRight" && !event.shiftKey) {
        event.preventDefault();
        if (event.ctrlKey) state.next();
        else state.seekBy(10);
      } else if (event.shiftKey && event.key.toLowerCase() === "n") {
        state.next();
      } else if (event.shiftKey && event.key.toLowerCase() === "p") {
        state.previous();
      } else if (event.key === "ArrowUp" && event.target === document.body) {
        event.preventDefault();
        state.setVolume(state.volume + 0.05);
      } else if (event.key === "ArrowDown" && event.target === document.body) {
        event.preventDefault();
        state.setVolume(state.volume - 0.05);
      } else if (event.key.toLowerCase() === "m" && !event.ctrlKey) {
        state.toggleMute();
      } else if (event.key === "+" || event.key === "=") {
        useLibraryStore.getState().toggleLike(state.currentTrack);
      } else if (event.key === "-") {
        if (useLibraryStore.getState().toggleDislike(state.currentTrack)) state.next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMediaSessionMetadata(currentTrack);
    document.title = currentTrack ? `${currentTrack.title} • ${currentTrack.artist} — Josh-Fy` : "Josh-Fy";
  }, [currentTrack]);

  useEffect(() => {
    setMediaSessionPlaybackState(isPlaying);
  }, [isPlaying]);

  return (
    <audio
      ref={audioRef}
      // Routing a cross-origin <audio> through Web Audio (the visualizer) outputs
      // silence unless the stream is CORS-clean, so request it with CORS. Saavn's
      // CDN and Audius both send Access-Control-Allow-Origin: *.
      crossOrigin="anonymous"
      preload="auto"
      onLoadedMetadata={(event) => {
        const duration = event.currentTarget.duration;
        if (Number.isFinite(duration)) usePlaybackClock.getState().setDuration(duration);
      }}
      onWaiting={() => usePlayerStore.getState().setStatus("loading")}
      onPlaying={() => {
        failuresRef.current = 0;
        usePlayerStore.getState().setStatus("playing");
      }}
      onPause={() => {
        const state = usePlayerStore.getState();
        if (state.status !== "error") state.setStatus("paused");
      }}
      onError={handleError}
      onProgress={(event) => {
        const audio = event.currentTarget;
        if (audio.buffered.length) {
          usePlaybackClock.getState().setBuffered(audio.buffered.end(audio.buffered.length - 1));
        }
      }}
      onTimeUpdate={(event) => {
        const audio = event.currentTarget;
        usePlaybackClock.getState().setTime(audio.currentTime);
        setMediaSessionPosition({
          duration: audio.duration,
          position: audio.currentTime,
          playbackRate: audio.playbackRate
        });
        const track = usePlayerStore.getState().currentTrack;
        if (track && countedRef.current !== track.qid && audio.currentTime >= PLAY_COUNT_SECONDS) {
          countedRef.current = track.qid;
          useLibraryStore.getState().recordPlay(track);
        }
      }}
      onEnded={() => usePlayerStore.getState().next(true)}
    />
  );
}
