import { Trash2 } from "lucide-react";
import TrackCard from "../music/TrackCard";
import { useLibraryStore } from "../../store/libraryStore";

export default function OfflineTrackList({ tracks = [] }) {
  const removeTrack = useLibraryStore((state) => state.removeOfflineTrack);

  if (!tracks.length) {
    return (
      <div className="glass-panel rounded-[28px] p-8 text-sm text-slate-400">
        No offline tracks yet. Save tracks from approved download sources or import your own files.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tracks.map((track) => (
        <div key={track.id} className="relative">
          <TrackCard track={track} queue={tracks} compact />
          <button
            className="absolute right-4 top-4 rounded-full border border-white/10 p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
            onClick={() => removeTrack(track.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
