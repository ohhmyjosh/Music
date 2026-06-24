import { normalizeTrack, waveboxSeeds } from "../utils/normalizeTrack";

const DISCOVERY_NODES = [
  "https://discoveryprovider.audius.co/v1/tracks/trending?limit=10"
];

export async function fetchAudiusTrending() {
  try {
    const response = await fetch(DISCOVERY_NODES[0]);
    const data = await response.json();

    return (data.data || []).map((track) =>
      normalizeTrack(
        {
          id: track.id,
          title: track.title,
          artist: track.user?.name,
          album: track.genre || "Audius",
          artwork: track.artwork?.["480x480"] || track.artwork?.["150x150"],
          audioUrl: `https://discoveryprovider.audius.co/v1/tracks/${track.id}/stream`,
          downloadUrl: track.download?.is_downloadable
            ? `https://discoveryprovider.audius.co/v1/tracks/${track.id}/download`
            : "",
          duration: track.duration,
          genre: track.genre,
          mood: track.mood,
          tags: track.tags ? track.tags.split(",").map((tag) => tag.trim()) : []
        },
        "audius"
      )
    );
  } catch {
    return waveboxSeeds;
  }
}

export async function searchAudiusTracks(query) {
  if (!query.trim()) {
    return waveboxSeeds;
  }

  try {
    const url = new URL("https://discoveryprovider.audius.co/v1/tracks/search");
    url.searchParams.set("query", query);
    url.searchParams.set("limit", "18");

    const response = await fetch(url);
    const data = await response.json();

    return (data.data || []).map((track) =>
      normalizeTrack(
        {
          id: track.id,
          title: track.title,
          artist: track.user?.name,
          artwork: track.artwork?.["480x480"] || track.artwork?.["150x150"],
          audioUrl: `https://discoveryprovider.audius.co/v1/tracks/${track.id}/stream`,
          downloadUrl: track.download?.is_downloadable
            ? `https://discoveryprovider.audius.co/v1/tracks/${track.id}/download`
            : "",
          duration: track.duration,
          genre: track.genre,
          tags: track.tags ? track.tags.split(",").map((tag) => tag.trim()) : []
        },
        "audius"
      )
    );
  } catch {
    return waveboxSeeds.filter((track) =>
      [track.title, track.artist, track.genre].join(" ").toLowerCase().includes(query.toLowerCase())
    );
  }
}
