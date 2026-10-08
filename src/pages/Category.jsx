import { Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import MediaCard from "../components/music/MediaCard";
import QueryShelf from "../components/music/QueryShelf";
import QuickPicks from "../components/music/QuickPicks";
import { ShelfSkeleton } from "../components/music/Shelf";
import { findCategory, playlistsFor, songsFromTopPlaylist } from "../api/feed";
import { useLibraryStore } from "../store/libraryStore";

// A mood or genre from Explore: its top songs, then every matching playlist.
export default function Category() {
  const { slug } = useParams();
  const category = findCategory(slug);
  const languages = useLibraryStore((state) => state.languages);
  const { data: playlists, isLoading } = useQuery({
    queryKey: ["category-playlists", slug, languages],
    queryFn: () => playlistsFor(category.query, languages, 40),
    enabled: Boolean(category)
  });

  if (!category) return <Navigate to="/explore" replace />;

  return (
    <div className="page">
      <h1 className="pb-2 pt-6 text-4xl font-bold sm:text-5xl">{category.label}</h1>
      <QueryShelf
        title="Songs"
        queryKey={["mood-songs", slug, languages]}
        queryFn={() => songsFromTopPlaylist(category.query, languages, 40).then((result) => result.songs)}
        render={(songs) => <QuickPicks tracks={songs.slice(0, 24)} from={{ label: category.label, path: `/mood/${slug}` }} />}
      />
      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold sm:text-[28px]">Playlists</h2>
        {isLoading ? (
          <ShelfSkeleton title={false} />
        ) : playlists?.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {playlists.map((playlist) => (
              <MediaCard key={playlist.id} item={playlist} className="!w-full" />
            ))}
          </div>
        ) : (
          <p className="text-yt-muted">No playlists found for this mood right now.</p>
        )}
      </section>
    </div>
  );
}
