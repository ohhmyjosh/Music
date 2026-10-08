// Josh-Fy overlay renderer — "spectrum ribbon" edition.
//
// A wide, glowing frequency ribbon: bars mirror above and below a centre line,
// their colour sweeping left→right through cyan, blue, violet and magenta, with
// a smooth flowing wave threaded through the middle and a scatter of drifting
// particles. It reacts to the music's beat.
//
// It is driven ENTIRELY by audio frames pushed from the Josh-Fy web app (via
// the main process). It does not listen to system audio, so it reacts to
// Josh-Fy alone and never to anything else playing on the PC.

const canvas = document.getElementById("wave");
const ctx = canvas.getContext("2d");
const nowPlayingEl = document.getElementById("nowplaying");

let dockTop = false;
let showNowPlaying = true;
// Tray -> Intensity: scales brightness and bar height.
const INTENSITY = { subtle: 0.65, normal: 1, bold: 1.25 };
let intensity = 1;

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
    intensity = INTENSITY[cfg.intensity] || 1;
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

// ---- Palette: cyan → blue → violet → magenta across the width --------------
const STOPS = [
  [34, 211, 238],   // cyan
  [59, 130, 246],   // blue
  [139, 92, 246],   // violet
  [236, 72, 153],   // magenta
  [244, 114, 182]   // pink
];
function colorAt(p) {
  const x = Math.min(0.9999, Math.max(0, p)) * (STOPS.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = STOPS[i];
  const b = STOPS[i + 1] || a;
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f)
  ];
}

// ---- Scene state ------------------------------------------------------------
let level = 0;
let lastNow = 0;
let bassAvg = 0;
let beatPulse = 0;
let cols = new Float32Array(0);

// Drifting particles behind the bars.
const PARTICLES = Array.from({ length: 46 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: 0.5 + Math.random() * 1.6,
  sp: 0.01 + Math.random() * 0.04,
  ph: Math.random() * Math.PI * 2
}));

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

function hash(n) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function draw(now) {
  resize();
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dt = Math.min((now - lastNow) / 1000, 0.1) || 0.016;
  lastNow = now;
  ctx.clearRect(0, 0, w, h);

  ctx.save();
  if (dockTop) {
    ctx.translate(0, h);
    ctx.scale(1, -1);
  }

  const fresh = now - frameAt < 1200;
  // frame.viz is the web app's Music visualizer setting: off means no wave.
  const playing = fresh && frame.playing && frame.viz !== false;
  const bins = frame.bins || [];
  const hasReal = playing && frame.real && bins.length > 0;

  // Time-based fade (~1.5s to clear after pause / visualizer off) so it takes
  // the same time on a slow GPU as on a fast one.
  level += ((playing ? 1 : 0) - level) * (1 - Math.pow(0.94, dt * 60));

  if (level > 0.004) {
    const t = now / 1000;
    const baseY = h; // bars stand on the very bottom edge of the screen and rise up

    // ---- Beat detection off the low bins -----------------------------------
    let bass = 0;
    if (hasReal) {
      const lowCount = Math.max(2, Math.floor(bins.length * 0.12));
      for (let i = 0; i < lowCount; i += 1) bass += bins[i] || 0;
      bass = bass / (lowCount * 255);
    }
    bassAvg += (bass - bassAvg) * 0.04;
    if (bass > bassAvg * 1.22 && bass > 0.12) beatPulse = 1;
    beatPulse = Math.max(0, beatPulse - dt * 2.6);

    // ---- Drifting particles (behind the bars) ------------------------------
    ctx.globalCompositeOperation = "lighter";
    for (const pt of PARTICLES) {
      pt.x -= pt.sp * dt;
      if (pt.x < 0) pt.x += 1;
      const twinkle = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2 + pt.ph));
      const [r, g, b] = colorAt(pt.x);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.25 * intensity * twinkle * level})`;
      ctx.beginPath();
      ctx.arc(pt.x * w, pt.y * h, pt.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- Mirrored spectrum bars --------------------------------------------
    const STEP = 5; // px per bar cell — wider cells read as distinct bars
    const barW = 3;
    const colCount = Math.ceil(w / STEP);
    if (cols.length !== colCount) cols = new Float32Array(colCount);

    // Bars grow UPWARD from the bottom edge only. Kept moderate so it reads as a
    // slim band across the bottom of the screen, not a wall.
    const maxSpike = h * 0.66 * Math.min(1.2, intensity) * (1 + 0.18 * beatPulse);

    for (let i = 0; i < colCount; i += 1) {
      const p = i / (colCount - 1);
      let value;
      if (hasReal) {
        const bin = Math.floor(Math.pow(p, 1.2) * bins.length * 0.9);
        value = (bins[bin] || 0) / 255;
      } else if (playing) {
        // No audio data yet: a calm low line, never a fake beat.
        value = 0.04 + 0.03 * Math.sin(t * 1.2 - p * 6);
      } else {
        value = 0;
      }
      // A little deterministic texture between neighbouring bars; no random
      // flicker, so the strip reads as one smooth waveform.
      const texture = 0.85 + 0.15 * hash(i * 13 + Math.floor(t * 8));
      value = Math.min(1, value * texture) * level;
      cols[i] += (value - cols[i]) * (value > cols[i] ? 0.7 : 0.2);
    }

    // No per-bar glow: a shadowBlur on ~400 bars per frame held the strip at
    // ~8fps on integrated GPUs (measured: 8fps with it, ~53fps without).
    ctx.shadowBlur = 0;
    for (let i = 0; i < colCount; i += 1) {
      const spike = cols[i] * maxSpike;
      if (spike < 0.5) continue;
      const p = i / (colCount - 1);
      const [r, g, b] = colorAt(p);
      const x = i * STEP;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, 0.85 * intensity) * level})`;
      // Rise upward from the bottom edge only.
      ctx.fillRect(x, baseY - spike, barW, spike);
    }

    // ---- Flowing wave skimming just above the bottom edge ------------------
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 6) {
      const p = x / w;
      const wave =
        Math.sin(p * 9 - t * 2.2) * 0.6 +
        Math.sin(p * 4 - t * 1.3) * 0.4;
      const env = Math.sin(p * Math.PI);
      // Sits low near the bottom and ripples upward a little, never crossing mid.
      const y = baseY - (0.1 * h + (wave * 0.5 + 0.5) * env * h * 0.18 * (0.7 + 0.5 * beatPulse) * level);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "rgba(34, 211, 238, 0.9)");
    grad.addColorStop(0.5, "rgba(139, 92, 246, 0.9)");
    grad.addColorStop(1, "rgba(236, 72, 153, 0.9)");
    ctx.strokeStyle = grad;
    ctx.shadowColor = "rgba(139, 92, 246, 0.8)";
    ctx.stroke();

    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;
  }

  ctx.restore();
  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
