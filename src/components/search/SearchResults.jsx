import TrackCard from "../music/TrackCard";

export default function SearchResults({ tracks = [] }) {
  if (!tracks.length) {
    return (
      <div className="glass-panel rounded-[28px] p-8 text-center text-sm text-slate-400">
        Try a mood, artist, genre, or keyword to discover tracks.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tracks.map((track) => (
        <TrackCard key={track.id} track={track} queue={tracks} />
      ))}
    </div>
  );
}
