import { useMemo, useState } from "react";
import clsx from "clsx";
import Shelf, { ShelfSkeleton } from "../components/music/Shelf";
import QueryShelf, { collectionCards, songCards } from "../components/music/QueryShelf";
import MediaCard from "../components/music/MediaCard";
import QuickPicks from "../components/music/QuickPicks";
import { Avatar } from "../components/layout/TopBar";
import { MOODS, newReleaseAlbums, playlistsFor, songsFromTopPlaylist } from "../api/feed";
import { buildRadio, getArtistCached } from "../api/radio";
import { fetchAudiusTrending } from "../api/audius";
import { useLibraryStore } from "../store/libraryStore";
import { quickPicksSeed, topArtists } from "../utils/taste";

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function MoodFeed({ mood, languages }) {
  return (
    <>
      <QueryShelf
        title={`${mood.label} songs`}
        queryKey={["mood-songs", mood.slug, languages]}
        queryFn={() => songsFromTopPlaylist(mood.query, languages, 40).then((result) => result.songs)}
        render={(songs) => <QuickPicks tracks={songs.slice(0, 20)} from={{ label: mood.label, path: null }} />}
      />
      <QueryShelf
        title={`${mood.label} playlists`}
        moreTo={`/mood/${mood.slug}`}
        queryKey={["playlists", mood.query, languages]}
        queryFn={() => playlistsFor(mood.query, languages, 20)}
        render={collectionCards}
      />
      {languages.slice(0, 2).map((lang) => (
        <QueryShelf
          key={lang}
          title={`${mood.label} • ${capitalize(lang)}`}
          queryKey={["playlists", `${lang} ${mood.query}`, []]}
          queryFn={() => playlistsFor(`${lang} ${mood.query}`, [], 16)}
          render={collectionCards}
        />
      ))}
    </>
  );
}

function ForYouFeed({ languages }) {
  const liked = useLibraryStore((state) => state.liked);
  const history = useLibraryStore((state) => state.history);
  const playCounts = useLibraryStore((state) => state.playCounts);
  const disliked = useLibraryStore((state) => state.disliked);
  const profileName = useLibraryStore((state) => state.profileName);

  // Most-played among recent plays — what you'd actually go back to.
  const listenAgain = useMemo(() => {
    const recent = history.slice(0, 60).map((entry, index) => ({
      track: entry.track,
      score: (playCounts[entry.track.id] || 1) * 2 + (60 - index) / 10
    }));
    return recent.sort((a, b) => b.score - a.score).slice(0, 20).map((entry) => entry.track);
  }, [history, playCounts]);

  const seed = quickPicksSeed({ liked, history });
  const artists = useMemo(() => topArtists({ liked, history, playCounts }, 8), [liked, history, playCounts]);
  const favourite = artists[0];

  return (
    <>
      {listenAgain.length >= 4 ? (
        <Shelf title="Listen again" strapline={profileName || undefined} avatar={<Avatar size={44} />}>
          {listenAgain.map((track, i) => (
            <MediaCard
              key={track.id}
              item={track}
              tracks={listenAgain}
              position={i}
              size="sm"
              from={{ label: "Listen again", path: "/history" }}
            />
          ))}
        </Shelf>
      ) : null}

      <QueryShelf
        title="Quick picks"
        strapline={seed ? `Based on ${seed.title}` : "Popular right now"}
        queryKey={["quick-picks", seed?.id || "trending", languages]}
        queryFn={async () => {
          if (seed) {
            const radio = await buildRadio(seed, { exclude: new Set(disliked), limit: 20 });
            if (radio.length >= 8) return radio;
          }
          return (await songsFromTopPlaylist("trending today", languages, 20)).songs;
        }}
        render={(songs) => <QuickPicks tracks={songs} from={{ label: "Quick picks", path: null }} />}
      />

      {artists.length >= 2 ? (
        <Shelf title="Mixed for you">
          {artists.map((artist) => (
            <MediaCard
              key={artist.id}
              item={{
                kind: "mix",
                id: `mix-${artist.id}`,
                title: `${artist.name} Mix`,
                subtitle: `${artist.name} and similar artists`,
                artwork: artist.seed.artwork,
                seed: artist.seed
              }}
            />
          ))}
        </Shelf>
      ) : null}

      <QueryShelf
        title="Trending now"
        queryKey={["trending-songs", languages]}
        queryFn={() => songsFromTopPlaylist("trending today", languages, 30).then((result) => result.songs)}
        render={songCards({ label: "Trending now", path: null })}
      />
      <QueryShelf
        title="Top charts"
        moreTo="/explore"
        queryKey={["playlists", "top 50", languages]}
        queryFn={() => playlistsFor("top 50", languages, 16)}
        render={collectionCards}
      />
      <QueryShelf
        title="New releases"
        moreTo="/explore"
        queryKey={["new-albums", languages]}
        queryFn={() => newReleaseAlbums(languages)}
        render={collectionCards}
      />
      {favourite ? (
        <QueryShelf
          title={`Because you listen to ${favourite.name}`}
          queryKey={["similar-artists", favourite.id]}
          queryFn={async () => (await getArtistCached(favourite.id)).similar}
          round
          render={collectionCards}
        />
      ) : null}
      {["romance", "party", "relax"].map((slug) => {
        const mood = MOODS.find((item) => item.slug === slug);
        return (
          <QueryShelf
            key={slug}
            title={`${mood.label} picks`}
            moreTo={`/mood/${slug}`}
            queryKey={["playlists", mood.query, languages]}
            queryFn={() => playlistsFor(mood.query, languages, 16)}
            render={collectionCards}
          />
        );
      })}
      <QueryShelf
        title="Indie & community uploads"
        strapline="From the Audius network"
        queryKey={["audius-trending"]}
        queryFn={() => fetchAudiusTrending(20)}
        render={songCards({ label: "Community uploads", path: null })}
      />
    </>
  );
}

export default function Home() {
  const [chip, setChip] = useState(null);
  const languages = useLibraryStore((state) => state.languages);
  const hydrated = useLibraryStore((state) => state.hydrated);
  const mood = MOODS.find((item) => item.slug === chip);

  return (
    <div className="page">
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 py-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        {MOODS.map((item) => (
          <button
            key={item.slug}
            className={clsx("chip", chip === item.slug && "chip-active")}
            onClick={() => setChip(chip === item.slug ? null : item.slug)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {!hydrated ? (
        <>
          <ShelfSkeleton />
          <ShelfSkeleton />
        </>
      ) : mood ? (
        <MoodFeed key={mood.slug} mood={mood} languages={languages} />
      ) : (
        <ForYouFeed languages={languages} />
      )}
    </div>
  );
}
