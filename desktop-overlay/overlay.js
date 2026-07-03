// Josh-Fy overlay renderer.
//
// It draws the same mirrored, glowing wave the web app uses, but it is driven
// ENTIRELY by audio frames pushed from the Josh-Fy web app (via the main
// process). It does not listen to system audio, so it reacts to Josh-Fy alone
// and never to anything else playing on the PC.

const canvas = document.getElementById("wave");
const ctx = canvas.getContext("2d");
const nowPlayingEl = document.getElementById("nowplaying");

// A single directional sweep: bar 0 sits at the bottom-RIGHT (the origin) and
// the bars march LEFT across the screen, trailing off toward the bottom-left.
const TOTAL_BARS = 96;
const heights = new Float32Array(TOTAL_BARS);
let level = 0; // eases up when Josh-Fy is playing

let dockTop = false; // strip docked to the top edge instead of the bottom
let showNowPlaying = true;

// Latest audio frame from the web app, plus when it arrived (for staleness).
let frame = { playing: false, real: false, bins: [] };
let frameAt = 0;

// ---- Live wiring from the main process ------------------------------------
if (window.joshfy) {
  window.joshfy.onAudioData((data) => {
    frame = data || { playing: false, real: false, bins: [] };
    frameAt = performance.now();
  });

  window.joshfy.onConfig((cfg) => {
    dockTop = cfg.position === "top";
    showNowPlaying = cfg.showNowPlaying !== false;
    document.body.classList.toggle("top", dockTop);
    if (!showNowPlaying) nowPlayingEl.classList.remove("show");
  });

  window.joshfy.onNowPlaying((info) => {
    const playing = info && info.status === "Playing" && info.title;
    if (playing && showNowPlaying) {
      const artist = info.artist ? ` — ${info.artist}` : "";
      nowPlayingEl.textContent = `${info.title}${artist}`;
      nowPlayingEl.classList.add("show");
    } else {
      nowPlayingEl.classList.remove("show");
    }
  });
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

function draw(now) {
  resize();
  const w = window.innerWidth;
  const h = window.innerHeight;
  ctx.clearRect(0, 0, w, h);

  // When docked to the top edge, flip vertically so the bars hang down from the
  // top instead of rising from the bottom. The rest of the draw math is shared.
  if (dockTop) {
    ctx.translate(0, h);
    ctx.scale(1, -1);
  }

  // Consider the stream "live" only if a frame arrived recently; otherwise the
  // web app was closed and we fade out.
  const fresh = now - frameAt < 1200;
  const playing = fresh && frame.playing;
  const bins = frame.bins || [];
  const hasReal = playing && frame.real && bins.length > 0;

  // Ease the whole strip in when Josh-Fy is playing, out otherwise.
  const target = playing ? 1 : 0;
  level += (target - level) * 0.06;

  const t = now / 1000;
  const beat = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2)), 6);

  for (let i = 0; i < TOTAL_BARS; i += 1) {
    // p: 0 at the right-edge origin, 1 at the far left edge.
    const p = i / (TOTAL_BARS - 1);
    let value;
    if (hasReal) {
      const bin = Math.floor(p * bins.length * 0.75);
      value = (bins[bin] || 0) / 255;
    } else if (playing) {
      // Lively simulated wave whose crests travel from the right origin toward
      // the left (the `- i` phase term makes the pattern flow leftward over time).
      const wave =
        0.5 +
        0.28 * Math.sin(t * 3.1 - i * 0.5) +
        0.18 * Math.sin(t * 1.7 - i * 0.28) +
        0.12 * Math.sin(t * 5.3 - i * 0.8);
      value = Math.max(0, wave) * (0.45 + 0.55 * beat);
    } else {
      value = 0;
    }

    // Anchor the energy at the bottom-right and trail it off toward the left.
    const trail = Math.pow(1 - p, 0.65);
    value *= 0.25 + 0.75 * trail;
    value = Math.min(1, value) * level;
    heights[i] += (value - heights[i]) * (value > heights[i] ? 0.5 : 0.12);
  }

  if (level > 0.004) {
    const gap = 2;
    const barWidth = Math.max(1, (w - gap * (TOTAL_BARS - 1)) / TOTAL_BARS);
    const maxBarHeight = h * 0.92;

    const gradient = ctx.createLinearGradient(0, h, 0, 0);
    gradient.addColorStop(0, "rgba(124, 58, 237, 0.08)");
    gradient.addColorStop(0.5, "rgba(236, 72, 153, 0.6)");
    gradient.addColorStop(1, "rgba(6, 182, 212, 0.95)");
    ctx.fillStyle = gradient;
    ctx.shadowColor = "rgba(139, 92, 246, 0.6)";
    ctx.shadowBlur = 20;

    for (let i = 0; i < TOTAL_BARS; i += 1) {
      const barHeight = Math.max(2, heights[i] * maxBarHeight);
      // i = 0 hugs the right edge; each subsequent bar steps to the left.
      const x = w - (i + 1) * barWidth - i * gap;
      const y = h - barHeight;
      const r = Math.min(barWidth / 2, 4);
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.lineTo(x + barWidth - r, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
      ctx.lineTo(x + barWidth, h);
      ctx.closePath();
      ctx.fill();
    }
  }

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
