import { useRef, useState } from "react";
import clsx from "clsx";
import { usePlaybackClock, usePlayerStore } from "../../store/playerStore";
import { formatTime } from "../../utils/track";

// Scrubbable progress bar. While dragging, the bar follows the pointer and the
// seek is committed on release, so the audio isn't re-seeked on every pixel.
// variant "edge"  -> the thin line along the top of the desktop player bar
// variant "full"  -> the bar in the mobile Now Playing screen
export default function ProgressBar({ variant = "edge", className }) {
  const currentTime = usePlaybackClock((state) => state.currentTime);
  const duration = usePlaybackClock((state) => state.duration);
  const buffered = usePlaybackClock((state) => state.buffered);
  const seekTo = usePlayerStore((state) => state.seekTo);
  const track = useRef(null);
  const [drag, setDrag] = useState(null); // seconds while dragging
  const [hover, setHover] = useState(null); // { x, time } for the tooltip

  const ratioAt = (clientX) => {
    const rect = track.current.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const shown = drag ?? currentTime;
  const pct = duration ? (shown / duration) * 100 : 0;
  const bufferedPct = duration ? Math.min(100, (buffered / duration) * 100) : 0;
  const edge = variant === "edge";

  return (
    <div
      ref={track}
      role="slider"
      tabIndex={0}
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(shown)}
      aria-valuetext={`${formatTime(shown)} of ${formatTime(duration)}`}
      className={clsx("group/progress relative flex cursor-pointer touch-none items-center", edge ? "h-4" : "h-6", className)}
      onPointerDown={(event) => {
        if (!duration) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        setDrag(ratioAt(event.clientX) * duration);
      }}
      onPointerMove={(event) => {
        if (!duration) return;
        const ratio = ratioAt(event.clientX);
        if (event.pointerType === "mouse") {
          const rect = track.current.getBoundingClientRect();
          setHover({ x: ratio * rect.width, time: ratio * duration });
        }
        if (drag !== null) setDrag(ratio * duration);
      }}
      onPointerUp={(event) => {
        if (drag === null) return;
        seekTo(ratioAt(event.clientX) * duration);
        setDrag(null);
      }}
      onPointerCancel={() => setDrag(null)}
      onPointerLeave={() => setHover(null)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") seekTo(Math.max(0, currentTime - 5));
        if (event.key === "ArrowRight") seekTo(Math.min(duration, currentTime + 5));
      }}
    >
      <div
        className={clsx(
          "relative w-full overflow-hidden rounded-full bg-white/20 transition-[height]",
          edge ? "h-[2px] group-hover/progress:h-1" : "h-1"
        )}
      >
        <div className="absolute inset-y-0 left-0 bg-white/25" style={{ width: `${bufferedPct}%` }} />
        <div className="absolute inset-y-0 left-0 bg-accent-500" style={{ width: `${pct}%` }} />
      </div>
      <div
        className={clsx(
          "pointer-events-none absolute h-3 w-3 -translate-x-1/2 rounded-full bg-accent-500 transition-opacity",
          drag !== null || !edge ? "opacity-100" : "opacity-0 group-hover/progress:opacity-100"
        )}
        style={{ left: `${pct}%` }}
      />
      {hover && edge ? (
        <div
          className="pointer-events-none absolute bottom-4 -translate-x-1/2 rounded bg-yt-menu px-2 py-1 text-xs tabular-nums shadow"
          style={{ left: hover.x }}
        >
          {formatTime(hover.time)}
        </div>
      ) : null}
    </div>
  );
}
