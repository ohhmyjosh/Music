import { dedupeSongs, getArtist, searchSongs } from "./saavn";
import { fetchAudiusTrending } from "./audius";

// Artist pages are the backbone of radio and "Related", and the same artist is
// asked for repeatedly while a session plays, so lookups are memoized.
const artistCache = new Map();

export function getArtistCached(id) {
  if (!artistCache.has(id)) {
    artistCache.set(
      id,
      getArtist(id).catch((error) => {
        artistCache.delete(id);
        throw error;
      })
    );
  }
  return artistCache.get(id);
}

// Round-robin merge so a radio doesn't play five songs by one artist in a row.
function interleave(lists) {
  const out = [];
  const longest = Math.max(0, ...lists.map((list) => list.length));
  for (let i = 0; i < longest; i += 1) {
    for (const list of lists) if (list[i]) out.push(list[i]);
  }
  return out;
}

// A radio station seeded from one song:
//   the seed artist's top songs + top songs from up to four similar artists,
//   interleaved, deduped, minus anything already queued or disliked.
// Audius tracks have no artist graph, so they seed from their genre's trending.
export async function buildRadio(seed, { exclude = new Set(), limit = 25 } = {}) {
  if (!seed) return [];
  const keep = (track) => track.audioUrl && track.id !== seed.id && !exclude.has(track.id);

  if (seed.source === "audius") {
    const pool = await fetchAudiusTrending(limit + 10, seed.genre).catch(() => []);
    return pool.filter(keep).slice(0, limit);
  }

  const artistId = seed.artists?.[0]?.id;
  if (!artistId) {
    const pool = await searchSongs(seed.artist || seed.title, limit + 10).catch(() => []);
    return pool.filter(keep).slice(0, limit);
  }

  const artist = await getArtistCached(artistId).catch(() => null);
  if (!artist) return [];

  const similar = await Promise.all(
    artist.similar.slice(0, 4).map((entry) =>
      getArtistCached(entry.id)
        .then((data) => data.topSongs.slice(0, 5))
        .catch(() => [])
    )
  );

  // Similar artists may be absent for niche artists; their own catalog fills in.
  const lists = [artist.topSongs, ...similar].filter((list) => list.length);
  let pool = dedupeSongs(interleave(lists)).filter(keep);
  if (pool.length < 10) {
    const more = await searchSongs(`${artist.title} songs`, 30).catch(() => []);
    pool = dedupeSongs([...pool, ...more.filter(keep)]);
  }
  return pool.slice(0, limit);
}

// Everything the "Related" tab shows for the song that's playing.
export async function getRelated(seed) {
  const artistId = seed?.artists?.[0]?.id;
  if (!artistId) {
    return { artist: null, songs: await buildRadio(seed, { limit: 12 }), similar: [], albums: [] };
  }
  const artist = await getArtistCached(artistId);
  const songs = await buildRadio(seed, { limit: 12 });
  return { artist, songs, similar: artist.similar.slice(0, 10), albums: artist.albums.slice(0, 10) };
}
