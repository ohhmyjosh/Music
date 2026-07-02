import { useEffect, useRef } from "react";
import { getAnalyser } from "../../audio/analyser";
import { usePlayerStore } from "../../store/playerStore";

// Number of bars per side. The spectrum is mirrored around the centre so the
// low frequencies "beat" in the middle and taper out to the edges.
const BARS_PER_SIDE = 42;

// variant "ambient"  -> full-width strip fixed to the bottom of the screen.
// variant "inline"   -> fills its parent container (Player page centerpiece).
export default function WaveformVisualizer({ variant = "ambient" }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  // Persistent per-frame state kept in refs so the rAF loop is set up once.
  const heightsRef = useRef(new Float32Array(BARS_PER_SIDE)); // smoothed bar heights 0..1
  const levelRef = useRef(0); // global on/off envelope, eases toward isPlaying

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let freqData = null;
    let running = false;
    let cssW = 0;
    let cssH = 0;

    // Size the backing store once per actual size change (via ResizeObserver)
    // instead of reading clientWidth/clientHeight every frame, which forces a
    // synchronous layout on each rAF tick and is a major source of jank.
    const applySize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = canvas.clientWidth;
      cssH = canvas.clientHeight;
      const nextW = Math.round(cssW * dpr);
      const nextH = Math.round(cssH * dpr);
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    const ro = new ResizeObserver(applySize);
    ro.observe(canvas);
    applySize();

    const draw = (now) => {
      const w = cssW;
      const h = cssH;
      ctx.clearRect(0, 0, w, h);

      const { isPlaying, currentTrack } = usePlayerStore.getState();

      // Ease the whole strip in when playing, out when paused/stopped.
      const target = isPlaying && currentTrack ? 1 : 0;
      levelRef.current += (target - levelRef.current) * 0.06;
      const level = levelRef.current;

      const analyser = getAnalyser();
      let hasRealData = false;
      if (analyser) {
        if (!freqData || freqData.length !== analyser.frequencyBinCount) {
          freqData = new Uint8Array(analyser.frequencyBinCount);
        }
        analyser.getByteFrequencyData(freqData);
        // Cross-origin / tainted streams report all-zero data; detect that.
        for (let i = 0; i < freqData.length; i += 1) {
          if (freqData[i] > 0) {
            hasRealData = true;
            break;
          }
        }
      }

      const t = now / 1000;
      // ~120bpm beat envelope for the simulated fallback.
      const beat = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2)), 6);

      const heights = heightsRef.current;
      for (let i = 0; i < BARS_PER_SIDE; i += 1) {
        let value;
        if (hasRealData) {
          // Sample the lower ~75% of the spectrum, where music lives.
          const bin = Math.floor((i / BARS_PER_SIDE) * freqData.length * 0.75);
          value = freqData[bin] / 255;
        } else {
          // Layered sines + beat pulse make a lively, music-like wave.
          const wave =
            0.5 +
            0.28 * Math.sin(t * 3.1 + i * 0.55) +
            0.18 * Math.sin(t * 1.7 - i * 0.31) +
            0.12 * Math.sin(t * 5.3 + i * 0.9);
          value = Math.max(0, wave) * (0.45 + 0.55 * beat);
        }

        // Taper the ends so the wave reads as a rounded envelope.
        const taper = Math.sin((i / (BARS_PER_SIDE - 1)) * Math.PI * 0.5 + 0.15);
        value *= 0.35 + 0.65 * (1 - i / BARS_PER_SIDE) * taper + 0.2;
        value = Math.min(1, value) * level;

        // Smooth toward the target height for fluid motion.
        heights[i] += (value - heights[i]) * (value > heights[i] ? 0.5 : 0.12);
      }

      // Fully idle: nothing playing and the strip has finished fading out. Stop
      // the loop entirely so we don't burn a rAF tick 60x/sec doing nothing. It
      // is restarted the moment playback resumes (see the store subscription).
      if (level < 0.005 && target === 0) {
        running = false;
        return;
      }
      if (level < 0.005) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const totalBars = BARS_PER_SIDE * 2;
      const gap = 2;
      const barWidth = Math.max(1, (w - gap * (totalBars - 1)) / totalBars);
      const maxBarHeight = h * 0.92;

      const gradient = ctx.createLinearGradient(0, h, 0, 0);
      gradient.addColorStop(0, "rgba(124, 58, 237, 0.35)");
      gradient.addColorStop(0.5, "rgba(236, 72, 153, 0.85)");
      gradient.addColorStop(1, "rgba(34, 211, 238, 1)");
      ctx.fillStyle = gradient;
      // No canvas shadowBlur here: blurring ~84 rounded bars every frame is
      // extremely expensive (especially on phones). The vertical gradient alone
      // reads as a glow; the container's own styling adds any ambient bloom.

      for (let b = 0; b < totalBars; b += 1) {
        // Mirror around the centre: index 0 at the middle, growing outward.
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

      rafRef.current = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running) return;
      running = true;
      rafRef.current = requestAnimationFrame(draw);
    };

    // Drive the loop from playback state: kick it on play, and let draw() park
    // itself once the strip has eased out after a pause/stop.
    const unsubscribe = usePlayerStore.subscribe((state) => {
      if (state.isPlaying) start();
    });
    if (usePlayerStore.getState().isPlaying) start();

    return () => {
      ro.disconnect();
      unsubscribe();
      cancelAnimationFrame(rafRef.current);
      running = false;
    };
  }, []);

  if (variant === "inline") {
    return (
      <div className="pointer-events-none relative h-full w-full overflow-hidden">
        <canvas ref={canvasRef} className="relative h-full w-full" />
      </div>
    );
  }

  // Ambient: a tall, bright reactive strip spanning the whole window bottom.
  // z-20 keeps it above page content but below the mini-player (z-30) and bottom
  // nav (z-40) so those controls stay usable. Only a soft top fade blends it into
  // the page — no heavy bottom gradient, so the bars stay vivid at their base.
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-56 overflow-hidden sm:h-72">
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-slate-950 to-transparent" />
      <canvas ref={canvasRef} className="relative h-full w-full" />
    </div>
  );
}
