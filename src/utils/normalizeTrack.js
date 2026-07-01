const fallbackArtwork =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%237c3aed'/%3E%3Cstop offset='55%25' stop-color='%231a1a23'/%3E%3Cstop offset='100%25' stop-color='%230a0a0f'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='600' height='600' rx='48' fill='url(%23g)'/%3E%3Ctext x='60' y='330' fill='white' font-family='Arial,sans-serif' font-size='96' font-weight='700'%3EJF%3C/text%3E%3C/svg%3E";

export function normalizeTrack(track, source = "custom") {
  return {
    id: track.id ?? `${source}-${track.title}-${track.artist}`,
    source: track.source || source,
    title: track.title ?? "Unknown title",
    artist: track.artist ?? track.artist_name ?? "Unknown artist",
    album: track.album ?? track.release_title ?? "Single",
    artwork:
      track.artwork ||
      track.artwork_url ||
      track.image ||
      track.cover ||
      fallbackArtwork,
    image:
      track.image ||
      track.artwork ||
      track.artwork_url ||
      track.cover ||
      fallbackArtwork,
    audioUrl: track.audioUrl || track.stream_url || track.url || "",
    downloadUrl:
      track.downloadUrl ||
      track.download_url ||
      (track.isDownloadable ? track.audioUrl || track.stream_url || track.url || "" : ""),
    duration: track.duration ?? 0,
    genre: track.genre ?? track.tags?.[0] ?? "Electronic",
    mood: track.mood ?? "Focused",
    description: track.description ?? "",
    releaseDate: track.releaseDate ?? "",
    popularity: track.popularity ?? 0,
    isOffline: Boolean(track.isOffline),
    localOnly: Boolean(track.localOnly),
    isDownloadable: Boolean(track.isDownloadable || track.downloadUrl || track.download_url),
    lyrics: track.lyrics ?? "",
    tags: track.tags ?? []
  };
}
