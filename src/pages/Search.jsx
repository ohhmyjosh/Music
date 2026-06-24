import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "../components/search/SearchBar";
import SearchResults from "../components/search/SearchResults";
import GenreChip from "../components/music/GenreChip";
import { searchAudiusTracks } from "../api/audius";
import { fetchJamendoTrending } from "../api/jamendo";
import { rankTracks } from "../utils/ranking";

const filters = ["Songs", "Artists", "Albums", "Playlists", "Genres", "Downloadable"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Songs");

  const { data: audiusResults = [] } = useQuery({
    queryKey: ["search-audius", query],
    queryFn: () => searchAudiusTracks(query),
    staleTime: 1000 * 60 * 3
  });

  const { data: jamendoFallback = [] } = useQuery({
    queryKey: ["search-fallback-jamendo"],
    queryFn: fetchJamendoTrending
  });

  const results = useMemo(() => {
    let merged = query.trim() ? audiusResults : jamendoFallback;
    merged = rankTracks(query, merged);

    if (activeFilter === "Downloadable") {
      return merged.filter((track) => Boolean(track.downloadUrl || track.localOnly));
    }

    return merged;
  }, [activeFilter, audiusResults, jamendoFallback, query]);

  return (
    <div className="space-y-5">
      <div className="sticky top-[65px] z-20 space-y-3 bg-slate-950/95 pb-2 pt-1 backdrop-blur xl:top-0">
        <h1 className="font-display text-2xl font-semibold text-white">Search</h1>
        <SearchBar value={query} onChange={setQuery} placeholder="Search songs, artists, moods..." large />
        <div className="feed-scroll flex gap-2 overflow-x-auto pb-1">
          {filters.map((filter) => (
            <GenreChip key={filter} label={filter} active={filter === activeFilter} onClick={() => setActiveFilter(filter)} />
          ))}
        </div>
      </div>

      <SearchResults tracks={results} />
    </div>
  );
}
