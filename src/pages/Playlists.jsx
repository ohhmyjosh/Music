import { useState } from "react";
import { Plus } from "lucide-react";
import { useLibraryStore } from "../store/libraryStore";
import { waveboxSeeds } from "../utils/normalizeTrack";
import PlaylistCard from "../components/music/PlaylistCard";

export default function Playlists() {
  const [name, setName] = useState("");
  const playlists = useLibraryStore((state) => state.playlists);
  const createPlaylist = useLibraryStore((state) => state.createPlaylist);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">Collections</p>
          <h1 className="font-display text-2xl font-semibold text-white">Playlists</h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-accent-400"
          onClick={async () => {
            const nextName = name.trim() || `Playlist ${playlists.length + 1}`;
            await createPlaylist(nextName);
            setName("");
          }}
        >
          <Plus size={14} />
          Create playlist
        </button>
      </div>

      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Name your playlist"
        className="w-full rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {playlists.map((playlist, index) => (
          <PlaylistCard
            key={playlist.id}
            title={playlist.name}
            subtitle={playlist.description || `${playlist.trackIds.length} tracks`}
            artwork={waveboxSeeds[index % waveboxSeeds.length].artwork}
            tracks={waveboxSeeds}
            accent={index % 2 === 0 ? "from-emerald-400/20 to-lime-300/10" : "from-fuchsia-400/20 to-orange-300/10"}
          />
        ))}
      </div>
    </div>
  );
}
