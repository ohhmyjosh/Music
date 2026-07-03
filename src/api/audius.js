import { normalizeTrack } from "../utils/normalizeTrack";
import { demoTracks } from "../data/demoTracks";

// Audius is a free, open, streamable music network with no API key required.
// Every request must carry an app_name.
const APP_NAME = "JoshFy";
const demoCatalog = demoTracks.map((track) => normalizeTrack(track, "demo"));

// https://api.audius.co used to return a list of many discovery nodes. It now
// returns only itself — a gateway that PROXIES the JSON API (trending/search
// work) but whose /stream endpoint does NOT serve browser-playable audio. Using
// it means songs list but never play. So we resolve a real discovery node and
// use it for everything, including streaming.
const KNOWN_HOSTS = [
  "https://discoveryprovider.audius.co",
  "https://discoveryprovider2.audius.co",
  "https://discoveryprovider3.audius.co"
];

function fetchWithTimeout(url, ms = 6000, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id)
  );
}

let hostPromise = null;

async function getHost() {
  if (hostPromise) return hostPromise;

  hostPromise = (async () => {
    const candidates = [...KNOWN_HOSTS];
    // Fold in any additional healthy nodes the directory advertises, but never
    // the gateway itself (it can't stream to <audio>).
    try {
      const res = await fetchWithTimeout("https://api.audius.co", 3500);
      const data = await res.json();
      for (const host of data?.data || []) {
        if (host && !host.includes("api.audius.co") && !candidates.includes(host)) {
          candidates.push(host);
        }
      }
    } catch {
      /* directory unavailable — the known hosts cover us */
    }

    // Race the candidates and take the first that actually answers, so one slow
    // or down node can't stall the whole app.
    const probes = candidates.map((host) =>
      fetchWithTimeout(
        `${host}/v1/tracks/trending?app_name=${APP_NAME}&limit=1`,
        5000
      ).then((res) => {
        if (res.ok) return host;
        throw new Error("unhealthy node");
      })
    );

    try {
      return await Promise.any(probes);
    } catch {
      return candidates[0];
    }
  })();

  return hostPromise;
}

function mapAudiusTrack(host, track) {
  return normalizeTrack(
    {
      id: track.id,
      title: track.title,
      artist: track.user?.name,
      album: track.genre || "Audius",
      artwork: track.artwork?.["480x480"] || track.artwork?.["150x150"],
      audioUrl: `${host}/v1/tracks/${track.id}/stream?app_name=${APP_NAME}`,
      downloadUrl: track.is_downloadable
        ? `${host}/v1/tracks/${track.id}/download?app_name=${APP_NAME}`
        : "",
      duration: track.duration,
      genre: track.genre,
      mood: track.mood,
      popularity: track.play_count || track.favorite_count || 0,
      isDownloadable: Boolean(track.is_downloadable),
      tags: track.tags ? track.tags.split(",").map((tag) => tag.trim()) : []
    },
    "audius"
  );
}

export async function fetchAudiusTrending(limit = 20) {
  try {
    const host = await getHost();
    const url = new URL(`${host}/v1/tracks/trending`);
    url.searchParams.set("app_name", APP_NAME);
    url.searchParams.set("limit", String(limit));

    const response = await fetchWithTimeout(url.toString(), 8000);
    const data = await response.json();
    const tracks = (data.data || []).map((track) => mapAudiusTrack(host, track));
    return tracks.length ? tracks : demoCatalog.slice(0, limit);
  } catch {
    return demoCatalog.slice(0, limit);
  }
}

// Trending within a single Audius genre (e.g. "Hip-Hop/Rap", "Electronic",
// "R&B/Soul"). Powers the themed shelves on the home feed with real, streamable
// music instead of demo placeholders.
export async function fetchAudiusByGenre(genre, limit = 12) {
  try {
    const host = await getHost();
    const url = new URL(`${host}/v1/tracks/trending`);
    url.searchParams.set("app_name", APP_NAME);
    url.searchParams.set("genre", genre);
    url.searchParams.set("limit", String(limit));

    const response = await fetchWithTimeout(url.toString(), 8000);
    const data = await response.json();
    const tracks = (data.data || []).map((track) => mapAudiusTrack(host, track));
    return tracks.length ? tracks : demoCatalog.slice(0, limit);
  } catch {
    return demoCatalog.slice(0, limit);
  }
}

export async function searchAudiusTracks(query, limit = 25) {
  if (!query.trim()) {
    return fetchAudiusTrending(limit);
  }

  try {
    const host = await getHost();
    const url = new URL(`${host}/v1/tracks/search`);
    url.searchParams.set("app_name", APP_NAME);
    url.searchParams.set("query", query);
    url.searchParams.set("limit", String(limit));

    const response = await fetchWithTimeout(url.toString(), 8000);
    const data = await response.json();
    return (data.data || []).map((track) => mapAudiusTrack(host, track));
  } catch {
    return demoCatalog.filter((track) =>
      [track.title, track.artist, track.genre, track.mood, ...(track.tags || [])]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }
}
