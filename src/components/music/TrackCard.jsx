import { Download, Heart, Play, Plus } from "lucide-react";
import clsx from "clsx";
import Artwork from "../media/Artwork";
import { usePlayerStore } from "../../store/playerStore";
import { useLibraryStore } from "../../store/libraryStore";

export default function TrackCard({ track, queue = [], compact = false }) {
  const setTrack = usePlayerStore((state) => state.setTrack);
  const likedTrackIds = usePlayerStore((state) => state.likedTrackIds);
  const toggleLike = usePlayerStore((state) => state.toggleLike);
  const saveTrackOffline = useLibraryStore((state) => state.saveTrackOffline);
  const playlists = useLibraryStore((state) => state.playlists);
  const addTrackToPlaylist = useLibraryStore((state) => state.addTrackToPlaylist);

  const liked = likedTrackIds.includes(track.id);
  const canSaveOffline = Boolean(track.downloadUrl || track.localOnly);

  return (
    <article
      className={clsx(
        "app-surface flex gap-3 rounded-[22px] border border-white/10 p-3 text-left",
        compact ? "min-w-[240px] items-center" : "min-w-[170px] flex-col"
      )}
    >
      <Artwork
        src={track.artwork}
        alt={track.title}
        artist={track.artist}
        title={track.title}
        className={clsx(compact ? "h-16 w-16 rounded-2xl" : "aspect-square w-full rounded-[20px]")}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{track.title}</p>
            <p className="truncate text-xs text-slate-400">{track.artist}</p>
          </div>
          <button className="rounded-full p-1.5 text-slate-500 hover:text-rose-400" onClick={() => toggleLike(track)}>
            <Heart size={15} fill={liked ? "currentColor" : "none"} className={liked ? "text-rose-400" : ""} />
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
          <span className="rounded-full bg-white/5 px-2 py-1">{track.genre}</span>
          <span className="rounded-full bg-white/5 px-2 py-1">{track.source}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-1.5 rounded-full bg-accent-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-accent-400"
            onClick={() => setTrack(track, queue.length ? queue : [track])}
          >
            <Play size={13} fill="currentColor" />
            Play
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5 disabled:opacity-40"
            onClick={() => saveTrackOffline(track)}
            disabled={!canSaveOffline}
          >
            <Download size={13} />
            Save
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5"
            onClick={() => playlists[0] && addTrackToPlaylist(playlists[0].id, track.id)}
          >
            <Plus size={13} />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}

