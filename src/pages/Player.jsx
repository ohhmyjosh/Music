import { useQuery } from "@tanstack/react-query";
import FullPlayer from "../components/player/FullPlayer";
import { fetchLyrics } from "../api/lyrics";
import { fetchRecommendations } from "../api/recommendations";
import { usePlayerStore } from "../store/playerStore";

export default function PlayerPage() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);

  const { data: lyrics } = useQuery({
    queryKey: ["lyrics", currentTrack?.id],
    queryFn: () => fetchLyrics(currentTrack),
    enabled: Boolean(currentTrack)
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ["player-recommendations", currentTrack?.id],
    queryFn: () => fetchRecommendations(currentTrack),
    enabled: Boolean(currentTrack)
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-400">Player</p>
        <h1 className="font-display text-2xl font-semibold text-white">Now playing</h1>
      </div>
      <FullPlayer lyrics={lyrics} recommendations={recommendations} />
    </div>
  );
}
