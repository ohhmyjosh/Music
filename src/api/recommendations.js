import { normalizeTrack } from "../utils/normalizeTrack";
import { demoTracks } from "../data/demoTracks";
import { getRecommendationScore } from "../utils/ranking";

const catalog = demoTracks.map((track) => normalizeTrack(track, "demo"));

export async function fetchRecommendations(seedTrack) {
  const candidates = catalog.filter((track) => track.id !== seedTrack?.id);

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
