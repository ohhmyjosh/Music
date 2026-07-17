import { Heart, Play } from "lucide-react";
import clsx from "clsx";
import Artwork from "../media/Artwork";
import { usePlayerStore } from "../../store/playerStore";

export default function TrackRow({ track, queue = [], showSource = true }) {
  const setTrack = usePlayerStore((state) => state.setTrack);
  const toggleLike = usePlayerStore((state) => state.toggleLike);
  const liked = usePlayerStore((state) => state.likedTrackIds.includes(track.id));
  const isCurrent = usePlayerStore((state) => state.currentTrack?.id === track.id);

  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition",
        isCurrent
          ? "border-accent-400/40 bg-accent-500/10"
          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
      )}
    >
      <Artwork src={track.artwork} alt={track.title} artist={track.artist} title={track.title} className="h-12 w-12 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className={clsx("truncate text-sm font-semibold", isCurrent ? "text-accent-300" : "text-white")}>{track.title}</p>
        <p className="truncate text-xs text-slate-400">
          {track.artist}{showSource ? ` - ${track.genre} - ${track.source}` : ` - ${track.genre}`}
        </p>
      </div>
      <button
        className="rounded-full bg-accent-500 p-2 text-slate-950 transition hover:bg-accent-400"
        aria-label={`Play ${track.title}`}
        onClick={() => setTrack(track, queue.length ? queue : [track])}
      >
        <Play size={14} fill="currentColor" />
      </button>
      <button
        className={clsx(
          "rounded-full p-2 transition hover:bg-white/5",
          liked ? "text-rose-400" : "text-slate-400 hover:text-white"
        )}
        aria-label={liked ? "Remove from liked songs" : "Add to liked songs"}
        onClick={() => toggleLike(track)}
      >
        <Heart size={16} fill={liked ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
