import { Download, Heart, Play, Plus } from "lucide-react";
import clsx from "clsx";
import { usePlayerStore } from "../../store/playerStore";
import { useLibraryStore } from "../../store/libraryStore";

function formatDuration(seconds) {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

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
        "group glass-panel flex gap-4 rounded-[28px] p-4 transition hover:-translate-y-1 hover:bg-white/[0.07]",
        compact ? "items-center" : "flex-col"
      )}
    >
      <img
        src={track.artwork}
        alt={track.title}
        className={clsx("rounded-3xl object-cover", compact ? "h-16 w-16" : "aspect-square w-full")}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-white">{track.title}</p>
            <p className="truncate text-sm text-slate-400">{track.artist}</p>
          </div>
          <button className="rounded-full p-2 text-slate-500 hover:text-rose-400" onClick={() => toggleLike(track.id)}>
            <Heart size={16} fill={liked ? "currentColor" : "none"} className={liked ? "text-rose-400" : ""} />
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="rounded-full bg-white/5 px-2.5 py-1">{track.genre}</span>
          <span>{formatDuration(track.duration)}</span>
          <span>{track.source}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-accent-300"
            onClick={() => setTrack(track, queue.length ? queue : [track])}
          >
            <Play size={14} />
            Play
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5"
            onClick={() => saveTrackOffline(track)}
            disabled={!canSaveOffline}
            title={
              canSaveOffline
                ? "Save for offline use"
                : "Offline save is only available for allowed downloads or local imports"
            }
          >
            <Download size={14} />
            Save
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5"
            onClick={() => playlists[0] && addTrackToPlaylist(playlists[0].id, track.id)}
          >
            <Plus size={14} />
            Playlist
          </button>
        </div>
      </div>
    </article>
  );
}
