import { fetchAudiusTrending } from "./audius";
import { fetchJamendoTrending } from "./jamendo";
import { getRecommendationScore } from "../utils/ranking";

export async function fetchRecommendations(seedTrack) {
  const [jamendo, audius] = await Promise.allSettled([
    fetchJamendoTrending(),
    fetchAudiusTrending()
  ]);

  const candidates = [
    ...(jamendo.status === "fulfilled" ? jamendo.value : []),
    ...(audius.status === "fulfilled" ? audius.value : [])
  ].filter((track) => track.id !== seedTrack?.id);

  if (!seedTrack) {
    return candidates.slice(0, 6);
  }

  return candidates
    .map((track) => ({
      track,
      score: getRecommendationScore(seedTrack, track)
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 6)
    .map(({ track }) => track);
}
