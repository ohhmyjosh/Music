import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { History, Play, Radio, X } from "lucide-react";
import SearchBox from "../components/search/SearchBox";
import Artwork from "../components/media/Artwork";
import SongRow from "../components/music/SongRow";
import MediaCard from "../components/music/MediaCard";
import Shelf, { RowsSkeleton } from "../components/music/Shelf";
import { collectionCards } from "../components/music/QueryShelf";
import { searchAlbums, searchArtists, searchPlaylists, searchSongs } from "../api/saavn";
import { searchAudius } from "../api/audius";
import { GENRES, MOODS } from "../api/feed";
import { usePlayerStore } from "../store/playerStore";
import { useLibraryStore } from "../store/libraryStore";
import { loadCollectionTracks, playCollection } from "../lib/queries";
import { formatCount } from "../utils/track";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "songs", label: "Songs" },
  { id: "albums", label: "Albums" },
  { id: "artists", label: "Artists" },
  { id: "playlists", label: "Playlists" },
  { id: "community", label: "Community" }
];

const SEARCHERS = {
  songs: (q) => searchSongs(q, 40),
  albums: (q) => searchAlbums(q, 24),
  artists: (q) => searchArtists(q, 24),
  playlists: (q) => searchPlaylists(q, 24),
  community: (q) => searchAudius(q, 30)
};

function useSearch(kind, q, enabled = true) {
  return useQuery({
    queryKey: ["search", kind, q.toLowerCase()],
    queryFn: () => SEARCHERS[kind](q),
    enabled: enabled && Boolean(q)
  });
}

function normalize(text = "") {
  return text.toLowerCase().replace(/[^a-z0-9ऀ-ॿ]+/g, " ").trim();
}

