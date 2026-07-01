import { normalizeTrack } from "../utils/normalizeTrack";
import { demoTracks } from "../data/demoTracks";
import {
  buildTasteProfile,
  getRecommendationScore,
  isEmptyProfile,
  scoreAgainstProfile
} from "../utils/ranking";

const catalog = demoTracks.map((track) => normalizeTrack(track, "demo"));

// fetchRecommendations blends two signals:
//   1. Similarity to the song currently playing (the seed).
//   2. The listener's overall taste profile, built from the songs they've liked
//      and recently played.
// When there is no taste history yet it falls back to pure seed similarity, and
// with neither seed nor history it returns a popular slice of the catalog.
export async function fetchRecommendations(seedTrack, { likedTracks = [], history = [] } = {}) {
  const profile = buildTasteProfile({ likedTracks, history });
  const hasProfile = !isEmptyProfile(profile);

  // Don't recommend the seed itself or songs the user has already liked.
  const likedIds = new Set(likedTracks.map((track) => track.id));
  const candidates = catalog.filter(
    (track) => track.id !== seedTrack?.id && !likedIds.has(track.id)
  );

  if (!seedTrack && !hasProfile) {
    return candidates.slice(0, 6);
  }

  return candidates
    .map((track) => {
      const seedScore = seedTrack ? getRecommendationScore(seedTrack, track) : 0;
      const tasteScore = hasProfile ? scoreAgainstProfile(profile, track) : 0;
      // Seed steers the "up next" feel; taste keeps it in the listener's lane.
      return { track, score: seedScore + tasteScore * 1.5 };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 6)
    .map(({ track }) => track);
}
