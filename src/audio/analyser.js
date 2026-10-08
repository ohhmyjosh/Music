// The optional Web Audio analyser behind the visualizer and the desktop overlay.
//
// The music never depends on this file. The <audio> element (player/AudioEngine)
// plays on its own; only when the listener has the visualizer switched on is it
// routed through AudioContext -> AnalyserNode -> speakers so we can read live
// frequency data.
//
// Routing is the risky part. Once createMediaElementSource is called, ALL sound
// flows through the context, so:
//   - a context that isn't running means silence (autoplay policy, iOS
//     backgrounding), and
//   - a stream that isn't CORS-clean means silence (the graph is tainted).
// So we only route an element that was loaded with crossOrigin="anonymous", only
// once the context is actually running, and if the context stops while music is
// playing we report a failure and the engine swaps in a plain, unrouted element.

let audioContext = null;
let analyser = null;
let sourceNode = null;
let routedElement = null;
let failureListener = null;
let resumeWatch = null;

function ensureContext() {
  if (audioContext) return audioContext;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  try {
    audioContext = new Ctx();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 128; // 64 frequency bins, plenty for a bar strip
    analyser.smoothingTimeConstant = 0.8;
    analyser.connect(audioContext.destination);
    audioContext.addEventListener?.("statechange", onStateChange);
  } catch {
    audioContext = null;
    analyser = null;
  }
  return audioContext;
}

function fail(reason) {
  const element = routedElement;
  unrouteAnalyser();
  failureListener?.(reason, element);
}

// A routed element whose context stops running is playing silence. Try to
// resume; if that doesn't work quickly, give the music back to the element.
function onStateChange() {
  if (!routedElement || !audioContext) return;
  if (audioContext.state === "running") {
    clearTimeout(resumeWatch);
    return;
  }
  if (routedElement.paused) return;
  audioContext.resume?.().catch(() => {});
  clearTimeout(resumeWatch);
  resumeWatch = setTimeout(() => {
    if (routedElement && !routedElement.paused && audioContext?.state !== "running") fail("context-stopped");
  }, 1500);
}

// Route `element` through the analyser. Resolves true once routed. Never throws
// and never routes into a context that isn't running.
export async function routeThroughAnalyser(element) {
  if (!element || routedElement === element) return routedElement === element;
  if (element.crossOrigin !== "anonymous") return false;
  if (!ensureContext()) return false;
  if (audioContext.state !== "running") {
    try {
      await Promise.race([audioContext.resume(), new Promise((resolve) => setTimeout(resolve, 1500))]);
    } catch {
      /* stays suspended */
    }
    if (audioContext.state !== "running") return false;
  }
  if (!element.isConnected) return false;
  try {
    unrouteAnalyser();
    sourceNode = audioContext.createMediaElementSource(element);
    sourceNode.connect(analyser);
    routedElement = element;
    return true;
  } catch {
    sourceNode = null;
    return false;
  }
}

export function unrouteAnalyser() {
  clearTimeout(resumeWatch);
  try {
    sourceNode?.disconnect();
  } catch {
    /* already gone */
  }
  sourceNode = null;
  routedElement = null;
}

export function isRouted(element) {
  return Boolean(element) && routedElement === element;
}

// The engine registers here to hear "routing broke, play without it".
export function onAnalyserFailure(listener) {
  failureListener = listener;
}

// Gesture handlers call this so a suspended context can start. Only touches a
// context that already exists; creating one is the visualizer's job.
export function unlockAudio() {
  if (audioContext && audioContext.state !== "running") audioContext.resume?.().catch(() => {});
}

// While routed, a context the OS suspends (screen lock, app switch) means
// silence, so try to resume whenever the page comes back.
let unlockInstalled = false;
export function installAudioUnlock() {
  if (unlockInstalled || typeof window === "undefined") return;
  unlockInstalled = true;
  for (const evt of ["pointerdown", "touchstart", "keydown"]) {
    window.addEventListener(evt, unlockAudio, { capture: true, passive: true });
  }
  document.addEventListener("visibilitychange", unlockAudio);
  window.addEventListener("focus", unlockAudio);
  window.addEventListener("pageshow", unlockAudio);
}

// Live analyser, or null when nothing is routed (visualizer off, not started,
// or failed). Readers must treat null as "no data", never as an error.
export function getAnalyser() {
  return routedElement && audioContext?.state === "running" ? analyser : null;
}
