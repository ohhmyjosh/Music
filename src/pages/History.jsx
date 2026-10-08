import { useMemo } from "react";
import SongRow from "../components/music/SongRow";
import { useLibraryStore } from "../store/libraryStore";
import { useUiStore } from "../store/uiStore";

function dayLabel(timestamp) {
  const day = new Date(timestamp);
  const today = new Date();
  const startOf = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diff = Math.round((startOf(today) - startOf(day)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return "This week";
  if (diff < 30) return "This month";
  return day.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

// Listening history grouped like YouTube Music: Today, Yesterday, This week...
export default function History() {
  const history = useLibraryStore((state) => state.history);
  const clearHistory = useLibraryStore((state) => state.clearHistory);
  const toast = useUiStore((state) => state.toast);

  const groups = useMemo(() => {
    const out = [];
    for (const entry of history) {
      const label = dayLabel(entry.playedAt);
      if (out[out.length - 1]?.label !== label) out.push({ label, tracks: [] });
      out[out.length - 1].tracks.push(entry.track);
    }
    return out;
  }, [history]);

  return (
    <div className="page pt-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">History</h1>
        {history.length ? (
          <button
            className="pill-outline"
            onClick={() => {
              clearHistory();
              toast("Listening history cleared");
            }}
          >
            Clear history
          </button>
        ) : null}
      </div>
      {groups.length ? (
        groups.map((group) => (
          <section key={group.label} className="mt-8">
            <h2 className="mb-2 text-xl font-bold">{group.label}</h2>
            {group.tracks.map((track, i) => (
              <SongRow
                key={track.id}
                track={track}
                tracks={group.tracks}
                position={i}
                from={{ label: "History", path: "/history" }}
              />
            ))}
          </section>
        ))
      ) : (
        <p className="py-16 text-center text-yt-muted">Songs you listen to will show up here.</p>
      )}
    </div>
  );
}
