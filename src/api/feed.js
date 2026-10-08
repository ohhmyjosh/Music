import { getPlaylist, searchAlbums, searchPlaylists } from "./saavn";

// The home/explore feed is assembled from Saavn's editorial playlists. Each
// mood or genre is a search query; prefixing it with a language the listener
// picked in Settings ("punjabi party", "english workout") steers the results
// to music they actually understand.

export const MOODS = [
  { slug: "energize", label: "Energize", query: "pump up" },
  { slug: "feel-good", label: "Feel good", query: "feel good" },
  { slug: "romance", label: "Romance", query: "romance" },
  { slug: "relax", label: "Relax", query: "chill" },
  { slug: "workout", label: "Workout", query: "workout" },
  { slug: "party", label: "Party", query: "party" },
  { slug: "commute", label: "Commute", query: "commute" },
  { slug: "sad", label: "Sad", query: "sad" },
  { slug: "focus", label: "Focus", query: "focus" },
  { slug: "sleep", label: "Sleep", query: "sleep" }
];

export const GENRES = [
  { slug: "bollywood", label: "Bollywood", query: "bollywood", color: "#e11d48" },
  { slug: "punjabi", label: "Punjabi", query: "punjabi hits", color: "#f59e0b" },
  { slug: "hip-hop", label: "Hip-Hop", query: "hip hop", color: "#8b5cf6" },
  { slug: "pop", label: "Pop", query: "pop hits", color: "#ec4899" },
  { slug: "indie", label: "Indie", query: "indie", color: "#14b8a6" },
  { slug: "lofi", label: "Lo-fi", query: "lofi", color: "#6366f1" },
  { slug: "edm", label: "Dance & EDM", query: "edm", color: "#06b6d4" },
  { slug: "rock", label: "Rock", query: "rock", color: "#ef4444" },
  { slug: "retro", label: "Retro", query: "retro", color: "#a16207" },
  { slug: "ghazal", label: "Ghazal", query: "ghazal", color: "#0ea5e9" },
  { slug: "devotional", label: "Devotional", query: "devotional", color: "#f97316" },
  { slug: "kpop", label: "K-Pop", query: "k-pop", color: "#d946ef" },
  { slug: "jazz", label: "Jazz", query: "jazz", color: "#22c55e" },
  { slug: "romantic", label: "Romantic", query: "romantic", color: "#f43f5e" },
  { slug: "tamil", label: "Tamil", query: "tamil hits", color: "#84cc16" },
  { slug: "telugu", label: "Telugu", query: "telugu hits", color: "#10b981" }
];

export const LANGUAGES = [
  "hindi",
  "english",
  "punjabi",
  "tamil",
  "telugu",
  "marathi",
  "bengali",
  "gujarati",
  "kannada",
  "malayalam",
  "bhojpuri",
  "haryanvi",
  "rajasthani",
  "odia",
  "assamese"
];

export function findCategory(slug) {
  return MOODS.find((item) => item.slug === slug) || GENRES.find((item) => item.slug === slug) || null;
}

function uniqueById(items) {
  const seen = new Set();
  return items.filter((item) => (seen.has(item.id) ? false : seen.add(item.id)));
}

// Playlists for a mood/genre across the listener's languages. Language-prefixed
// queries run first; the bare query backs them up so a sparse language still
// yields a full shelf.
export async function playlistsFor(query, languages = [], limit = 16) {
  const queries = [...languages.slice(0, 3).map((lang) => `${lang} ${query}`), query];
  const results = await Promise.all(
    queries.map((text) => searchPlaylists(text, 10).catch(() => []))
  );
  const merged = uniqueById(results.flat());
  if (!languages.length) return merged.slice(0, limit);
  // Prefer the listener's languages, but keep the rest as overflow.
  const preferred = merged.filter((playlist) => languages.includes(playlist.language));
  const rest = merged.filter((playlist) => !languages.includes(playlist.language));
  return [...preferred, ...rest].slice(0, limit);
}

// The songs of the first playlist a query finds — e.g. "trending today" ->
// Saavn's "Now Trending" chart, as a playable list.
export async function songsFromTopPlaylist(query, languages = [], limit = 40) {
  const [first] = await playlistsFor(query, languages, 1);
  if (!first) return { playlist: null, songs: [] };
  const playlist = await getPlaylist(first.id, limit);
  return { playlist, songs: playlist.songs.filter((song) => song.audioUrl) };
}

export async function newReleaseAlbums(languages = []) {
  const year = new Date().getFullYear();
  const queries = (languages.length ? languages.slice(0, 2) : ["hindi"]).map(
    (lang) => `${lang} ${year}`
  );
  const results = await Promise.all(queries.map((text) => searchAlbums(text, 12).catch(() => [])));
  return uniqueById(results.flat()).filter((album) => !album.year || Number(album.year) >= year - 1);
}
