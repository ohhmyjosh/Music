import { normalizeTrack, waveboxSeeds } from "../utils/normalizeTrack";

const JAMENDO_API = "https://api.jamendo.com/v3.0/tracks";

export async function fetchJamendoTrending() {
  const clientId = import.meta.env.VITE_JAMENDO_CLIENT_ID;

  if (!clientId) {
    return waveboxSeeds;
  }

  const url = new URL(JAMENDO_API);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "12");
  url.searchParams.set("include", "musicinfo");
  url.searchParams.set("boost", "popularity_month");
  url.searchParams.set("audioformat", "mp32");

  const response = await fetch(url);
  const data = await response.json();

  return (data.results || []).map((track) =>
    normalizeTrack(
      {
        id: track.id,
        title: track.name,
        artist: track.artist_name,
        album: track.album_name,
        artwork: track.image,
        audioUrl: track.audio,
        downloadUrl: track.audiodownload_allowed ? track.audiodownload : "",
        duration: track.duration,
        genre: track.musicinfo?.tags?.genres?.[0] || "Independent",
        mood: track.musicinfo?.tags?.vartags?.[0] || "Discover",
        tags: [
          ...(track.musicinfo?.tags?.genres || []),
          ...(track.musicinfo?.tags?.instruments || [])
        ]
      },
      "jamendo"
    )
  );
}
