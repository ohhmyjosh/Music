import { createCover } from "../../data/demoArt";
import { Play } from "lucide-react";
import { usePlayerStore } from "../../store/playerStore";

const themeMap = {
  Pop: {
    glow: "shadow-[0_20px_48px_rgba(236,72,153,0.22)]",
    chip: "text-pink-200"
  },
  Rap: {
    glow: "shadow-[0_20px_48px_rgba(249,115,22,0.18)]",
    chip: "text-orange-200"
  },
  "Hip-Hop": {
    glow: "shadow-[0_20px_48px_rgba(249,115,22,0.18)]",
    chip: "text-orange-200"
  },
  "R&B": {
    glow: "shadow-[0_20px_48px_rgba(168,85,247,0.2)]",
    chip: "text-violet-200"
  },
  "Lo-fi": {
    glow: "shadow-[0_20px_48px_rgba(14,165,233,0.18)]",
    chip: "text-cyan-200"
  },
  Hindi: {
    glow: "shadow-[0_20px_48px_rgba(234,88,12,0.18)]",
    chip: "text-amber-200"
  },
  Workout: {
    glow: "shadow-[0_20px_48px_rgba(220,38,38,0.18)]",
    chip: "text-rose-200"
  },
  Radio: {
    glow: "shadow-[0_20px_48px_rgba(29,185,84,0.2)]",
    chip: "text-emerald-200"
  }
};

export default function PlaylistCard({
  title,
  subtitle,
  artwork,
  image,
  tracks = [],
  accent = "from-emerald-400/20 to-lime-300/10",
  onOpen,
  badge = "Playlist",
  meta = "",
  compact = false
}) {
  const setQueue = usePlayerStore((state) => state.setQueue);
  const setTrack = usePlayerStore((state) => state.setTrack);
  const cover = artwork || image || createCover(title);
  const theme = themeMap[meta] || themeMap[badge] || {
    glow: "shadow-[0_20px_48px_rgba(29,185,84,0.16)]",
    chip: "text-accent-200"
  };

  const handlePlay = (event) => {
    event.stopPropagation();
    if (!tracks.length) return;
    setQueue(tracks);
    setTrack(tracks[0], tracks);
  };

  return (
    <article
      className={[
        "group min-w-[150px] cursor-pointer rounded-[24px] border border-white/10 bg-white/[0.035] p-2.5 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.06]",
        compact ? "w-[158px]" : "w-[170px] sm:w-[184px]"
      ].join(" ")}
      onClick={onOpen}
    >
      <div
        className={`relative aspect-square overflow-hidden rounded-[20px] bg-gradient-to-br ${accent} ${theme.glow}`}
      >
        <img
          src={cover}
          alt={title}
          onError={(event) => {
            const fallback = createCover(title);
            if (event.currentTarget.src !== fallback) {
              event.currentTarget.src = fallback;
            }
          }}
          className="h-full w-full object-cover opacity-[0.95] transition duration-500 group-hover:scale-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent" />
        <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-white/80">
          {badge}
        </div>
        {meta ? (
          <div className="absolute bottom-3 left-3 right-16">
            <p className={`truncate text-[11px] uppercase tracking-[0.18em] ${theme.chip}`}>{meta}</p>
          </div>
        ) : null}
        <button
          className="absolute bottom-3 right-3 translate-y-1 rounded-full bg-accent-500 p-2.5 text-slate-950 opacity-100 shadow-[0_10px_30px_rgba(29,185,84,0.4)] transition duration-300 hover:scale-105 hover:bg-accent-400 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
          onClick={handlePlay}
        >
          <Play size={16} fill="currentColor" />
        </button>
      </div>
      <div className="px-1 pb-1 pt-3">
        <p className="line-clamp-2 text-sm font-semibold leading-5 text-white">{title}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{subtitle}</p>
      </div>
    </article>
  );
}
