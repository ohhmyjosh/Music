export async function fetchLyrics(track) {
  if (!track?.artist || !track?.title) {
    return {
      text: "Select a song to load lyrics.",
      source: "placeholder"
    };
  }

  try {
    const url = new URL(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(track.artist)}/${encodeURIComponent(track.title)}`
    );
    const response = await fetch(url);
    const data = await response.json();

    return {
      text:
        data.lyrics ||
        "Lyrics are not available for this track yet. Connect a licensed lyrics provider here.",
      source: "lyrics.ovh"
    };
  } catch {
    return {
      text: "Lyrics are not available for this track yet. Connect a licensed lyrics provider here.",
      source: "placeholder"
    };
  }
}
