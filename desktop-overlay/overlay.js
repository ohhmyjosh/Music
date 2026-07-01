// Josh-Fy overlay renderer.
//
// It draws the same mirrored, glowing wave the web app uses, but it is driven
// ENTIRELY by audio frames pushed from the Josh-Fy web app (via the main
// process). It does not listen to system audio, so it reacts to Josh-Fy alone
// and never to anything else playing on the PC.

const canvas = document.getElementById("wave");
const ctx = canvas.getContext("2d");
const nowPlayingEl = document.getElementById("nowplaying");

const BARS_PER_SIDE = 48;
const heights = new Float32Array(BARS_PER_SIDE);
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

  for (let i = 0; i < BARS_PER_SIDE; i += 1) {
    let value;
    if (hasReal) {
      const bin = Math.floor((i / BARS_PER_SIDE) * bins.length * 0.75);
      value = (bins[bin] || 0) / 255;
    } else if (playing) {
      // Same lively simulated wave the in-app visualizer uses when the stream is
      // cross-origin (no real frequency data available).
      const wave =
        0.5 +
        0.28 * Math.sin(t * 3.1 + i * 0.55) +
        0.18 * Math.sin(t * 1.7 - i * 0.31) +
        0.12 * Math.sin(t * 5.3 + i * 0.9);
      value = Math.max(0, wave) * (0.45 + 0.55 * beat);
    } else {
      value = 0;
    }

    const taper = Math.sin((i / (BARS_PER_SIDE - 1)) * Math.PI * 0.5 + 0.15);
    value *= 0.35 + 0.65 * (1 - i / BARS_PER_SIDE) * taper + 0.2;
    value = Math.min(1, value) * level;
    heights[i] += (value - heights[i]) * (value > heights[i] ? 0.5 : 0.12);
  }

  if (level > 0.004) {
    const totalBars = BARS_PER_SIDE * 2;
    const gap = 2;
    const barWidth = Math.max(1, (w - gap * (totalBars - 1)) / totalBars);
    const maxBarHeight = h * 0.92;

    const gradient = ctx.createLinearGradient(0, h, 0, 0);
    gradient.addColorStop(0, "rgba(124, 58, 237, 0.08)");
    gradient.addColorStop(0.5, "rgba(236, 72, 153, 0.6)");
    gradient.addColorStop(1, "rgba(6, 182, 212, 0.95)");
    ctx.fillStyle = gradient;
    ctx.shadowColor = "rgba(139, 92, 246, 0.6)";
    ctx.shadowBlur = 20;

    for (let b = 0; b < totalBars; b += 1) {
      const side = b < BARS_PER_SIDE ? BARS_PER_SIDE - 1 - b : b - BARS_PER_SIDE;
      const barHeight = Math.max(2, heights[side] * maxBarHeight);
      const x = b * (barWidth + gap);
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
