export default function PlaylistList({ playlists = [], tracksById = {} }) {
  if (!playlists.length) {
    return (
      <div className="glass-panel rounded-[28px] p-8 text-sm text-slate-400">
        Create playlists to group discoveries, saved tracks, or imported audio.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {playlists.map((playlist) => (
        <article key={playlist.id} className="glass-panel rounded-[28px] p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-accent-300">Playlist</p>
          <h3 className="mt-3 text-xl font-semibold text-white">{playlist.name}</h3>
          <p className="mt-2 text-sm text-slate-400">{playlist.description}</p>
          <div className="mt-5 space-y-2 text-sm text-slate-300">
            {playlist.trackIds.length ? (
              playlist.trackIds.slice(0, 4).map((trackId) => (
                <p key={trackId} className="truncate">
                  {tracksById[trackId]?.title || "Pending track"} by {tracksById[trackId]?.artist || "Unknown"}
                </p>
              ))
            ) : (
              <p className="text-slate-500">No tracks added yet.</p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
