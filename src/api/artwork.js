// Official cover-art lookup via Apple's free iTunes Search API.
//
// Audius tracks are indie uploads that often ship no artwork (or only the "JF"
// placeholder), and even when they have art it's the uploader's, not the
// original release cover. When we can recognise a real artist + title we fetch
// the official album cover instead. Everything here degrades silently: on any
// miss/error we return "" and the caller keeps its existing artwork.

const CACHE_PREFIX = "joshfy-art:";
const memory = new Map(); // key -> resolved url ("" means "looked up, nothing")
const inflight = new Map(); // key -> Promise, so we never fetch the same term twice

function cacheKey(artist, title) {
  return `${(artist || "").toLowerCase().trim()}|${(title || "").toLowerCase().trim()}`;
}

// Strip remix/feature noise and bracketed tags so "Song (TESLOW BOOTLEG)" still
// matches the original recording on iTunes.
function cleanTerm(artist, title) {
  const cleanedTitle = (title || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\b(feat|ft|featuring|prod|remix|bootleg|flip|edit|cover|vip|mashup|refix|rework)\b.*/i, " ")
    .replace(/[-–—_]/g, " ")
    .trim();
  return `${artist || ""} ${cleanedTitle}`.replace(/\s+/g, " ").trim();
}

function tokenSet(text) {
  return new Set(
    (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2)
  );
}

// Only trust an iTunes hit if it shares a real word with what we searched for,
// so an obscure title doesn't get some unrelated chart cover slapped on it.
function looksRelated(query, hit) {
  const wanted = tokenSet(query);
  if (!wanted.size) return false;
  const got = tokenSet(`${hit.artistName || ""} ${hit.trackName || ""} ${hit.collectionName || ""}`);
  for (const token of wanted) if (got.has(token)) return true;
  return false;
}

function readStored(key) {
  try {
    return localStorage.getItem(CACHE_PREFIX + key);
  } catch {
    return null;
  }
}

function writeStored(key, value) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, value);
  } catch {
    /* storage full / unavailable — memory cache still covers the session */
  }
}

export async function fetchOfficialArtwork(artist, title) {
  const key = cacheKey(artist, title);
  if (key === "|") return "";
  if (memory.has(key)) return memory.get(key);

  const stored = readStored(key);
  if (stored !== null) {
    memory.set(key, stored);
    return stored;
  }

  if (inflight.has(key)) return inflight.get(key);

  const request = (async () => {
    const term = cleanTerm(artist, title);
    let art = "";
    try {
      const url = new URL("https://itunes.apple.com/search");
      url.searchParams.set("term", term);
      url.searchParams.set("media", "music");
      url.searchParams.set("entity", "song");
      url.searchParams.set("limit", "3");

      const response = await fetch(url.toString());
      const data = await response.json();
      const hit = (data.results || []).find((result) => looksRelated(term, result));
      if (hit?.artworkUrl100) {
        // iTunes serves 100px by default; ask for a crisp 600px cover.
        art = hit.artworkUrl100.replace(/\/\d+x\d+bb\./, "/600x600bb.");
      }
    } catch {
      /* offline / blocked / rate-limited — leave art empty, keep placeholder */
    }

    memory.set(key, art);
    writeStored(key, art);
    inflight.delete(key);
    return art;
  })();

  inflight.set(key, request);
  return request;
}
