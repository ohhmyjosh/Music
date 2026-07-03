import { MoreVertical, Play } from "lucide-react";
import Artwork from "../media/Artwork";
import { usePlayerStore } from "../../store/playerStore";

export default function TrackRow({ track, queue = [], showSource = true }) {
  const setTrack = usePlayerStore((state) => state.setTrack);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
      <Artwork src={track.artwork} alt={track.title} artist={track.artist} title={track.title} className="h-12 w-12 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{track.title}</p>
        <p className="truncate text-xs text-slate-400">
          {track.artist}{showSource ? ` - ${track.genre} - ${track.source}` : ` - ${track.genre}`}
        </p>
      </div>
      <button
        className="rounded-full bg-accent-500 p-2 text-slate-950 transition hover:bg-accent-400"
        onClick={() => setTrack(track, queue.length ? queue : [track])}
      >
        <Play size={14} fill="currentColor" />
      </button>
      <button
        className="rounded-full p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
        onClick={() => window.alert("Track actions coming soon.")}
      >
        <MoreVertical size={16} />
      </button>
    </div>
  );
}
