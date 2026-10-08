// Audius — a free, open music network of independent uploads. It's the
// "community" side of Josh-Fy: indie releases, DJ sets and remixes that the
// label catalog (Saavn) doesn't carry. No API key; every request carries an
// app_name.
const APP_NAME = "JoshFy";

// https://api.audius.co is a gateway that proxies the JSON API but whose /stream
// endpoint doesn't serve browser-playable audio, so we resolve a real discovery
// node and use it for everything, streaming included.
const KNOWN_HOSTS = [
  "https://discoveryprovider.audius.co",
  "https://discoveryprovider2.audius.co",
  "https://discoveryprovider3.audius.co"
];

function fetchWithTimeout(url, ms = 6000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

let hostPromise = null;
// Every host we know about, kept so the player can retry a failing stream on a
// different node.
let allHosts = [...KNOWN_HOSTS];

async function getHost() {
  if (hostPromise) return hostPromise;

  hostPromise = (async () => {
    const candidates = [...KNOWN_HOSTS];
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
    allHosts = [...candidates];

    // Take the first node that actually answers, so one slow node can't stall us.
    const probes = candidates.map((host) =>
      fetchWithTimeout(`${host}/v1/tracks/trending?app_name=${APP_NAME}&limit=1`, 5000).then(
        (res) => {
          if (res.ok) return host;
          throw new Error("unhealthy node");
        }
      )
    );
    try {
      return await Promise.any(probes);
    } catch {
      return candidates[0];
    }
  })();

  return hostPromise;
}

export function audiusStreamCandidates(track) {
  const urls = allHosts.map(
    (host) => `${host}/v1/tracks/${track.sourceId}/stream?app_name=${APP_NAME}`
  );
  // Whatever URL the track was minted with goes first (it probed healthy).
  return track.audioUrl ? [track.audioUrl, ...urls.filter((url) => url !== track.audioUrl)] : urls;
}

function mapAudiusTrack(host, track) {
  return {
    id: `audius-${track.id}`,
    sourceId: String(track.id),
    source: "audius",
    title: (track.title || "Unknown title").replace(/_+/g, " ").trim(),
    artist: track.user?.name || "Unknown artist",
    artists: [],
    album: "",
    albumId: "",
    artwork: track.artwork?.["480x480"] || track.artwork?.["150x150"] || "",
    artworkSmall: track.artwork?.["150x150"] || "",
    audioUrl: `${host}/v1/tracks/${track.id}/stream?app_name=${APP_NAME}`,
    streamUrls: [],
    duration: Number(track.duration) || 0,
    language: "",
    genre: track.genre || "",
    year: track.release_date ? String(track.release_date).slice(0, 4) : "",
    popularity: Number(track.play_count) || 0,
    explicit: false,
    official: false
  };
}

async function audiusGet(path, params) {
  const host = await getHost();
  const url = new URL(`${host}/v1/${path}`);
  url.searchParams.set("app_name", APP_NAME);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  const response = await fetchWithTimeout(url.toString(), 8000);
  if (!response.ok) throw new Error(`Audius HTTP ${response.status}`);
  const data = await response.json();
  return (data.data || []).map((track) => mapAudiusTrack(host, track));
}

export function fetchAudiusTrending(limit = 20, genre = "") {
  return audiusGet("tracks/trending", genre ? { limit, genre } : { limit });
}

export function searchAudius(query, limit = 20) {
  if (!query.trim()) return Promise.resolve([]);
  return audiusGet("tracks/search", { query, limit });
}
