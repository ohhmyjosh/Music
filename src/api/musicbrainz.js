export async function fetchMusicMetadata(track) {
  if (!track?.artist || !track?.title) {
    return null;
  }

  const query = `recording:${track.title} AND artist:${track.artist}`;
  const url = new URL("https://musicbrainz.org/ws/2/recording");
  url.searchParams.set("query", query);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("limit", "1");

  try {
    const response = await fetch(url);
    const data = await response.json();
    const recording = data.recordings?.[0];

    if (!recording) return null;

    return {
      releaseDate: recording["first-release-date"] || "Unknown",
      country: recording.releases?.[0]?.country || "Unknown",
      credits:
        recording["artist-credit"]?.map((credit) => credit.name).join(", ") ||
        track.artist
    };
  } catch {
    return null;
  }
}
