import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { fetchLyrics } from "../../api/lyrics";
import { usePlaybackClock, usePlayerStore } from "../../store/playerStore";

// Index of the line being sung: the last line whose timestamp has passed.
function activeLine(lines, time) {
  let lo = 0;
  let hi = lines.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].time <= time + 0.25) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

function SyncedLyrics({ lines }) {
  const currentTime = usePlaybackClock((state) => state.currentTime);
  const seekTo = usePlayerStore((state) => state.seekTo);
  const active = useMemo(() => activeLine(lines, currentTime), [lines, currentTime]);
  const container = useRef(null);
  const [userScrolled, setUserScrolled] = useState(false);

  // Follow the song unless the listener is reading ahead; resume after a pause.
  useEffect(() => {
    if (!userScrolled) {
      container.current
        ?.querySelector(`[data-line="${active}"]`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [active, userScrolled]);

  useEffect(() => {
    if (!userScrolled) return undefined;
    const id = setTimeout(() => setUserScrolled(false), 4000);
    return () => clearTimeout(id);
  }, [userScrolled]);

  return (
    <div
      ref={container}
      className="h-full overflow-y-auto px-2 py-[30%]"
      onWheel={() => setUserScrolled(true)}
      onTouchMove={() => setUserScrolled(true)}
    >
      {lines.map((line, i) => (
        <button
          key={`${line.time}-${i}`}
          data-line={i}
          onClick={() => seekTo(line.time)}
          className={clsx(
            "block w-full py-2 text-left text-2xl font-bold leading-snug transition-all duration-300 hover:text-white",
            i === active ? "scale-[1.02] text-white" : i < active ? "text-white/40" : "text-white/30"
          )}
        >
          {line.text || "♪"}
        </button>
      ))}
    </div>
  );
}

export default function LyricsPanel() {
  const track = usePlayerStore((state) => state.currentTrack);
  const { data, isLoading } = useQuery({
    queryKey: ["lyrics", track?.id],
    queryFn: () => fetchLyrics(track),
    enabled: Boolean(track),
    staleTime: Infinity,
    retry: 1
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[80, 60, 90, 50, 70].map((width) => (
          <div key={width} className="skeleton h-6 rounded" style={{ width: `${width}%` }} />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-yt-muted">
        Lyrics aren't available for this song.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        {data.synced ? (
          <SyncedLyrics lines={data.synced} />
        ) : (
          <p className="h-full overflow-y-auto whitespace-pre-line px-2 py-4 text-lg leading-8 text-white/90">
            {data.plain}
          </p>
        )}
      </div>
      <p className="px-2 py-3 text-xs text-yt-dim">
        Source: {data.source === "lrclib" ? "LRCLIB" : "lyrics.ovh"}
      </p>
    </div>
  );
}
