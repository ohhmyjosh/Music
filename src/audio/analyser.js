// Shared Web Audio analyser for the whole app.
//
// There is exactly one <audio> element in the app (layout/MiniPlayer). We route
// it through a single AudioContext -> AnalyserNode -> destination so any part of
// the UI (the waveform visualizer) can read live frequency data without touching
// playback.
//
// Notes on cross-origin audio: once an <audio> element is routed through
// createMediaElementSource, the element no longer plays straight to the
// speakers -- ALL output flows through this graph. If the media resource is
// cross-origin and NOT CORS-clean, the Web Audio API taints the graph and emits
// pure silence (the element still reports "playing"). The fix is to load the
// element with crossOrigin="anonymous"; when the server sends the right CORS
// headers (Audius, samplelib, blob/same-origin sources all do) playback works
// AND getByteFrequencyData() returns real, reactive data. If a source is ever
// genuinely CORS-tainted the data reads all zeros and the visualizer falls back
// to a simulated beat.

let audioContext = null;
let analyser = null;
let sourceNode = null;
let connectedElement = null;

function ensureContext() {
  if (audioContext) return audioContext;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;

  audioContext = new Ctx();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 128;          // 64 frequency bins - plenty for a bar strip
  analyser.smoothingTimeConstant = 0.8;
  analyser.connect(audioContext.destination);
  return audioContext;
}

// Attach the shared analyser to an <audio> element. Safe to call repeatedly;
// createMediaElementSource may only be called once per element, so we guard it.
export function attachAnalyser(element) {
  if (!element) return;
  if (!ensureContext()) return;
  if (connectedElement === element) return;

  try {
    sourceNode = audioContext.createMediaElementSource(element);
    sourceNode.connect(analyser);
    connectedElement = element;
  } catch {
    // Element was already wired to another MediaElementSource - ignore.
  }
}

// AudioContext starts suspended until a user gesture. Call this from a click/play.
export function resumeAnalyser() {
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
}

// Ensure the context exists AND is running. Because every track is routed
// through createMediaElementSource -> destination, a suspended context means
// total silence (the <audio> element reports "playing" but no samples reach the
// output). Chrome only honours resume() inside a real user gesture, so this must
// be called from a gesture handler, not from a React effect that runs after it.
export function unlockAudio() {
  if (!ensureContext()) return;
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
}

// Install one-time global listeners so the very first user interaction anywhere
// in the app unlocks audio, regardless of which control started playback (a Play
// button on a card, the mini-player, a media key, etc.). Capture phase means we
// run during the gesture, before React's click-driven effects.
let unlockInstalled = false;
export function installAudioUnlock() {
  if (unlockInstalled || typeof window === "undefined") return;
  unlockInstalled = true;
  const handler = () => unlockAudio();
  for (const evt of ["pointerdown", "touchstart", "keydown"]) {
    window.addEventListener(evt, handler, { capture: true, passive: true });
  }

  // Because every track is routed through the AudioContext, a context the OS
  // suspends while the app is backgrounded (screen lock, app switch) means total
  // silence. Mobile browsers suspend the context on background and DON'T always
  // resume it when you return. Re-resume whenever the page becomes visible or
  // regains focus so playback continues seamlessly in the background and on
  // return. Also try to resume the moment we go hidden — Android keeps a
  // running context alive in the background, so this keeps music playing there.
  const keepAlive = () => {
    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
  };
  document.addEventListener("visibilitychange", keepAlive);
  window.addEventListener("focus", keepAlive);
  window.addEventListener("pageshow", keepAlive);
}

export function getAnalyser() {
  return analyser;
}
