import { useMemo, useRef, useState } from "react";
import { FolderUp } from "lucide-react";
import { useLibraryStore } from "../store/libraryStore";
import { usePlayerStore } from "../store/playerStore";
import { demoTracks } from "../data/demoTracks";
import { demoPlaylists } from "../data/demoPlaylists";
import { normalizeTrack } from "../utils/normalizeTrack";
import GenreChip from "../components/music/GenreChip";
import PlaylistCard from "../components/music/PlaylistCard";
import TrackRow from "../components/music/TrackRow";

const filters = ["Playlists", "Songs", "Albums", "Downloads", "Local files"];
const tracks = demoTracks.map((track) => normalizeTrack(track, "demo"));

export default function Library() {
  const [activeFilter, setActiveFilter] = useState("Playlists");
  const fileInputRef = useRef(null);
  const offlineTracks = useLibraryStore((state) => state.offlineTracks);
  const importLocalTrack = useLibraryStore((state) => state.importLocalTrack);
  const recentlyPlayed = usePlayerStore((state) => state.recentlyPlayed);
  const likedTrackIds = usePlayerStore((state) => state.likedTrackIds);

  const cards = useMemo(
    () => [
      { title: "Liked Songs", subtitle: `${likedTrackIds.length} saved favorites`, artwork: tracks[0].artwork, tracks: tracks.filter((track) => likedTrackIds.includes(track.id)) },
      { title: "Downloads", subtitle: `${offlineTracks.length} saved inside the app`, artwork: offlineTracks[0]?.artwork || tracks[1].artwork, tracks: offlineTracks },
      { title: "Local Files", subtitle: "Your imported audio", artwork: offlineTracks[1]?.artwork || tracks[2].artwork, tracks: offlineTracks },
      { title: "Recently Played", subtitle: "Jump back into your queue", artwork: recentlyPlayed[0]?.artwork || tracks[3].artwork, tracks: recentlyPlayed.length ? recentlyPlayed : tracks },
      { title: "Starter Mix", subtitle: "Mainstream-inspired demo picks", artwork: demoPlaylists[0].image, tracks: demoPlaylists[0].tracks.map((track) => normalizeTrack(track, "demo")) }
    ],
    [likedTrackIds, offlineTracks, recentlyPlayed]
  );

  const rowTracks = offlineTracks.length ? offlineTracks : recentlyPlayed.length ? recentlyPlayed : tracks;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">Your collection</p>
          <h1 className="font-display text-2xl font-semibold text-white">Library</h1>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={async (event) => {
              const files = Array.from(event.target.files || []);
              for (const file of files) {
                await importLocalTrack(file);
              }
              event.target.value = "";
            }}
          />
          <button
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white transition hover:bg-white/10"
            onClick={() => fileInputRef.current?.click()}
          >
            <FolderUp size={14} />
            Import audio
          </button>
        </div>
      </div>

      <div className="feed-scroll flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <GenreChip key={filter} label={filter} active={filter === activeFilter} onClick={() => setActiveFilter(filter)} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {cards.map((card, index) => (
          <PlaylistCard
            key={card.title}
            title={card.title}
            subtitle={card.subtitle}
            artwork={card.artwork}
            tracks={card.tracks.length ? card.tracks : tracks}
            badge="Library"
            accent={index % 2 === 0 ? "from-emerald-400/20 to-lime-300/10" : "from-cyan-400/20 to-blue-400/10"}
            onOpen={() => window.alert("Collection view coming soon.")}
          />
        ))}
      </div>

      <div className="space-y-3">
        {rowTracks.slice(0, 6).map((track) => (
          <TrackRow key={track.id} track={track} queue={rowTracks} showSource={false} />
        ))}
      </div>
    </div>
  );
}
