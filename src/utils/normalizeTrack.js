const fallbackArtwork =
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80";

export function normalizeTrack(track, source = "custom") {
  return {
    id: track.id ?? `${source}-${track.title}-${track.artist}`,
    source,
    title: track.title ?? "Unknown title",
    artist: track.artist ?? track.artist_name ?? "Unknown artist",
    album: track.album ?? track.release_title ?? "Single",
    artwork:
      track.artwork ||
      track.artwork_url ||
      track.image ||
      track.cover ||
      fallbackArtwork,
    audioUrl: track.audioUrl || track.stream_url || track.url || "",
    downloadUrl: track.downloadUrl || track.download_url || "",
    duration: track.duration ?? 0,
    genre: track.genre ?? track.tags?.[0] ?? "Electronic",
    mood: track.mood ?? "Focused",
    description: track.description ?? "",
    isOffline: Boolean(track.isOffline),
    localOnly: Boolean(track.localOnly),
    lyrics: track.lyrics ?? "",
    tags: track.tags ?? []
  };
}

export const waveboxSeeds = [
  normalizeTrack(
    {
      id: "seed-1",
      title: "Night Transit",
      artist: "Wave Theory",
      album: "After Hours",
      artwork:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80",
      audioUrl: "https://samplelib.com/lib/preview/mp3/sample-3s.mp3",
      downloadUrl: "https://samplelib.com/lib/preview/mp3/sample-3s.mp3",
      duration: 183,
      genre: "Synthwave",
      mood: "Late Night",
      tags: ["synth", "night", "retro"]
    },
    "seed"
  ),
  normalizeTrack(
    {
      id: "seed-2",
      title: "Coastal Bloom",
      artist: "Harbor Echo",
      album: "Blue Morning",
      artwork:
        "https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=900&q=80",
      audioUrl: "https://samplelib.com/lib/preview/mp3/sample-6s.mp3",
      downloadUrl: "https://samplelib.com/lib/preview/mp3/sample-6s.mp3",
      duration: 214,
      genre: "Indie Pop",
      mood: "Uplifting",
      tags: ["indie", "coast", "sunrise"]
    },
    "seed"
  ),
  normalizeTrack(
    {
      id: "seed-3",
      title: "Signals in Rain",
      artist: "Velvet Static",
      album: "Streetlights",
      artwork:
        "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=900&q=80",
      audioUrl: "https://samplelib.com/lib/preview/mp3/sample-9s.mp3",
      downloadUrl: "https://samplelib.com/lib/preview/mp3/sample-9s.mp3",
      duration: 201,
      genre: "Lo-fi",
      mood: "Rainy",
      tags: ["lofi", "rain", "focus"]
    },
    "seed"
  ),
  normalizeTrack(
    {
      id: "seed-4",
      title: "Open Skyline",
      artist: "Northbound",
      album: "Altitude",
      artwork:
        "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
      audioUrl: "https://samplelib.com/lib/preview/mp3/sample-12s.mp3",
      downloadUrl: "https://samplelib.com/lib/preview/mp3/sample-12s.mp3",
      duration: 236,
      genre: "Chillhop",
      mood: "Expansive",
      tags: ["travel", "chill", "instrumental"]
    },
    "seed"
  )
];
