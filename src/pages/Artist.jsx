import { useState } from "react";
import { useParams } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { BadgeCheck, Radio, Shuffle } from "lucide-react";
import Shelf from "../components/music/Shelf";
import { collectionCards } from "../components/music/QueryShelf";
import SongRow from "../components/music/SongRow";
import { RowsSkeleton } from "../components/music/Shelf";
import { artistQuery } from "../lib/queries";
import { getArtistSongs } from "../api/saavn";
import { usePlayerStore } from "../store/playerStore";
import { useLibraryStore } from "../store/libraryStore";
import { useUiStore } from "../store/uiStore";
import { formatCount } from "../utils/track";

function AllSongs({ artistId, from }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["artist-songs", artistId],
    queryFn: ({ pageParam }) => getArtistSongs(artistId, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.length ? pages.length : undefined)
  });
  if (isLoading) return <RowsSkeleton rows={6} />;
  const seen = new Set();
  const songs = (data?.pages.flat() || []).filter((song) => (seen.has(song.id) ? false : seen.add(song.id)));
  return (
    <>
      {songs.map((track, i) => (
        <SongRow key={track.id} track={track} tracks={songs} position={i} from={from} />
      ))}
      {hasNextPage ? (
        <button className="pill-outline mt-4" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
          {isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      ) : null}
    </>
  );
}

export default function Artist() {
  const { id } = useParams();
  const { data: artist, isLoading, isError } = useQuery(artistQuery(id));
  const [showAll, setShowAll] = useState(false);
  const [bioOpen, setBioOpen] = useState(false);
  const subscribed = useLibraryStore((state) => state.subscriptions.some((entry) => entry.id === id));
  const toggleSaved = useLibraryStore((state) => state.toggleSaved);
  const toast = useUiStore((state) => state.toast);
  const shufflePlay = usePlayerStore((state) => state.shufflePlay);
  const startRadio = usePlayerStore((state) => state.startRadio);

  if (isLoading) {
    return (
      <div>
        <div className="skeleton h-[40vh] min-h-[260px] w-full" />
        <div className="page mt-8">
          <RowsSkeleton rows={5} />
        </div>
      </div>
    );
  }
  if (isError || !artist) {
    return <p className="page pt-20 text-center text-yt-muted">Couldn't load this artist.</p>;
  }

  const from = { label: artist.title, path: `/artist/${id}` };
  const top = artist.topSongs;

  return (
    <div>
      {/* Banner: the artist photo bleeding under the top bar, like YouTube Music. */}
      <div className="relative -mt-14 h-[48vh] min-h-[300px] max-h-[520px] overflow-hidden lg:-mt-16">
        <img src={artist.artwork} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-yt-base via-yt-base/50 to-black/30" />
        <div className="page absolute inset-x-0 bottom-0 pb-6">
          <h1 className="flex items-center gap-3 text-4xl font-bold sm:text-6xl">
            {artist.title}
            {artist.isVerified ? <BadgeCheck size={28} className="shrink-0 text-accent-300" /> : null}
          </h1>
          {artist.followers ? (
            <p className="mt-2 text-yt-muted">{formatCount(artist.followers)} followers</p>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button className="pill-primary h-10 px-5" disabled={!top.length} onClick={() => shufflePlay(top, from)}>
              <Shuffle size={18} /> Shuffle
            </button>
            <button
              className="pill-outline h-10 px-5"
              disabled={!top.length}
              onClick={() => startRadio(top[0], `${artist.title} radio`)}
            >
              <Radio size={18} /> Radio
            </button>
            <button
              className={clsx("pill-btn h-10 px-5", subscribed ? "bg-white/10 text-white" : "bg-accent-600 text-white hover:bg-accent-500")}
              onClick={() => toast(toggleSaved(artist) ? `Subscribed to ${artist.title}` : "Unsubscribed")}
            >
              {subscribed ? "Subscribed" : "Subscribe"}
            </button>
          </div>
        </div>
      </div>

      <div className="page">
        {top.length ? (
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-2xl font-bold">{showAll ? "All songs" : "Top songs"}</h2>
              <button className="pill-outline h-8 px-3" onClick={() => setShowAll((value) => !value)}>
                {showAll ? "Show top songs" : "Show all"}
              </button>
            </div>
            {showAll ? (
              <AllSongs artistId={id} from={from} />
            ) : (
              top.slice(0, 5).map((track, i) => (
                <SongRow key={track.id} track={track} tracks={top} position={i} from={from} />
              ))
            )}
          </section>
        ) : null}

        {artist.albums.length ? <Shelf title="Albums">{collectionCards(artist.albums)}</Shelf> : null}
        {artist.singles.length ? <Shelf title="Singles">{collectionCards(artist.singles)}</Shelf> : null}
        {artist.similar.length ? <Shelf title="Fans might also like">{collectionCards(artist.similar)}</Shelf> : null}

        {artist.bio ? (
          <section className="mt-10 max-w-3xl">
            <h2 className="mb-3 text-2xl font-bold">About</h2>
            <p className={clsx("whitespace-pre-line leading-7 text-white/80", !bioOpen && "line-clamp-5")}>{artist.bio}</p>
            <button className="mt-2 font-medium" onClick={() => setBioOpen((open) => !open)}>
              {bioOpen ? "Show less" : "Show more"}
            </button>
          </section>
        ) : null}
      </div>
    </div>
  );
}
