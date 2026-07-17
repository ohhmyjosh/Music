// Markers that identify a track as a remix/edit rather than the original. When
// the user's own query contains one of these, they clearly WANT that variant, so
// we don't penalise it — otherwise we push these below the closest-to-original.
const REMIX_MARKERS = [
  "remix", "bootleg", "flip", "mashup", "mash-up", "cover", "tribute",
  "rework", "refix", "re-fix", "vip mix", "screwed", "chopped",
  "slowed", "sped up", "spedup", "nightcore", "8d audio", "reverb mix",
  "instrumental", "karaoke", "edit", "re-edit", "extended mix"
];

// Word-boundary matchers so "edit" flags "(Club Edit)" but never "Editors",
// and "cover" flags "Acoustic Cover" but never "Undercover".
const REMIX_PATTERNS = REMIX_MARKERS.map(
  (marker) =>
    new RegExp(`\\b${marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")
);

function remixHaystack(track) {
  return [track.title || "", (track.tags || []).join(" ")].join(" ");
}

// Is this upload a remix/edit/cover rather than the original recording?
export function isRemixLike(track) {
  const haystack = remixHaystack(track);
  return REMIX_PATTERNS.some((pattern) => pattern.test(haystack));
}

// Did the searcher explicitly ask for a remix-type variant?
export function queryWantsRemix(query = "") {
  const q = query.trim();
  return q ? REMIX_PATTERNS.some((pattern) => pattern.test(q)) : false;
}

// Hard partition for search: originals stay in the main list, remix-type
// uploads move to a separate bucket the UI reveals only on request. When the
// query itself asks for a remix ("xyz slowed", "abc remix") nothing is hidden.
export function splitRemixes(query, tracks = []) {
  if (queryWantsRemix(query)) return { originals: tracks, remixes: [] };
  const originals = [];
  const remixes = [];
  for (const track of tracks) {
    (isRemixLike(track) ? remixes : originals).push(track);
  }
  return { originals, remixes };
}

// Ranks live search results so the closest-to-original tracks land on top and
// remixes/bootlegs/covers sink, unless the query explicitly asked for a variant.
// Audius returns results in its own relevance order, which surfaces flips and
// tributes above the real thing — this reorders that.
export function rankSearchResults(query, tracks = []) {
  const q = query.trim().toLowerCase();
  const wantsRemix = queryWantsRemix(query);
  const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

  return [...tracks]
    .map((track, index) => {
      const title = (track.title || "").toLowerCase();
      const artist = (track.artist || "").toLowerCase();
      const haystack = [title, artist, (track.tags || []).join(" ").toLowerCase()].join(" ");

      let score = 0;

      if (q) {
        if (artist === q) score += 200;            // whole query is the artist
        else if (artist.includes(q)) score += 130; // artist contains the query
        if (title === q) score += 120;
        else if (title.includes(q)) score += 80;
        if (title.startsWith(q)) score += 25;
        for (const token of tokens) if (haystack.includes(token)) score += 12;
      }

      // Popularity as a gentle prior (sqrt so a viral track can't bury an exact
      // title/artist match).
      score += Math.min(60, Math.round(Math.sqrt(track.popularity || 0)));

      // Label-catalog releases (Saavn) are the precise, original recordings the
      // searcher almost always means — rank them above open-network uploads.
      if (track.official) score += 100;

      // Demote remix-y uploads unless the searcher asked for that kind of thing.
      if (!wantsRemix && isRemixLike(track)) {
        score -= 150;
      }

      // Preserve the source order as a hair-thin tiebreaker for equal scores.
      score -= index * 0.001;

      return { track, score };
    })
    .sort((left, right) => right.score - left.score)
    .map(({ track }) => track);
}

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
