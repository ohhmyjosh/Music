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
