import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, Download, LibraryBig, Plus } from "lucide-react";
import CollectionHeader from "../components/music/CollectionHeader";
import SongRow from "../components/music/SongRow";
import MenuButton from "../components/music/MenuButton";
import { RowsSkeleton } from "../components/music/Shelf";
import { albumQuery, playlistQuery } from "../lib/queries";
import { usePlayerStore } from "../store/playerStore";
import { useLibraryStore } from "../store/libraryStore";
import { useDownloadsStore } from "../store/downloadsStore";
import { useUiStore } from "../store/uiStore";
import { totalDuration } from "../utils/track";

export function DownloadAllButton({ tracks }) {
  const items = useDownloadsStore((state) => state.items);
  const download = useDownloadsStore((state) => state.download);
  const toast = useUiStore((state) => state.toast);
  const streamable = tracks.filter((track) => track.source !== "local" && track.audioUrl);
  const have = new Set(items.map((item) => item.track.id));
  const missing = streamable.filter((track) => !have.has(track.id));
  if (!streamable.length) return null;
  const done = !missing.length;

  return (
    <button
      className="icon-btn border border-white/20"
      aria-label={done ? "Downloaded" : "Download all"}
      title={done ? "Downloaded" : "Download all"}
      disabled={done}
      onClick={async () => {
        toast(`Downloading ${missing.length} songs…`);
        let failed = 0;
        for (const track of missing) {
          await download(track).catch(() => {
            failed += 1;
          });
        }
        toast(failed ? `${failed} songs couldn't be downloaded` : "All songs are available offline");
      }}
    >
      {done ? <Check size={20} /> : <Download size={20} />}
    </button>
  );
}

function SaveButton({ item }) {
  const saved = useLibraryStore((state) =>
    (item.kind === "album" ? state.savedAlbums : state.savedPlaylists).some((entry) => entry.id === item.id)
  );
  const toggleSaved = useLibraryStore((state) => state.toggleSaved);
  const toast = useUiStore((state) => state.toast);
  return (
    <button
      className="pill-outline h-10 px-4"
      onClick={() => toast(toggleSaved(item) ? "Saved to library" : "Removed from library")}
    >
      {saved ? <LibraryBig size={18} /> : <Plus size={18} />}
      {saved ? "In library" : "Save"}
    </button>
  );
}

export default function Collection({ kind }) {
  const { id } = useParams();
  const { data, isLoading, isError } = useQuery(kind === "album" ? albumQuery(id) : playlistQuery(id));
  const playTracks = usePlayerStore((state) => state.playTracks);
  const shufflePlay = usePlayerStore((state) => state.shufflePlay);

  if (isLoading) {
    return (
      <div className="page">
        <div className="flex flex-col items-center gap-6 pt-6 md:flex-row md:items-end">
          <div className="skeleton aspect-square w-52 rounded-lg sm:w-60" />
          <div className="w-full flex-1 space-y-3">
            <div className="skeleton h-10 w-2/3 rounded" />
            <div className="skeleton h-4 w-1/3 rounded" />
          </div>
        </div>
        <div className="mt-8">
          <RowsSkeleton rows={10} />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return <p className="page pt-20 text-center text-yt-muted">Couldn't load this {kind}. Check your connection and try again.</p>;
  }

  const tracks = data.songs;
  const from = { label: data.title, path: `/${kind}/${id}` };
  const albumArtists = data.artists?.length
    ? data.artists.map((artist, i) => (
        <span key={artist.id}>
          {i > 0 ? ", " : ""}
          <Link to={`/artist/${artist.id}`} className="text-white hover:underline">
            {artist.name}
          </Link>
        </span>
      ))
    : null;

  return (
    <div className="page">
      <CollectionHeader
        artwork={data.artwork}
        kicker={kind === "album" ? "Album" : "Playlist"}
        title={data.title}
        lines={[
          kind === "album" ? (
            <>
              {albumArtists}
              {data.year ? ` • ${data.year}` : ""}
            </>
          ) : (
            data.subtitle
          ),
          `${tracks.length} songs • ${totalDuration(tracks)}`
        ]}
        onPlay={() => playTracks(tracks, 0, from)}
        onShuffle={() => shufflePlay(tracks, from)}
        actions={
          <>
            <SaveButton item={data} />
            <DownloadAllButton tracks={tracks} />
            <MenuButton item={data} className="border border-white/20" />
          </>
        }
      />
      <div className="mt-8">
        {tracks.map((track, i) => (
          <SongRow
            key={track.id}
            track={track}
            tracks={tracks}
            position={i}
            from={from}
            index={kind === "album" ? i + 1 : undefined}
            showAlbum={kind !== "album"}
          />
        ))}
      </div>
    </div>
  );
}
