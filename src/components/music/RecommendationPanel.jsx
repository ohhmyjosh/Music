import TrackCard from "./TrackCard";

export default function RecommendationPanel({ tracks = [] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {tracks.length ? (
        tracks.map((track) => <TrackCard key={track.id} track={track} queue={tracks} compact />)
      ) : (
        <div className="glass-panel rounded-[28px] p-6 text-sm leading-7 text-slate-400">
          Recommendations will appear here once a source or personalization model is connected.
        </div>
      )}
    </div>
  );
}
