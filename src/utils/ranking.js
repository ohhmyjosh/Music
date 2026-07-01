export function rankTracks(query, tracks = []) {
  const normalized = query.trim().toLowerCase();

  return [...tracks]
    .map((track) => {
      const haystack = [
        track.title,
        track.artist,
        track.album,
        track.genre,
        track.mood,
        track.source,
        ...(track.tags || [])
      ]
        .join(" ")
        .toLowerCase();

      const score = normalized
        ? haystack.includes(normalized)
          ? 120 + normalized.length
          : (track.tags || []).filter((tag) => tag.toLowerCase().includes(normalized)).length * 20
        : (track.popularity || 1);

      return { track, score };
    })
    .sort((left, right) => right.score - left.score)
    .map(({ track }) => track);
}

export function getRecommendationScore(seedTrack, candidate) {
  let score = 0;

  if (seedTrack.genre === candidate.genre) score += 30;
  if (seedTrack.artist === candidate.artist) score += 10;
  if (seedTrack.mood === candidate.mood) score += 16;
  if (seedTrack.album === candidate.album) score += 14;

  for (const tag of seedTrack.tags || []) {
    if ((candidate.tags || []).includes(tag)) score += 12;
  }

  score += Math.floor((candidate.popularity || 0) / 10);

  return score;
}

// ---------------------------------------------------------------------------
// Taste modelling
//
// A "taste profile" is a weighted tally of the genres, artists, moods and tags
// across the songs a listener actually engages with. Liked songs count more
// than passively played ones, and recent plays count more than older ones.
// ---------------------------------------------------------------------------

function addWeight(bucket, key, weight) {
  if (!key) return;
  bucket[key] = (bucket[key] || 0) + weight;
}

function accumulate(profile, track, weight) {
  addWeight(profile.genres, track.genre, weight);
  addWeight(profile.artists, track.artist, weight);
  addWeight(profile.moods, track.mood, weight);
  for (const tag of track.tags || []) addWeight(profile.tags, tag, weight * 0.6);
  profile.total += weight;
}

// likedTracks: songs the user hearted (strong signal).
// history: recently played, ordered most-recent first (decaying signal).
export function buildTasteProfile({ likedTracks = [], history = [] } = {}) {
  const profile = { genres: {}, artists: {}, moods: {}, tags: {}, total: 0 };

  for (const track of likedTracks) accumulate(profile, track, 3);

  history.forEach((track, index) => {
    // Recency decay: most recent play ~2.0, tapering toward ~0.5.
    const weight = 0.5 + 1.5 * Math.max(0, 1 - index / Math.max(history.length, 1));
    accumulate(profile, track, weight);
  });

  return profile;
}

export function isEmptyProfile(profile) {
  return !profile || profile.total === 0;
}

// How well a candidate matches the listener's overall taste (0+).
export function scoreAgainstProfile(profile, candidate) {
  if (isEmptyProfile(profile)) return 0;

  let score = 0;
  score += (profile.genres[candidate.genre] || 0) * 8;
  score += (profile.artists[candidate.artist] || 0) * 5;
  score += (profile.moods[candidate.mood] || 0) * 4;
  for (const tag of candidate.tags || []) {
    score += (profile.tags[tag] || 0) * 3;
  }

  // Normalise by engagement volume so a big history doesn't dwarf the seed
  // similarity signal, then fold in a light popularity prior.
  score = score / profile.total;
  score += Math.floor((candidate.popularity || 0) / 20);

  return score;
}
