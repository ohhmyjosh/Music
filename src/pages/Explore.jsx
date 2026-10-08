import { Link } from "react-router-dom";
import { BarChart3, Disc3, Smile } from "lucide-react";
import QueryShelf, { collectionCards, songCards } from "../components/music/QueryShelf";
import { GENRES, MOODS, newReleaseAlbums, playlistsFor, songsFromTopPlaylist } from "../api/feed";
import { fetchAudiusTrending } from "../api/audius";
import { useLibraryStore } from "../store/libraryStore";

const MOOD_COLORS = ["#7c3aed", "#0ea5e9", "#f43f5e", "#10b981", "#f59e0b", "#ec4899", "#6366f1", "#64748b", "#14b8a6", "#8b5cf6"];

function CategoryTile({ to, label, color }) {
  return (
    <Link
      to={to}
      className="flex h-12 items-center overflow-hidden rounded-md bg-white/[0.07] text-[15px] font-medium transition-colors hover:bg-white/[0.15]"
    >
      <span className="h-full w-1.5 shrink-0" style={{ background: color }} />
      <span className="truncate px-4">{label}</span>
    </Link>
  );
}

function jump(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Explore() {
  const languages = useLibraryStore((state) => state.languages);

  return (
    <div className="page">
      <div className="grid gap-3 pt-4 sm:grid-cols-3 sm:gap-6">
        {[
          { id: "new-releases", label: "New releases", icon: Disc3 },
          { id: "charts", label: "Charts", icon: BarChart3 },
          { id: "moods", label: "Moods & genres", icon: Smile }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => jump(id)}
            className="flex h-14 items-center gap-4 rounded-lg bg-white/[0.07] px-5 text-left text-base font-medium hover:bg-white/[0.15] sm:h-16 sm:text-lg"
          >
            <Icon size={24} />
            {label}
          </button>
        ))}
      </div>

      <div id="new-releases" className="scroll-mt-20">
        <QueryShelf
          title="New albums & singles"
          queryKey={["new-albums", languages]}
          queryFn={() => newReleaseAlbums(languages)}
          render={collectionCards}
        />
      </div>

      <div id="charts" className="scroll-mt-20">
        <QueryShelf
          title="Top charts"
          queryKey={["playlists", "top 50", languages]}
          queryFn={() => playlistsFor("top 50", languages, 20)}
          render={collectionCards}
        />
      </div>

      <QueryShelf
        title="Trending"
        queryKey={["trending-songs", languages]}
        queryFn={() => songsFromTopPlaylist("trending today", languages, 30).then((result) => result.songs)}
        render={songCards({ label: "Trending", path: null })}
      />

      <section id="moods" className="mt-10 scroll-mt-20">
        <h2 className="mb-4 text-2xl font-bold sm:text-[28px]">Moods & genres</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {MOODS.map((mood, i) => (
            <CategoryTile
              key={mood.slug}
              to={`/mood/${mood.slug}`}
              label={mood.label}
              color={MOOD_COLORS[i % MOOD_COLORS.length]}
            />
          ))}
          {GENRES.map((genre) => (
            <CategoryTile key={genre.slug} to={`/mood/${genre.slug}`} label={genre.label} color={genre.color} />
          ))}
        </div>
      </section>

      <QueryShelf
        title="Fresh editorial playlists"
        queryKey={["playlists", "new releases", languages]}
        queryFn={() => playlistsFor("new releases", languages, 16)}
        render={collectionCards}
      />

      <QueryShelf
        title="Trending on Audius"
        strapline="Independent artists"
        queryKey={["audius-trending"]}
        queryFn={() => fetchAudiusTrending(20)}
        render={songCards({ label: "Trending on Audius", path: null })}
      />
    </div>
  );
}
