// Shared Web Audio analyser for the whole app.
//
// There is exactly one <audio> element in the app (layout/MiniPlayer). We route
// it through a single AudioContext -> AnalyserNode -> destination so any part of
// the UI (the waveform visualizer) can read live frequency data without touching
// playback.
//
// Notes on cross-origin audio: createMediaElementSource does NOT break playback
// for cross-origin sources, but getByteFrequencyData() will return all zeros when
// the stream is CORS-tainted (most public streaming sources). The visualizer
// detects that and falls back to a simulated beat. Same-origin + blob sources
// (i.e. tracks saved offline / imported locally) yield real, reactive data.

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

export function getAnalyser() {
  return analyser;
}
