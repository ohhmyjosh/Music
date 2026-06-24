import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "../components/search/SearchBar";
import SearchResults from "../components/search/SearchResults";
import { searchAudiusTracks } from "../api/audius";
import { fetchJamendoTrending } from "../api/jamendo";
import { rankTracks } from "../utils/ranking";

export default function SearchPage() {
  const [query, setQuery] = useState("");

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
    const merged = query.trim() ? audiusResults : jamendoFallback;
    return rankTracks(query, merged);
  }, [audiusResults, jamendoFallback, query]);

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6 lg:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-accent-300">Search</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-white">Search free music with a polished frontend shell.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
          Josh-Fy blends reusable API adapters with a strong UI layer. Query Audius when available and fall back to
          curated seed data for a stable portfolio experience.
        </p>
        <div className="mt-6">
          <SearchBar value={query} onChange={setQuery} placeholder="Try synthwave, indie, rain, late-night, or an artist..." />
        </div>
      </section>

      <SearchResults tracks={results} />
    </div>
  );
}
