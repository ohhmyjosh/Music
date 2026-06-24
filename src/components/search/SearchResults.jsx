import TrackRow from "../music/TrackRow";
import TrackCard from "../music/TrackCard";
import PlaylistCard from "../music/PlaylistCard";
import GenreChip from "../music/GenreChip";

export default function SearchResults({ topResult, songs = [], albums = [], playlists = [], genres = [] }) {
  const openPlaceholder = () => window.alert("Album view coming soon.");

  if (!topResult && !songs.length && !albums.length && !playlists.length && !genres.length) {
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
                onOpen={openPlaceholder}
              />
            </div>
          )}
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-white">Songs</h2>
        <div className="space-y-3">
          {songs.slice(0, 6).map((track) => (
            <TrackRow key={track.id} track={track} queue={songs} />
          ))}
        </div>
      </section>

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
              onOpen={openPlaceholder}
            />
          ))}
        </div>
      </section>

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
              onOpen={openPlaceholder}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-white">Genres</h2>
        <div className="flex flex-wrap gap-2">
          {genres.slice(0, 8).map((genre) => (
            <GenreChip key={genre.id} label={genre.label} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-white">More songs</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {songs.slice(0, 4).map((track) => (
            <TrackCard key={`${track.id}-card`} track={track} queue={songs} />
          ))}
        </div>
      </section>
    </div>
  );
}
