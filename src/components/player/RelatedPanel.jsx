import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Artwork from "../media/Artwork";
import SongRow from "../music/SongRow";
import { RowsSkeleton } from "../music/Shelf";
import { getRelated } from "../../api/radio";
import { usePlayerStore } from "../../store/playerStore";
import { useUiStore } from "../../store/uiStore";
import { formatCount } from "../../utils/track";

function Heading({ children }) {
  return <h3 className="mb-3 mt-6 px-2 text-lg font-bold first:mt-2">{children}</h3>;
}

// "Related": songs like this one, similar artists, the artist's albums and bio.
export default function RelatedPanel() {
  const track = usePlayerStore((state) => state.currentTrack);
  const closeNowPlaying = useUiStore((state) => state.closeNowPlaying);
  const [bioOpen, setBioOpen] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["related", track?.id],
    queryFn: () => getRelated(track),
    enabled: Boolean(track) && track.source !== "local"
  });

  if (isLoading) return <RowsSkeleton rows={8} />;
  if (isError || !data) {
    return <p className="p-8 text-center text-yt-muted">Nothing related to show for this song.</p>;
  }

  return (
    <div className="h-full overflow-y-auto pb-6">
      {data.songs.length ? (
        <>
          <Heading>You might also like</Heading>
          {data.songs.map((song, i) => (
            <SongRow
              key={song.id}
              track={song}
              tracks={data.songs}
              position={i}
              showAlbum={false}
              from={{ label: `Related to ${track.title}`, path: null }}
            />
          ))}
        </>
      ) : null}

      {data.similar.length ? (
        <>
          <Heading>Similar artists</Heading>
          <div className="no-scrollbar flex gap-4 overflow-x-auto px-2">
            {data.similar.map((artist) => (
              <Link
                key={artist.id}
                to={`/artist/${artist.id}`}
                onClick={closeNowPlaying}
                className="w-24 shrink-0 text-center"
              >
                <Artwork src={artist.artwork} className="aspect-square w-24 rounded-full" />
                <p className="mt-2 line-clamp-2 text-sm">{artist.title}</p>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      {data.albums.length ? (
        <>
          <Heading>More from {data.artist?.title}</Heading>
          <div className="no-scrollbar flex gap-4 overflow-x-auto px-2">
            {data.albums.map((album) => (
              <Link key={album.id} to={`/album/${album.id}`} onClick={closeNowPlaying} className="w-32 shrink-0">
                <Artwork src={album.artwork} className="aspect-square w-32 rounded" />
                <p className="mt-2 line-clamp-2 text-sm font-medium">{album.title}</p>
                <p className="text-xs text-yt-muted">{album.year}</p>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      {data.artist ? (
        <>
          <Heading>About the artist</Heading>
          <Link
            to={`/artist/${data.artist.id}`}
            onClick={closeNowPlaying}
            className="mx-2 flex items-center gap-4 rounded-lg bg-white/[0.06] p-4 hover:bg-white/10"
          >
            <Artwork src={data.artist.artwork} className="h-16 w-16 rounded-full" />
            <div>
              <p className="text-lg font-bold">{data.artist.title}</p>
              {data.artist.followers ? (
                <p className="text-sm text-yt-muted">{formatCount(data.artist.followers)} followers</p>
              ) : null}
            </div>
          </Link>
          {data.artist.bio ? (
            <div className="mx-2 mt-3 text-sm leading-6 text-white/80">
              <p className={bioOpen ? "" : "line-clamp-4"}>{data.artist.bio}</p>
              <button className="mt-1 font-medium text-white" onClick={() => setBioOpen((open) => !open)}>
                {bioOpen ? "Show less" : "Show more"}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
