import TrackRow from "../music/TrackRow";
import TrackCard from "../music/TrackCard";
import PlaylistCard from "../music/PlaylistCard";

export default function SearchResults({ tracks = [] }) {
  if (!tracks.length) {
    return (
      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-slate-400">
        Try a mood, artist, genre, or keyword to discover tracks.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {tracks.slice(0, 5).map((track) => (
          <TrackRow key={track.id} track={track} queue={tracks} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {tracks.slice(0, 4).map((track) => (
          <TrackCard key={`${track.id}-card`} track={track} queue={tracks} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {tracks.slice(0, 4).map((track, index) => (
          <PlaylistCard
            key={`${track.id}-playlist`}
            title={`${track.mood || track.genre} Radio`}
            subtitle={`${track.artist} and more free picks`}
            artwork={track.artwork}
            tracks={tracks.slice(index, index + 4)}
            accent={index % 2 === 0 ? "from-emerald-400/20 to-lime-300/10" : "from-cyan-400/20 to-blue-400/10"}
          />
        ))}
      </div>
    </div>
  );
}
