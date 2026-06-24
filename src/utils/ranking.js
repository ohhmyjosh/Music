export function rankTracks(query, tracks = []) {
  const normalized = query.trim().toLowerCase();

  return [...tracks]
    .map((track) => {
      const haystack = [
        track.title,
        track.artist,
        track.album,
        track.genre,
        ...(track.tags || [])
      ]
        .join(" ")
        .toLowerCase();

      const score = normalized
        ? haystack.includes(normalized)
          ? 100 + normalized.length
          : (track.tags || []).filter((tag) => tag.includes(normalized)).length * 15
        : 1;

      return { track, score };
    })
    .sort((left, right) => right.score - left.score)
    .map(({ track }) => track);
}

export function getRecommendationScore(seedTrack, candidate) {
  let score = 0;

  if (seedTrack.genre === candidate.genre) score += 30;
  if (seedTrack.artist === candidate.artist) score += 10;

  for (const tag of seedTrack.tags || []) {
    if ((candidate.tags || []).includes(tag)) score += 12;
  }

  if (seedTrack.mood === candidate.mood) score += 16;

  return score;
}
