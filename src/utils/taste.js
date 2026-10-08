// What the listener is into, derived from what they actually do on this device:
// likes count most, then plays (weighted by play count and recency).
//
// Returns the top artists, each with a representative song that can seed a
// radio — that's what "Mixed for you" and "Quick picks" are built from.
export function topArtists({ liked = [], history = [], playCounts = {} }, limit = 6) {
  const scores = new Map();

  const credit = (track, weight) => {
    const artist = track.artists?.[0];
    if (!artist?.id) return;
    const entry = scores.get(artist.id) || { id: artist.id, name: artist.name, score: 0, seed: track };
    entry.score += weight;
    scores.set(artist.id, entry);
  };

  liked.forEach((track) => credit(track, 3));
  history.forEach((entry, index) => {
    const recency = Math.max(0.2, 1 - index / 100);
    credit(entry.track, (1 + Math.log2(1 + (playCounts[entry.track.id] || 1))) * recency);
  });

  return [...scores.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

// The song to seed Quick picks from: the most recent play, else a liked song.
export function quickPicksSeed({ liked = [], history = [] }) {
  return history[0]?.track || liked[0] || null;
}
