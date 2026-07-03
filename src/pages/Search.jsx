import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "../components/search/SearchBar";
import SearchResults from "../components/search/SearchResults";
import GenreChip from "../components/music/GenreChip";
import { demoTracks } from "../data/demoTracks";
import { demoAlbums } from "../data/demoAlbums";
import { demoPlaylists } from "../data/demoPlaylists";
import { demoGenres } from "../data/demoGenres";
import { normalizeTrack } from "../utils/normalizeTrack";
import { rankTracks, rankSearchResults } from "../utils/ranking";
import { searchAudiusTracks } from "../api/audius";

const filters = ["Songs", "Artists", "Albums", "Playlists", "Genres", "Downloadable"];
const tracks = demoTracks.map((track) => normalizeTrack(track, "demo"));

function scoreEntity(query, values) {
  const normalized = query.trim().toLowerCase();
  const haystack = values.join(" ").toLowerCase();
  if (!normalized) return 1;
  return haystack.includes(normalized) ? 100 + normalized.length : 0;
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const qParam = searchParams.get("q") || "";
  const [query, setQuery] = useState(qParam);
  const [debouncedQuery, setDebouncedQuery] = useState(qParam);
  const [activeFilter, setActiveFilter] = useState("Songs");

  // Seed the box when arriving with a ?q= (e.g. submitted from the Home bar).
  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  // Debounce so we don't hit the Audius API on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(id);
  }, [query]);

  // Real, playable songs from Audius (falls back to demo inside the adapter).
  const { data: liveSongs = [], isFetching } = useQuery({
    queryKey: ["audius-search", debouncedQuery],
    queryFn: () => searchAudiusTracks(debouncedQuery)
  });

  const results = useMemo(() => {
    // Prefer live Audius results (re-ranked so originals beat remixes); while
    // they load, show ranked demo tracks.
    const baseSongs = liveSongs.length
      ? rankSearchResults(debouncedQuery, liveSongs)
      : rankTracks(query, tracks);
    const filteredSongs = activeFilter === "Downloadable"
      ? baseSongs.filter((track) => track.isDownloadable)
      : baseSongs;

    const albums = demoAlbums
      .map((album) => ({ item: album, score: scoreEntity(query, [album.title, album.artist, album.genre, album.mood, ...(album.tags || [])]) }))
      .filter(({ score }) => !query || score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);

    const playlists = demoPlaylists
      .map((playlist) => ({ item: playlist, score: scoreEntity(query, [playlist.title, playlist.subtitle, playlist.genre, playlist.mood, ...(playlist.tags || [])]) }))
      .filter(({ score }) => !query || score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);

    const genres = demoGenres
      .map((genre) => ({ item: genre, score: scoreEntity(query, [genre.label, genre.description, ...(genre.tags || [])]) }))
      .filter(({ score }) => !query || score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);

    const topCandidates = [
      filteredSongs[0] ? { kind: "track", item: filteredSongs[0], score: filteredSongs[0].popularity || 50 } : null,
      albums[0] ? { kind: "album", item: albums[0], score: 80 } : null,
      playlists[0] ? { kind: "playlist", item: playlists[0], score: 78 } : null,
      genres[0] ? { kind: "genre", item: genres[0], score: 60 } : null
    ].filter(Boolean);

    topCandidates.sort((a, b) => b.score - a.score);

    return {
      topResult: topCandidates[0] || null,
      songs: filteredSongs,
      albums,
      playlists,
      genres
    };
  }, [activeFilter, query, debouncedQuery, liveSongs]);

  return (
    <div className="space-y-5">
      <div className="sticky top-[65px] z-20 space-y-3 bg-[#0a0a0f] pb-2 pt-1 xl:top-0">
        <h1 className="font-display text-2xl font-semibold text-white">Search</h1>
        {/* Desktop (xl+) already has a persistent search bar in the top header,
            so only show this one on smaller screens to avoid a duplicate. */}
        <div className="xl:hidden">
          <SearchBar value={query} onChange={setQuery} placeholder="Search songs, artists, moods..." large />
        </div>
        <div className="feed-scroll flex gap-2 overflow-x-auto pb-1">
          {filters.map((filter) => (
            <GenreChip key={filter} label={filter} active={filter === activeFilter} onClick={() => setActiveFilter(filter)} />
          ))}
        </div>
      </div>

      {isFetching && query ? (
        <p className="text-xs text-accent-300">Searching live music…</p>
      ) : null}

      <SearchResults {...results} />
    </div>
  );
}
