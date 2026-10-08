// Lyrics come from LRCLIB, a free, open lyrics database that serves
// time-synced (LRC) lyrics — what powers the line-by-line highlight in the
// Lyrics tab. lyrics.ovh is a plain-text fallback for songs LRCLIB lacks.
//
// Result shape: { synced: [{ time, text }] | null, plain: string, source }

const LRCLIB = "https://lrclib.net/api";

function fetchJson(url, ms = 9000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal })
    .then((response) => (response.ok ? response.json() : null))
    .finally(() => clearTimeout(id));
}

// "[01:02.34] line" -> { time: 62.34, text: "line" }. A line may carry several
// timestamps ("[00:10.00][01:10.00] chorus"), so each one becomes its own entry.
export function parseLrc(lrc) {
  const lines = [];
  for (const raw of String(lrc || "").split(/\r?\n/)) {
    const stamps = [...raw.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
    if (!stamps.length) continue;
    const text = raw.replace(/\[[^\]]*\]/g, "").trim();
    for (const stamp of stamps) {
      lines.push({ time: Number(stamp[1]) * 60 + Number(stamp[2]), text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

// Strip "(From "Movie")", "(feat. X)" and similar so the lookup matches.
function cleanTitle(title = "") {
  return title
    .replace(/\((from|feat|ft|featuring)[^)]*\)/gi, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstArtist(artist = "") {
  return artist.split(/,|&| x | feat\.? /i)[0].trim();
}

function fromRecord(record) {
  if (!record || record.instrumental) {
    return record?.instrumental ? { synced: null, plain: "♪ Instrumental ♪", source: "lrclib" } : null;
  }
  const synced = record.syncedLyrics ? parseLrc(record.syncedLyrics) : null;
  if (!synced?.length && !record.plainLyrics) return null;
  return {
    synced: synced?.length ? synced : null,
    plain: record.plainLyrics || synced?.map((line) => line.text).join("\n") || "",
    source: "lrclib"
  };
}

async function fromLrclib(track) {
  const title = cleanTitle(track.title);
  const artist = firstArtist(track.artist);

  const exact = new URL(`${LRCLIB}/get`);
  exact.searchParams.set("track_name", title);
  exact.searchParams.set("artist_name", artist);
  if (track.duration) exact.searchParams.set("duration", String(Math.round(track.duration)));
  const direct = fromRecord(await fetchJson(exact.toString()).catch(() => null));
  if (direct) return direct;

  // Fuzzy search; prefer synced results whose length is within a few seconds.
  const search = new URL(`${LRCLIB}/search`);
  search.searchParams.set("q", `${title} ${artist}`);
  const results = (await fetchJson(search.toString()).catch(() => null)) || [];
  const scored = results
    .map((record) => {
      const drift = track.duration ? Math.abs((record.duration || 0) - track.duration) : 0;
      return { record, score: (record.syncedLyrics ? 10 : 0) - Math.min(drift, 30) / 3 };
    })
    .filter(({ record }) => !track.duration || Math.abs((record.duration || 0) - track.duration) < 15)
    .sort((a, b) => b.score - a.score);
  return fromRecord(scored[0]?.record);
}

async function fromLyricsOvh(track) {
  const data = await fetchJson(
    `https://api.lyrics.ovh/v1/${encodeURIComponent(firstArtist(track.artist))}/${encodeURIComponent(
      cleanTitle(track.title)
    )}`
  ).catch(() => null);
  return data?.lyrics ? { synced: null, plain: data.lyrics.trim(), source: "lyrics.ovh" } : null;
}

export async function fetchLyrics(track) {
  if (!track?.title) return null;
  return (await fromLrclib(track)) || (await fromLyricsOvh(track)) || null;
}
