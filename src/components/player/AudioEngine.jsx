import { useCallback, useEffect, useRef, useState } from "react";
import { usePlaybackClock, usePlayerStore } from "../../store/playerStore";
import { useLibraryStore } from "../../store/libraryStore";
import { resolveOfflineUrl } from "../../store/downloadsStore";
import { useSettingsStore } from "../../store/settingsStore";
import { useUiStore } from "../../store/uiStore";
import { audiusStreamCandidates } from "../../api/audius";
import { getSongById } from "../../api/saavn";
import {
  installAudioUnlock,
  isRouted,
  onAnalyserFailure,
  routeThroughAnalyser,
  unlockAudio,
  unrouteAnalyser
} from "../../audio/analyser";
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
// Buffering this long while the listener expects sound counts as a stall.
const STALL_MS = 12000;
// A stream that was playing and then broke is a network problem, not a bad
// song: retry it in place with backoff (~35s) before trying anything else.
const NETWORK_RETRY_DELAYS = [1500, 3000, 6000, 10000, 15000];
// Where the song was, so a reload comes back at the same spot (YT Music does).
const POSITION_KEY = "joshfy-position";

// Every URL that could serve a track, best first. Saavn carries a quality
// ladder (320k -> 12k); Audius tracks can be rebuilt on any discovery node.
function streamCandidates(track) {
  let urls;
  if (track.source === "audius") urls = audiusStreamCandidates(track);
  else if (track.streamUrls?.length) urls = track.streamUrls.slice(0, 4);
  else urls = track.audioUrl ? [track.audioUrl] : [];
  return [...new Set(urls.filter(Boolean))];
}

function readPosition() {
  try {
    return JSON.parse(localStorage.getItem(POSITION_KEY) || "null");
  } catch {
    return null;
  }
}

function writePosition(qid, t) {
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify({ qid, t }));
  } catch {
    /* storage full or blocked: resuming at 0 is fine */
  }
}

function isTyping(target) {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
  );
}

const player = () => usePlayerStore.getState();
const toast = (message) => useUiStore.getState().toast(message);

