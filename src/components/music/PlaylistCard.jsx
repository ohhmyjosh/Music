import { Play } from "lucide-react";
import { usePlayerStore } from "../../store/playerStore";

export default function PlaylistCard({ title, subtitle, artwork, tracks = [], accent = "from-emerald-400/20 to-lime-300/10" }) {
  const setQueue = usePlayerStore((state) => state.setQueue);
  const setTrack = usePlayerStore((state) => state.setTrack);

  const handlePlay = () => {
    if (!tracks.length) return;
    setQueue(tracks);
    setTrack(tracks[0], tracks);
  };

  return (
    <article className="min-w-[165px] rounded-[22px] border border-white/10 bg-white/[0.04] p-3">
      <div className={`relative overflow-hidden rounded-[18px] bg-gradient-to-br ${accent}`}>
        <img src={artwork} alt={title} className="h-36 w-full object-cover opacity-90" />
        <button
          className="absolute bottom-3 right-3 rounded-full bg-accent-500 p-2.5 text-slate-950 transition hover:bg-accent-400"
          onClick={handlePlay}
        >
          <Play size={16} fill="currentColor" />
        </button>
      </div>
      <p className="mt-3 truncate text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 line-clamp-2 text-xs text-slate-400">{subtitle}</p>
    </article>
  );
}