// YouTube Music leads with one big "Top result": the artist when the query is
// their name, otherwise the best-matching song.
function TopResult({ q, songs, artists }) {
  const startRadio = usePlayerStore((state) => state.startRadio);
  const playTracks = usePlayerStore((state) => state.playTracks);
  const artist = artists?.[0];
  const artistMatch = artist && normalize(artist.title) === normalize(q);
  const song = songs?.[0];

  if (artistMatch) {
    return (
      <div className="flex items-center gap-5 rounded-xl bg-white/[0.06] p-5">
        <Link to={`/artist/${artist.id}`}>
          <Artwork src={artist.artwork} className="h-24 w-24 rounded-full sm:h-28 sm:w-28" />
        </Link>
        <div className="min-w-0">
          <Link to={`/artist/${artist.id}`} className="block truncate text-2xl font-bold hover:underline sm:text-3xl">
            {artist.title}
          </Link>
          <p className="text-sm text-yt-muted">Artist{artist.followers ? ` • ${formatCount(artist.followers)} followers` : ""}</p>
          <div className="mt-4 flex gap-3">
            <button className="pill-primary" onClick={() => playCollection(artist, { shuffle: true })}>
              <Play size={16} fill="currentColor" /> Shuffle
            </button>
            <button
              className="pill-outline"
              onClick={async () => {
                const tracks = await loadCollectionTracks(artist).catch(() => []);
                if (tracks[0]) startRadio(tracks[0], `${artist.title} radio`);
              }}
            >
              <Radio size={16} /> Radio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!song) return null;
  return (
    <div className="flex items-center gap-5 rounded-xl bg-white/[0.06] p-5">
      <Artwork src={song.artwork} className="h-24 w-24 rounded sm:h-28 sm:w-28" />
      <div className="min-w-0">
        <p className="truncate text-2xl font-bold sm:text-3xl">{song.title}</p>
        <p className="truncate text-sm text-yt-muted">Song • {song.artist}</p>
        <div className="mt-4 flex gap-3">
          <button className="pill-primary" onClick={() => playTracks(songs, 0, { label: `Search: ${q}`, path: null })}>
            <Play size={16} fill="currentColor" /> Play
          </button>
          <button className="pill-outline" onClick={() => startRadio(song)}>
            <Radio size={16} /> Radio
          </button>
        </div>
      </div>
    </div>
  );
}

function AllResults({ q, setFilter }) {
  const songs = useSearch("songs", q);
  const albums = useSearch("albums", q);
  const artists = useSearch("artists", q);
  const playlists = useSearch("playlists", q);
  const community = useSearch("community", q);
  const from = { label: `Search: ${q}`, path: null };

  if (songs.isLoading && artists.isLoading) return <RowsSkeleton rows={8} />;

  const nothing =
    !songs.data?.length && !albums.data?.length && !artists.data?.length && !playlists.data?.length && !community.data?.length;
  if (nothing && !songs.isLoading) {
    return <p className="pt-16 text-center text-yt-muted">No results for "{q}". Try different keywords.</p>;
  }

  return (
    <>
      <section className="mt-4">
        <h2 className="mb-4 text-2xl font-bold">Top result</h2>
        <TopResult q={q} songs={songs.data} artists={artists.data} />
      </section>

      {songs.data?.length ? (
        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Songs</h2>
            <button className="pill-outline h-8 px-3" onClick={() => setFilter("songs")}>
              Show all
            </button>
          </div>
          {songs.data.slice(0, 5).map((track, i) => (
            <SongRow key={track.id} track={track} tracks={songs.data} position={i} from={from} />
          ))}
        </section>
      ) : null}

      {artists.data?.length ? <Shelf title="Artists">{collectionCards(artists.data)}</Shelf> : null}
      {albums.data?.length ? <Shelf title="Albums">{collectionCards(albums.data)}</Shelf> : null}
      {playlists.data?.length ? <Shelf title="Playlists">{collectionCards(playlists.data)}</Shelf> : null}
      {community.data?.length ? (
        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Community uploads</h2>
            <button className="pill-outline h-8 px-3" onClick={() => setFilter("community")}>
              Show all
            </button>
          </div>
          {community.data.slice(0, 4).map((track, i) => (
            <SongRow key={track.id} track={track} tracks={community.data} position={i} from={from} showAlbum={false} />
          ))}
        </section>
      ) : null}
    </>
  );
}

function FilteredResults({ q, kind }) {
  const { data = [], isLoading, isError } = useSearch(kind, q);
  const from = { label: `Search: ${q}`, path: null };
  if (isLoading) return <RowsSkeleton rows={12} />;
  if (isError) return <p className="pt-16 text-center text-yt-muted">Search is unavailable right now.</p>;
  if (!data.length) return <p className="pt-16 text-center text-yt-muted">No {kind} found for "{q}".</p>;

  if (kind === "songs" || kind === "community") {
    return data.map((track, i) => (
      <SongRow key={track.id} track={track} tracks={data} position={i} from={from} showAlbum={kind === "songs"} />
    ));
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 pt-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {data.map((item) => (
        <MediaCard key={item.id} item={item} className="!w-full" />
      ))}
    </div>
  );
}

function EmptySearch() {
  const navigate = useNavigate();
  const history = useLibraryStore((state) => state.searchHistory);
  const removeSearch = useLibraryStore((state) => state.removeSearch);
  const clearSearchHistory = useLibraryStore((state) => state.clearSearchHistory);

  return (
    <>
      {history.length ? (
        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent searches</h2>
            <button className="text-sm text-yt-muted hover:text-white" onClick={clearSearchHistory}>
              Clear all
            </button>
          </div>
          {history.map((query) => (
            <div key={query} className="flex items-center gap-4 rounded-md px-2 hover:bg-white/10">
              <History size={20} className="shrink-0 text-yt-muted" />
              <button
                className="min-w-0 flex-1 truncate py-3 text-left"
                onClick={() => navigate(`/search?q=${encodeURIComponent(query)}`)}
              >
                {query}
              </button>
              <button className="icon-btn" aria-label={`Remove ${query}`} onClick={() => removeSearch(query)}>
                <X size={18} />
              </button>
            </div>
          ))}
        </section>
      ) : null}
      <section className="mt-8">
        <h2 className="mb-4 text-xl font-bold">Browse moods & genres</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[...MOODS, ...GENRES].map((item) => (
            <Link
              key={item.slug}
              to={`/mood/${item.slug}`}
              className="flex h-12 items-center overflow-hidden rounded-md bg-white/[0.07] font-medium hover:bg-white/[0.15]"
            >
              <span className="h-full w-1.5 shrink-0" style={{ background: item.color || "#8b5cf6" }} />
              <span className="truncate px-4">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

export default function Search() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const q = (params.get("q") || "").trim();
  const filter = FILTERS.some((item) => item.id === params.get("filter")) ? params.get("filter") : "all";

  const setFilter = (id) => {
    const next = new URLSearchParams(params);
    if (id === "all") next.delete("filter");
    else next.set("filter", id);
    setParams(next);
    window.scrollTo(0, 0);
  };

  return (
    <div className="page">
      {/* Mobile has no top-bar search field, so the page carries its own. */}
      <div className="sticky top-0 z-20 -mx-4 bg-yt-base px-4 pb-2 pt-3 sm:-mx-6 sm:px-6 lg:hidden">
        <SearchBox autoFocus={!q} onBack={() => navigate(-1)} />
      </div>

      {!q ? (
        <EmptySearch />
      ) : (
        <>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 py-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                className={clsx("chip", filter === item.id && "chip-active")}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {filter === "all" ? <AllResults q={q} setFilter={setFilter} /> : <FilteredResults q={q} kind={filter} />}
        </>
      )}
    </div>
  );
}