// Headless: owns the one <audio> element and wires it to the stores, the OS
// media controls, keyboard shortcuts and the desktop overlay. Renders no UI.
//
// Playback never depends on the visualizer. In "viz" mode the element loads
// streams with CORS so the analyser may route it; in "plain" mode it is a bare
// <audio>. Switching modes swaps in a fresh element at the same position,
// because an element routed through Web Audio can never be un-routed.
export default function AudioEngine() {
  const visualizer = useSettingsStore((state) => state.visualizer);
  const [mode, setMode] = useState(visualizer ? "viz" : "plain");
  const modeRef = useRef(mode);
  modeRef.current = mode;
  // Why we're in plain mode while the visualizer is on: "cors" (one stream
  // refused CORS; go back to viz on the next song) or "failure" (Web Audio
  // broke; stay plain until the setting is toggled).
  const plainReason = useRef(null);

  const audioRef = useRef(null);
  const failuresRef = useRef(0);
  const skippingRef = useRef(false);
  const countedRef = useRef(null);
  const timers = useRef({ stall: 0, retry: 0, savedAt: 0 });
  // Everything about the track the element is serving. `loadId` increments on
  // every new track so late async work (offline lookup, URL refresh, retries)
  // for an older song can recognise itself and bail.
  const run = useRef({
    loadId: 0,
    qid: null,
    track: null,
    candidates: [],
    index: 0,
    started: false, // the current candidate has produced sound
    played: false, // this song has produced sound at all (so later failures are the network)
    refreshed: false, // fresh stream URLs were already fetched once
    plainTried: false,
    netRetries: 0,
    lastTime: 0,
    resumeAt: 0,
    sourceSetAt: 0,
    waitingOnline: false,
    blobUrl: null,
    pendingBegin: null
  });

  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const volume = usePlayerStore((state) => state.volume);
  const muted = usePlayerStore((state) => state.muted);
  const pendingSeek = usePlayerStore((state) => state.pendingSeek);

  const recoverRef = useRef(() => {});

  const clearTimers = () => {
    clearTimeout(timers.current.stall);
    clearTimeout(timers.current.retry);
  };

  // No progress for STALL_MS while the listener expects sound: recover.
  const armStallWatch = useCallback(() => {
    clearTimeout(timers.current.stall);
    if (!player().isPlaying) return;
    timers.current.stall = setTimeout(() => {
      const audio = audioRef.current;
      if (audio && player().isPlaying && (audio.paused || audio.readyState < 3)) recoverRef.current("stall");
    }, STALL_MS);
  }, []);

  const safePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    let promise;
    try {
      promise = audio.play();
    } catch {
      return;
    }
    promise?.catch((error) => {
      // The browser refused to start sound without a tap (iOS, a restored
      // session): show paused instead of a play state with no music.
      if (error?.name === "NotAllowedError" && audioRef.current === audio) {
        usePlayerStore.setState({ isPlaying: false, status: "paused" });
      }
    });
    if (modeRef.current === "viz" && useSettingsStore.getState().visualizer) {
      routeThroughAnalyser(audio).catch(() => {});
    }
  }, []);

  const setSource = useCallback(
    (index, at = 0) => {
      const audio = audioRef.current;
      const r = run.current;
      if (!audio || !r.candidates[index]) return;
      clearTimers();
      r.index = index;
      r.started = false;
      r.resumeAt = at > 0 ? at : 0;
      r.lastTime = at > 0 ? at : 0;
      r.sourceSetAt = Date.now();
      audio.src = r.candidates[index];
      audio.load();
      if (player().isPlaying) {
        player().setStatus("loading");
        safePlay();
        armStallWatch();
      }
    },
    [safePlay, armStallWatch]
  );

  const releaseBlob = () => {
    const r = run.current;
    if (r.blobUrl) URL.revokeObjectURL(r.blobUrl);
    r.blobUrl = null;
  };

  // Every source for this song failed. A song nobody asked to play (a restored
  // queue) just shows the error; a network outage pauses (skipping would fail
  // too); a broken song is skipped, a bounded number of times in a row.
  const giveUp = useCallback(async (kind) => {
    const r = run.current;
    const state = player();
    clearTimers();
    state.setStatus("error");
    if (!state.isPlaying) return;
    if (kind === "network") {
      usePlayerStore.setState({ isPlaying: false, status: "error" });
      toast("Lost the connection — press play to try again");
      return;
    }
    failuresRef.current += 1;
    if (failuresRef.current > MAX_CONSECUTIVE_FAILURES) {
      usePlayerStore.setState({ isPlaying: false, status: "error" });
      toast("Playback keeps failing — check your connection");
      return;
    }
    toast(`Couldn't play "${r.track?.title || "this song"}" — skipping`);
    const qid = r.qid;
    skippingRef.current = true;
    await state.next();
    // End of the queue (or a one-song repeat): nothing else to move to.
    if (player().currentTrack?.qid === qid) {
      skippingRef.current = false;
      usePlayerStore.setState({ isPlaying: false, status: "error" });
    }
  }, []);

  const switchMode = useCallback((next) => {
    const audio = audioRef.current;
    const r = run.current;
    if (audio && r.started && !audio.seeking && Number.isFinite(audio.currentTime) && audio.currentTime > 0) {
      r.lastTime = audio.currentTime;
    }
    setMode(next);
  }, []);

  // Walk the recovery ladder for the current song.
  const recover = useCallback(
    (reason) => {
      const r = run.current;
      if (!r.track || !audioRef.current) return;
      clearTimers();
      const url = r.candidates[r.index] || "";
      const remote = /^https?:/.test(url);
      // A source that never started and then hung is as bad as one that errored.
      const kind = reason === "stall" && !r.started && !r.played ? "source" : reason;

      // 1. Visualizer mode loads with CORS. A stream without CORS headers fails
      //    there but plays fine on a plain element: retry it once that way.
      if (reason === "source" && modeRef.current === "viz" && remote && !r.played && !r.plainTried) {
        r.plainTried = true;
        plainReason.current = "cors";
        switchMode("plain");
        return;
      }
      // 2. Offline: wait for the connection rather than burning through sources.
      if (remote && navigator.onLine === false) {
        r.waitingOnline = true;
        player().setStatus("loading");
        return;
      }
      // 3. It was playing and then broke: the network, not the song. Retry in place.
      if ((kind === "network" || kind === "stall") && r.netRetries < NETWORK_RETRY_DELAYS.length) {
        const delay = NETWORK_RETRY_DELAYS[r.netRetries];
        r.netRetries += 1;
        const { loadId, index, lastTime } = r;
        player().setStatus("loading");
        timers.current.retry = setTimeout(() => {
          if (loadId === r.loadId && player().isPlaying) setSource(index, lastTime);
        }, delay);
        return;
      }
      // 4. The next candidate (lower quality tier, another Audius node). A network
      //    failure keeps its spent retry budget so an outage gives up in ~45s.
      if (r.index < r.candidates.length - 1) {
        if (kind === "source") r.netRetries = 0;
        setSource(r.index + 1, r.lastTime);
        return;
      }
      // 5. Ask the catalogue once for fresh stream URLs.
      if (!r.refreshed && r.track.source === "saavn" && r.track.sourceId) {
        r.refreshed = true;
        const { loadId, lastTime } = r;
        getSongById(r.track.sourceId)
          .then((fresh) => {
            if (loadId !== r.loadId) return;
            const extra = (fresh?.streamUrls || []).filter((candidate) => !r.candidates.includes(candidate));
            if (!extra.length) throw new Error("no new streams");
            r.candidates.push(...extra);
            setSource(r.index + 1, lastTime);
          })
          .catch(() => {
            if (loadId === r.loadId) giveUp(kind === "stall" ? "network" : kind);
          });
        return;
      }
      giveUp(kind === "stall" ? "network" : kind);
    },
    [giveUp, setSource, switchMode]
  );
  recoverRef.current = recover;

  // Start serving a new song.
  const beginTrack = useCallback(
    async (track, resumeAt = 0) => {
      const r = run.current;
      // Back to the visualizer after one stream needed a plain element.
      if (plainReason.current === "cors" && useSettingsStore.getState().visualizer && modeRef.current === "plain") {
        plainReason.current = null;
        r.pendingBegin = { track, resumeAt };
        r.qid = track.qid;
        setMode("viz");
        return;
      }
      r.loadId += 1;
      const loadId = r.loadId;
      clearTimers();
      releaseBlob();
      if (!skippingRef.current) failuresRef.current = 0;
      skippingRef.current = false;
      Object.assign(r, {
        qid: track.qid,
        track,
        candidates: [],
        index: 0,
        started: false,
        played: false,
        refreshed: false,
        plainTried: false,
        netRetries: 0,
        lastTime: resumeAt,
        resumeAt,
        waitingOnline: false,
        pendingBegin: null
      });

      // A downloaded copy always wins: it plays with no network at all. Asked of
      // IndexedDB directly, so it works before the downloads list has loaded.
      const offline = await resolveOfflineUrl(track.id).catch(() => null);
      if (loadId !== r.loadId) {
        if (offline) URL.revokeObjectURL(offline);
        return;
      }
      r.blobUrl = offline;
      r.candidates = [...(offline ? [offline] : []), ...streamCandidates(track)];
      if (!r.candidates.length) {
        giveUp("source");
        return;
      }
      setSource(0, resumeAt);
    },
    [giveUp, setSource]
  );

  // ---- The element itself ---------------------------------------------------------
  // A retired element must fall silent: detached media keeps playing otherwise.
  const attachElement = useCallback((element) => {
    const previous = audioRef.current;
    if (previous && previous !== element) {
      if (isRouted(previous)) unrouteAnalyser();
      try {
        previous.pause();
        previous.removeAttribute("src");
        previous.load();
      } catch {
        /* already gone */
      }
    }
    if (element) audioRef.current = element;
  }, []);

  // A fresh element after a mode switch picks up where the old one stopped.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const audio = audioRef.current;
    const r = run.current;
    if (!audio) return;
    const { volume: level, muted: isMuted } = player();
    audio.volume = isMuted ? 0 : level;
    if (r.pendingBegin) {
      const { track, resumeAt } = r.pendingBegin;
      r.pendingBegin = null;
      beginTrack(track, resumeAt);
    } else if (r.track && r.candidates.length) {
      setSource(r.index, r.lastTime);
    }
  }, [mode, beginTrack, setSource]);

  // ---- Load the current track ------------------------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentTrack) {
      clearTimers();
      audio.pause();
      return;
    }
    if (run.current.qid === currentTrack.qid) return;
    // First song of the session: if it's the one we were on, resume there.
    let resumeAt = 0;
    if (!run.current.qid) {
      const saved = readPosition();
      if (saved?.qid === currentTrack.qid && saved.t > 0) resumeAt = saved.t;
    }
    beginTrack(currentTrack, resumeAt);
  }, [currentTrack, beginTrack]);

  // ---- Play / pause ----------------------------------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    const r = run.current;
    if (!audio || !audio.src) return;
    if (isPlaying) {
      // Pressing play after a failure (or a lost connection) starts the song's
      // sources over from the top, at the same position.
      if ((player().status === "error" || audio.error || r.waitingOnline) && r.track) {
        const { track, lastTime } = r;
        r.qid = null;
        beginTrack(track, lastTime);
      } else {
        safePlay();
      }
    } else {
      clearTimers();
      audio.pause();
    }
  }, [isPlaying, safePlay, beginTrack]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => {
    const audio = audioRef.current;
    const r = run.current;
    if (!audio || pendingSeek === null || !Number.isFinite(pendingSeek)) return;
    const state = player();
    state.clearPendingSeek();
    r.lastTime = pendingSeek;
    if (audio.error || state.status === "error") {
      // Seeking a broken stream reloads it at the new spot.
      if (state.isPlaying) setSource(r.index, pendingSeek);
      else r.resumeAt = pendingSeek;
      return;
    }
    if (audio.readyState < 1 || r.resumeAt) {
      r.resumeAt = pendingSeek; // applied once metadata arrives
    } else {
      try {
        audio.currentTime = pendingSeek;
      } catch {
        r.resumeAt = pendingSeek;
      }
    }
    // Repeat-one and "previous" seek a song that already ended back to 0 —
    // the element is paused by then, so restart it explicitly.
    if (state.isPlaying && audio.paused) safePlay();
  }, [pendingSeek, safePlay, setSource]);

  // ---- Visualizer on/off -----------------------------------------------------------
  useEffect(() => {
    const desired = visualizer ? "viz" : "plain";
    plainReason.current = null;
    if (modeRef.current !== desired) switchMode(desired);
  }, [visualizer, switchMode]);

  // ---- One-time wiring: analyser failsafe, network, overlay, media keys ----------
  useEffect(() => {
    onAnalyserFailure(() => {
      // Web Audio stopped producing sound (e.g. the OS suspended it). The
      // music matters more than the visualizer: continue on a plain element.
      plainReason.current = "failure";
      switchMode("plain");
    });

    const onOnline = () => {
      const r = run.current;
      if (r.waitingOnline && player().isPlaying) {
        r.waitingOnline = false;
        setSource(r.index, r.lastTime);
      }
    };
    window.addEventListener("online", onOnline);

    const savePosition = () => {
      const r = run.current;
      if (r.qid && r.lastTime > 0) writePosition(r.qid, r.lastTime);
    };
    window.addEventListener("pagehide", savePosition);

    startOverlayBridge();
    installAudioUnlock();

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
    return () => {
      onAnalyserFailure(null);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("pagehide", savePosition);
      window.removeEventListener("keydown", onKey);
      clearTimers();
    };
  }, [setSource, switchMode]);

  useEffect(() => {
    setMediaSessionMetadata(currentTrack);
    document.title = currentTrack ? `${currentTrack.title} • ${currentTrack.artist} — Josh-Fy` : "Josh-Fy";
  }, [currentTrack]);

  useEffect(() => {
    setMediaSessionPlaybackState(isPlaying);
  }, [isPlaying]);

  // Events from a retired element or an abandoned source are ignored.
  const live = (event) => {
    const audio = event.currentTarget;
    const r = run.current;
    return audio === audioRef.current && Boolean(r.track) && audio.src === r.candidates[r.index];
  };

  return (
    <audio
      key={mode}
      ref={attachElement}
      // Only visualizer mode asks for CORS: routing a non-CORS stream through Web
      // Audio would output silence. Plain mode plays any stream at all.
      crossOrigin={mode === "viz" ? "anonymous" : undefined}
      preload="auto"
      onLoadedMetadata={(event) => {
        if (!live(event)) return;
        const audio = event.currentTarget;
        const r = run.current;
        if (Number.isFinite(audio.duration)) usePlaybackClock.getState().setDuration(audio.duration);
        if (r.resumeAt > 0) {
          const target = Number.isFinite(audio.duration) ? Math.min(r.resumeAt, Math.max(0, audio.duration - 1)) : r.resumeAt;
          try {
            audio.currentTime = target;
          } catch {
            /* not seekable: start from the top */
          }
          usePlaybackClock.getState().setTime(target);
          r.resumeAt = 0;
        }
      }}
      onWaiting={(event) => {
        if (!live(event)) return;
        player().setStatus("loading");
        armStallWatch();
      }}
      onStalled={(event) => live(event) && armStallWatch()}
      onPlaying={(event) => {
        if (!live(event)) return;
        const r = run.current;
        clearTimeout(timers.current.stall);
        r.started = true;
        r.played = true;
        r.netRetries = 0;
        failuresRef.current = 0;
        player().setStatus("playing");
      }}
      onPause={(event) => {
        if (!live(event)) return;
        const audio = event.currentTarget;
        const r = run.current;
        clearTimeout(timers.current.stall);
        const state = player();
        if (state.status !== "error" && (!state.isPlaying || state.status === "playing")) state.setStatus("paused");
        // Paused by the OS or browser (headphones unplugged, another app took
        // audio): reflect it so the play button isn't lying.
        if (
          state.isPlaying &&
          r.started &&
          !audio.ended &&
          !audio.error &&
          !audio.seeking &&
          Date.now() - r.sourceSetAt > 1000
        ) {
          setTimeout(() => {
            if (audioRef.current === audio && audio.paused && !audio.ended && player().isPlaying && player().status !== "loading") {
              usePlayerStore.setState({ isPlaying: false, status: "paused" });
            }
          }, 250);
        }
      }}
      onError={(event) => {
        if (!live(event)) return;
        const error = event.currentTarget.error;
        if (!error || error.code === 1) return; // MEDIA_ERR_ABORTED: we changed the source
        const r = run.current;
        // MEDIA_ERR_NETWORK, or any failure of a song that already played, is
        // the connection; anything else before first sound is a bad source.
        recover(error.code === 2 || r.started || r.played ? "network" : "source");
      }}
      onProgress={(event) => {
        const audio = event.currentTarget;
        if (audio.buffered.length) {
          usePlaybackClock.getState().setBuffered(audio.buffered.end(audio.buffered.length - 1));
        }
      }}
      onTimeUpdate={(event) => {
        if (!live(event)) return;
        const audio = event.currentTarget;
        const r = run.current;
        if (!audio.paused) clearTimeout(timers.current.stall);
        // Until a reload has seeked to its resume point, 0 isn't the position.
        if (r.resumeAt || audio.seeking || audio.readyState < 2) return;
        r.lastTime = audio.currentTime;
        usePlaybackClock.getState().setTime(audio.currentTime);
        setMediaSessionPosition({
          duration: audio.duration,
          position: audio.currentTime,
          playbackRate: audio.playbackRate
        });
        const now = Date.now();
        if (now - timers.current.savedAt > 4000) {
          timers.current.savedAt = now;
          writePosition(r.qid, audio.currentTime);
        }
        const track = player().currentTrack;
        if (track && countedRef.current !== track.qid && audio.currentTime >= PLAY_COUNT_SECONDS) {
          countedRef.current = track.qid;
          useLibraryStore.getState().recordPlay(track);
        }
      }}
      onEnded={(event) => {
        if (!live(event)) return;
        if (player().currentTrack?.qid === run.current.qid) player().next(true);
      }}
    />
  );
}
