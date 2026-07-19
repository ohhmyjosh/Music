import { normalizeTrack } from "../utils/normalizeTrack";

// JioSaavn — the official-catalog source. Where Audius is an open network of
// indie uploads and remixes, JioSaavn carries the real label releases (Sony,
// Universal, Warner...), international hits included, streamed as CORS-clean
// 320kbps AAC from its own CDN. That combination is exactly what search needs:
// "hips dont lie" should return Shakira's record, not a Jersey Club flip.
//
// We go through community API deployments (same upstream, JSON + CORS). More
// than one is listed because individual deployments come and go; we race them
// and stick with the first that answers.
const DEPLOYMENTS = [
  "https://saavn-api.nandanvarma.com/api",
  "https://saavn.dev/api",
  "https://jiosavan-api-with-playlist.vercel.app/api"
];

function fetchWithTimeout(url, ms = 8000, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id)
  );
}

let basePromise = null;

async function getBase() {
  if (basePromise) return basePromise;

  basePromise = (async () => {
    const probes = DEPLOYMENTS.map((base) =>
      fetchWithTimeout(`${base}/search/songs?query=test&limit=1`, 6000).then((res) => {
        if (!res.ok) throw new Error("unhealthy deployment");
        return res.json().then((data) => {
          if (!data?.data) throw new Error("unexpected shape");
          return base;
        });
      })
    );
    try {
      return await Promise.any(probes);
    } catch {
      return DEPLOYMENTS[0];
    }
  })();

  return basePromise;
}

// Saavn text fields arrive HTML-encoded ("Hips Don&#039;t Lie").
function decodeEntities(text = "") {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function bestImage(images = []) {
  return images.length ? images[images.length - 1]?.url : "";
}

function mapSaavnTrack(song) {
  // downloadUrl is quality-tiered (12k...320k). Best first for playback; the
  // rest stay as fallbacks if the top tier ever fails to load.
  const streams = [...(song.downloadUrl || [])]
    .sort((a, b) => parseInt(b.quality) - parseInt(a.quality))
    .map((entry) => entry.url)
    .filter(Boolean);

  const artists = (song.artists?.primary || [])
    .map((artist) => decodeEntities(artist.name))
    .join(", ");

  const normalized = normalizeTrack(
    {
      id: `saavn-${song.id}`,
      title: decodeEntities(song.name),
      artist: artists || "Unknown artist",
      album: decodeEntities(song.album?.name || "Single"),
      artwork: bestImage(song.image),
      audioUrl: streams[0] || "",
      duration: song.duration || 0,
      genre: song.language
        ? song.language.charAt(0).toUpperCase() + song.language.slice(1)
        : "Pop",
      popularity: song.playCount || 0,
      releaseDate: song.releaseDate || String(song.year || ""),
      tags: []
    },
    "saavn"
  );
  normalized.streamUrls = streams;
  normalized.official = true; // label-catalog content, used as a ranking signal
  return normalized;
}

// The catalog lists the same recording under several compilations, so a raw
// search returns "Blinding Lights" three times. Collapse to one row per
// song+artist, keeping the most-played (best) copy.
function dedupe(tracks) {
  const byKey = new Map();
  for (const track of tracks) {
    const key = `${track.title}|${track.artist}`.toLowerCase();
    const existing = byKey.get(key);
    if (!existing || (track.popularity || 0) > (existing.popularity || 0)) {
      byKey.set(key, track);
    }
  }
  return [...byKey.values()];
}

export async function searchSaavnTracks(query, limit = 30) {
  if (!query.trim()) return [];
  try {
    const base = await getBase();
    const url = `${base}/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`;
    const response = await fetchWithTimeout(url, 8000);
    const data = await response.json();
    return dedupe((data?.data?.results || []).map(mapSaavnTrack));
  } catch {
    return []; // source down — search falls back to Audius
  }
}
