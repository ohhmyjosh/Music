// JioSaavn — the official label catalog (Sony, Universal, Warner, T-Series...)
// streamed as CORS-clean 320kbps AAC from Saavn's own CDN. This is Josh-Fy's
// primary source for songs, albums, artists and editorial playlists.
//
// We talk to community deployments of the open-source jiosaavn-api (same JSON
// shape, CORS enabled). Individual deployments come and go, so every request
// tries the mirror that last answered first and fails over to the others; one
// dead mirror can never take the app down while another is alive.
const MIRRORS = [
  "https://saavn-api.nandanvarma.com/api",
  "https://jiosavan-api2.vercel.app/api",
  "https://saavn.dev/api"
];

let preferred = 0;

function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

async function request(path) {
  let lastError = null;
  for (let attempt = 0; attempt < MIRRORS.length; attempt += 1) {
    const index = (preferred + attempt) % MIRRORS.length;
    try {
      const response = await fetchWithTimeout(`${MIRRORS[index]}${path}`, 9000);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json?.success === false) throw new Error(json.message || "request failed");
      preferred = index;
      return json.data;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("All Saavn mirrors are unreachable");
}

// Saavn text fields arrive HTML-encoded ("Hips Don&#039;t Lie"), and some are
// encoded twice ("Lofi &amp;amp; Chill"), so &amp; is unwound until stable.
export function decodeEntities(text = "") {
  let value = String(text);
  while (value.includes("&amp;")) value = value.replace(/&amp;/g, "&");
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

// Images come as a size ladder (50x50, 150x150, 500x500).
function pickImage(images, size = "large") {
  if (!Array.isArray(images) || !images.length) return "";
  if (size === "small") return images[Math.min(1, images.length - 1)]?.url || "";
  return images[images.length - 1]?.url || "";
}

function mapArtistRef(artist) {
  return { id: String(artist.id), name: decodeEntities(artist.name) };
}

export function mapSong(song) {
  // downloadUrl is quality-tiered (12k...320k). Best first for playback; the
  // rest stay as fallbacks if the top tier ever fails to load.
  const streamUrls = [...(song.downloadUrl || [])]
    .sort((a, b) => parseInt(b.quality, 10) - parseInt(a.quality, 10))
    .map((entry) => entry.url)
    .filter(Boolean);
  const artists = (song.artists?.primary || []).map(mapArtistRef);

  return {
    id: `saavn-${song.id}`,
    sourceId: String(song.id),
    source: "saavn",
    title: decodeEntities(song.name || song.title || "Unknown title"),
    artist: artists.map((artist) => artist.name).join(", ") || "Unknown artist",
    artists,
    album: decodeEntities(song.album?.name || ""),
    albumId: song.album?.id ? String(song.album.id) : "",
    artwork: pickImage(song.image),
    artworkSmall: pickImage(song.image, "small"),
    audioUrl: streamUrls[0] || "",
    streamUrls,
    duration: Number(song.duration) || 0,
    language: song.language || "",
    year: song.year ? String(song.year) : "",
    popularity: Number(song.playCount) || 0,
    explicit: Boolean(song.explicitContent),
    official: true
  };
}

export function mapAlbum(album) {
  const artists = (album.artists?.primary || []).map(mapArtistRef);
  return {
    kind: "album",
    id: String(album.id),
    title: decodeEntities(album.name || album.title || ""),
    subtitle: artists.map((artist) => artist.name).join(", "),
    artists,
    year: album.year ? String(album.year) : "",
    language: album.language || "",
    artwork: pickImage(album.image),
    songCount: Number(album.songCount) || (album.songs?.length ?? 0),
    songs: (album.songs || []).map(mapSong)
  };
}

export function mapPlaylist(playlist) {
  return {
    kind: "playlist",
    id: String(playlist.id),
    title: decodeEntities(playlist.name || playlist.title || ""),
    subtitle: decodeEntities(playlist.description || ""),
    language: playlist.language || "",
    artwork: pickImage(playlist.image),
    songCount: Number(playlist.songCount) || (playlist.songs?.length ?? 0),
    songs: (playlist.songs || []).map(mapSong)
  };
}

export function mapArtist(artist) {
  return {
    kind: "artist",
    id: String(artist.id),
    title: decodeEntities(artist.name || artist.title || ""),
    artwork: pickImage(artist.image),
    followers: Number(artist.followerCount) || 0,
    isVerified: Boolean(artist.isVerified),
    bio: Array.isArray(artist.bio) ? artist.bio.map((entry) => entry.text).join("\n\n") : "",
    topSongs: (artist.topSongs || []).map(mapSong),
    albums: (artist.topAlbums || []).map(mapAlbum),
    singles: (artist.singles || []).map(mapAlbum),
    similar: (artist.similarArtists || []).map((similar) => ({
      kind: "artist",
      id: String(similar.id),
      title: decodeEntities(similar.name || ""),
      artwork: pickImage(similar.image)
    }))
  };
}

// The catalog lists the same recording under several compilations, so a raw
// search returns "Blinding Lights" three times. Keep one row per song+artist,
// the most-played copy, in first-seen order.
export function dedupeSongs(songs) {
  const byKey = new Map();
  for (const song of songs) {
    const key = `${song.title}|${song.artist}`.toLowerCase();
    const existing = byKey.get(key);
    if (!existing || song.popularity > existing.popularity) byKey.set(key, song);
  }
  return [...byKey.values()];
}

const q = (value) => encodeURIComponent(String(value).trim());

export async function searchSongs(query, limit = 30, page = 0) {
  if (!query.trim()) return [];
  const data = await request(`/search/songs?query=${q(query)}&limit=${limit}&page=${page}`);
  return dedupeSongs((data?.results || []).map(mapSong));
}

export async function searchAlbums(query, limit = 20) {
  if (!query.trim()) return [];
  const data = await request(`/search/albums?query=${q(query)}&limit=${limit}`);
  return (data?.results || []).map(mapAlbum);
}

export async function searchArtists(query, limit = 20) {
  if (!query.trim()) return [];
  const data = await request(`/search/artists?query=${q(query)}&limit=${limit}`);
  return (data?.results || []).map(mapArtist);
}

export async function searchPlaylists(query, limit = 20) {
  if (!query.trim()) return [];
  const data = await request(`/search/playlists?query=${q(query)}&limit=${limit}`);
  // Saavn auto-generates tiny "Made By - X" / "Artist Hits - X" playlists that
  // drown out the editorial ones; a real playlist has a handful of songs.
  return (data?.results || [])
    .map(mapPlaylist)
    .filter((playlist) => playlist.songCount >= 8 && !/^(made by|artist hits) -/i.test(playlist.title));
}

export async function getAlbum(id) {
  return mapAlbum(await request(`/albums?id=${q(id)}`));
}

export async function getPlaylist(id, limit = 100) {
  return mapPlaylist(await request(`/playlists?id=${q(id)}&limit=${limit}`));
}

export async function getArtist(id) {
  return mapArtist(await request(`/artists/${q(id)}`));
}

export async function getArtistSongs(id, page = 0) {
  const data = await request(`/artists/${q(id)}/songs?page=${page}`);
  return (data?.songs || []).map(mapSong);
}

export async function getArtistAlbums(id, page = 0) {
  const data = await request(`/artists/${q(id)}/albums?page=${page}`);
  return (data?.albums || []).map(mapAlbum);
}

// Typeahead: the combined endpoint is one request and returns a little of
// everything, which is exactly what a suggestion dropdown needs.
export async function searchSuggestions(query) {
  if (!query.trim()) return [];
  const data = await request(`/search?query=${q(query)}`);
  const pick = (bucket, kind) =>
    (data?.[bucket]?.results || []).map((item) => ({
      kind,
      id: String(item.id),
      title: decodeEntities(item.title || item.name || ""),
      subtitle: decodeEntities(
        item.singers || item.primaryArtists || item.artist || item.description || ""
      ),
      artwork: pickImage(item.image, "small")
    }));
  const seen = new Set();
  const unique = (item) => {
    const key = `${item.kind}:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  };
  const topQuery = (data?.topQuery?.results || []).map((item) => ({
    kind: item.type === "song" ? "song" : item.type,
    id: String(item.id),
    title: decodeEntities(item.title || ""),
    subtitle: decodeEntities(item.description || ""),
    artwork: pickImage(item.image, "small")
  }));
  return [
    ...topQuery.filter((item) => ["song", "artist", "album", "playlist"].includes(item.kind)),
    ...pick("songs", "song").slice(0, 4),
    ...pick("artists", "artist").slice(0, 2),
    ...pick("albums", "album").slice(0, 2),
    ...pick("playlists", "playlist").slice(0, 1)
  ].filter(unique);
}

export async function getSongById(id) {
  const data = await request(`/songs/${q(id)}`);
  return Array.isArray(data) && data[0] ? mapSong(data[0]) : null;
}
