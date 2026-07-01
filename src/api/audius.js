import { normalizeTrack } from "../utils/normalizeTrack";
import { demoTracks } from "../data/demoTracks";

// Audius is a free, open, streamable music network with no API key required.
// Best practice: ask https://api.audius.co for a healthy discovery node, then
// talk to that node. Every request must carry an app_name.
const APP_NAME = "JoshFy";
const demoCatalog = demoTracks.map((track) => normalizeTrack(track, "demo"));

let hostPromise = null;

async function getHost() {
  if (!hostPromise) {
    hostPromise = fetch("https://api.audius.co")
      .then((res) => res.json())
      .then((data) => {
        const hosts = data?.data || [];
        // Prefer an official audius.co node; fall back to whatever is healthy.
        return (
          hosts.find((h) => h.includes("audius.co")) ||
          hosts[0] ||
          "https://discoveryprovider.audius.co"
        );
      })
      .catch(() => "https://discoveryprovider.audius.co");
  }
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

    const response = await fetch(url);
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

    const response = await fetch(url);
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
