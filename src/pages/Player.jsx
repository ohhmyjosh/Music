import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import FullPlayer from "../components/player/FullPlayer";
import { fetchLyrics } from "../api/lyrics";
import { fetchRecommendations } from "../api/recommendations";
import { usePlayerStore } from "../store/playerStore";

export default function PlayerPage() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const recentlyPlayed = usePlayerStore((state) => state.recentlyPlayed);
  const likedTrackIds = usePlayerStore((state) => state.likedTrackIds);
  const queue = usePlayerStore((state) => state.queue);

  // Resolve liked track ids to full track objects from what we know about.
  const likedTracks = useMemo(() => {
    const pool = new Map();
    for (const track of [...recentlyPlayed, ...queue]) pool.set(track.id, track);
    return likedTrackIds.map((id) => pool.get(id)).filter(Boolean);
  }, [likedTrackIds, recentlyPlayed, queue]);

  const { data: lyrics } = useQuery({
    queryKey: ["lyrics", currentTrack?.id],
    queryFn: () => fetchLyrics(currentTrack),
    enabled: Boolean(currentTrack)
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: [
      "player-recommendations",
      currentTrack?.id,
      likedTrackIds.join(","),
      recentlyPlayed.map((track) => track.id).join(",")
    ],
    queryFn: () =>
      fetchRecommendations(currentTrack, { likedTracks, history: recentlyPlayed }),
    enabled: Boolean(currentTrack)
  });

  // Immersive, YT Music-style page: the player IS the page, no header above it.
  return <FullPlayer lyrics={lyrics} recommendations={recommendations} />;
}
