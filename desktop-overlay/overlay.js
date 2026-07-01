// Josh-Fy overlay renderer: capture the PC's system audio (loopback) and draw
// the same mirrored, glowing wave that the web app uses — rising from the
// bottom of the screen, beating with whatever music is playing anywhere.

const canvas = document.getElementById("wave");
const ctx = canvas.getContext("2d");

const BARS_PER_SIDE = 48;
const heights = new Float32Array(BARS_PER_SIDE);
let analyser = null;
let freqData = null;
let level = 0; // eases up when real sound is present

async function initAudio() {
  try {
    // main.js answers this with loopback (system output) audio.
    const stream = await navigator.mediaDevices.getDisplayMedia({
      audio: true,
      video: true
    });
    // We only want the sound — drop the screen video to save resources.
    stream.getVideoTracks().forEach((t) => t.stop());

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    source.connect(analyser);
    freqData = new Uint8Array(analyser.frequencyBinCount);
  } catch (err) {
    // If capture is blocked we simply fall back to a gentle idle animation.
    console.error("System audio capture failed:", err);
  }
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

  let energy = 0;
  if (analyser) {
    analyser.getByteFrequencyData(freqData);
    for (let i = 0; i < freqData.length; i += 1) energy += freqData[i];
  }
  const hasSound = energy > 200;

  // Fade the whole strip in when there's sound, out when it's silent.
  const target = hasSound ? 1 : 0;
  level += (target - level) * 0.05;

  const t = now / 1000;
  const beat = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2)), 6);

  for (let i = 0; i < BARS_PER_SIDE; i += 1) {
    let value;
    if (hasSound) {
      const bin = Math.floor((i / BARS_PER_SIDE) * freqData.length * 0.75);
      value = freqData[bin] / 255;
    } else {
      // Idle shimmer so it still looks alive between songs.
      value = (0.12 + 0.08 * Math.sin(t * 2 + i * 0.5)) * (0.5 + 0.5 * beat);
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
    gradient.addColorStop(0, "rgba(34, 179, 95, 0.05)");
    gradient.addColorStop(0.5, "rgba(74, 206, 125, 0.6)");
    gradient.addColorStop(1, "rgba(127, 227, 164, 0.95)");
    ctx.fillStyle = gradient;
    ctx.shadowColor = "rgba(74, 206, 125, 0.6)";
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

initAudio().finally(() => requestAnimationFrame(draw));
