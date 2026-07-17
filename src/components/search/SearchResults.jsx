import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import TrackRow from "../music/TrackRow";
import PlaylistCard from "../music/PlaylistCard";
import GenreChip from "../music/GenreChip";

export default function SearchResults({
  topResult,
  songs = [],
  remixes = [],
  albums = [],
  playlists = [],
  genres = []
}) {
  const [showRemixes, setShowRemixes] = useState(false);
  const [songLimit, setSongLimit] = useState(8);

  // New search -> collapse the remix bucket and reset pagination.
  useEffect(() => {
    setShowRemixes(false);
    setSongLimit(8);
  }, [songs, remixes]);

  if (!topResult && !songs.length && !remixes.length && !albums.length && !playlists.length && !genres.length) {
    return (
      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-slate-400">
        Try a mood, artist, genre, or keyword to discover tracks.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {topResult ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-white">Top result</h2>
          {topResult.kind === "track" ? (
            <TrackRow track={topResult.item} queue={songs} />
          ) : (
            <div className="max-w-[230px]">
              <PlaylistCard
                title={topResult.item.title || topResult.item.label}
                subtitle={topResult.item.subtitle || topResult.item.description || topResult.item.artist}
                artwork={topResult.item.image}
                tracks={topResult.item.tracks || songs}
                badge={topResult.kind === "album" ? "Album" : topResult.kind === "playlist" ? "Playlist" : "Genre"}
              />
            </div>
          )}
        </section>
      ) : null}

      {songs.length ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-white">Songs</h2>
          <div className="space-y-3">
            {songs.slice(0, songLimit).map((track) => (
              <TrackRow key={track.id} track={track} queue={songs} />
            ))}
          </div>
          {songs.length > songLimit ? (
            <button
              className="flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
              onClick={() => setSongLimit((limit) => limit + 8)}
            >
              <ChevronDown size={14} /> Show more songs
            </button>
          ) : null}
        </section>
      ) : null}

      {remixes.length ? (
        <section className="space-y-3">
          <button
            className="flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white"
            onClick={() => setShowRemixes((open) => !open)}
          >
            {showRemixes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showRemixes ? "Hide" : "Show"} {remixes.length} remix{remixes.length === 1 ? "" : "es"} &amp; covers
          </button>
          {showRemixes ? (
            <div className="space-y-3">
              {remixes.slice(0, 12).map((track) => (
                <TrackRow key={track.id} track={track} queue={remixes} />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {albums.length ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-white">Albums</h2>
          <div className="feed-scroll flex gap-3 overflow-x-auto pb-1">
            {albums.slice(0, 6).map((album) => (
              <PlaylistCard
                key={album.id}
                title={album.title}
                subtitle={`${album.artist} - ${album.year}`}
                artwork={album.image}
                tracks={songs.filter((track) => track.album === album.title)}
                badge="Album"
              />
            ))}
          </div>
        </section>
      ) : null}

      {playlists.length ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-white">Playlists</h2>
          <div className="feed-scroll flex gap-3 overflow-x-auto pb-1">
            {playlists.slice(0, 6).map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                title={playlist.title}
                subtitle={playlist.subtitle}
                artwork={playlist.image}
                tracks={playlist.tracks}
                badge="Playlist"
              />
            ))}
          </div>
        </section>
      ) : null}

      {genres.length ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-white">Genres</h2>
          <div className="flex flex-wrap gap-2">
            {genres.slice(0, 8).map((genre) => (
              <GenreChip key={genre.id} label={genre.label} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
