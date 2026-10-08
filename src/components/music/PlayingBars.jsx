import clsx from "clsx";

// The little bouncing equalizer YouTube Music draws over the playing song.
export default function PlayingBars({ paused = false, className }) {
  return (
    <span className={clsx("flex h-4 items-end gap-[2px]", className)} aria-hidden="true">
      {[0, 200, 400, 100].map((delay) => (
        <span
          key={delay}
          className={clsx("h-full w-[3px] origin-bottom rounded-sm bg-white", !paused && "animate-eq")}
          style={{ animationDelay: `${delay}ms`, transform: paused ? "scaleY(0.35)" : undefined }}
        />
      ))}
    </span>
  );
}
