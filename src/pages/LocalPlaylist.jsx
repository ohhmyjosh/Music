import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Pencil, ThumbsUp, Trash2 } from "lucide-react";
import Artwork from "../components/media/Artwork";
import CollectionHeader from "../components/music/CollectionHeader";
import SongRow from "../components/music/SongRow";
import { DownloadAllButton } from "./Collection";
import { usePlayerStore } from "../store/playerStore";
import { useLibraryStore } from "../store/libraryStore";
import { useUiStore } from "../store/uiStore";
import { totalDuration } from "../utils/track";

// YouTube Music builds a playlist cover from its first four songs.
export function Collage({ tracks, className = "w-52 sm:w-60 lg:w-64", liked }) {
  if (liked) {
    return (
      <div className={`flex aspect-square shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-600 to-fuchsia-500 shadow-2xl ${className}`}>
        <ThumbsUp size={72} fill="currentColor" />
      </div>
    );
  }
  const covers = [...new Set(tracks.map((track) => track.artwork).filter(Boolean))].slice(0, 4);
  if (covers.length < 4) {
    return <Artwork src={covers[0]} className={`aspect-square rounded-lg shadow-2xl ${className}`} />;
  }
  return (
    <div className={`grid aspect-square shrink-0 grid-cols-2 overflow-hidden rounded-lg shadow-2xl ${className}`}>
      {covers.map((src) => (
        <Artwork key={src} src={src} className="h-full w-full" />
      ))}
    </div>
  );
}

function EditForm({ playlist, onDone }) {
  const updatePlaylist = useLibraryStore((state) => state.updatePlaylist);
  const [title, setTitle] = useState(playlist.title);
  const [description, setDescription] = useState(playlist.description || "");
  return (
    <form
      className="w-full max-w-xl space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!title.trim()) return;
        updatePlaylist(playlist.id, { title: title.trim(), description: description.trim() });
        onDone();
      }}
    >
      <input
        value={title}
        autoFocus
        maxLength={150}
        onChange={(event) => setTitle(event.target.value)}
        className="w-full border-b border-white/30 bg-transparent py-1 text-3xl font-bold outline-none focus:border-white"
        aria-label="Playlist title"
      />
      <input
        value={description}
        maxLength={500}
        placeholder="Description"
        onChange={(event) => setDescription(event.target.value)}
        className="w-full border-b border-white/30 bg-transparent py-1 outline-none focus:border-white"
        aria-label="Playlist description"
      />
      <div className="flex gap-2">
        <button className="pill-primary">Save</button>
        <button type="button" className="pill-btn hover:bg-white/10" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function LocalPlaylist({ liked = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const playlist = useLibraryStore((state) => (liked ? null : state.playlists.find((item) => item.id === id)));
  const likedTracks = useLibraryStore((state) => state.liked);
  const hydrated = useLibraryStore((state) => state.hydrated);
  const profileName = useLibraryStore((state) => state.profileName);
  const deletePlaylist = useLibraryStore((state) => state.deletePlaylist);
  const movePlaylistTrack = useLibraryStore((state) => state.movePlaylistTrack);
  const toast = useUiStore((state) => state.toast);
  const playTracks = usePlayerStore((state) => state.playTracks);
  const shufflePlay = usePlayerStore((state) => state.shufflePlay);
  const [editing, setEditing] = useState(false);
  const [dragFrom, setDragFrom] = useState(null);

  if (!hydrated) return null;
  if (!liked && !playlist) return <Navigate to="/library" replace />;

  const tracks = liked ? likedTracks : playlist.tracks;
  const title = liked ? "Liked Music" : playlist.title;
  const path = liked ? "/library/liked" : `/library/playlist/${id}`;
  const from = { label: title, path };

  return (
    <div className="page">
      {editing ? (
        <div className="flex flex-col items-center gap-6 pt-6 md:flex-row md:items-end">
          <Collage tracks={tracks} />
          <EditForm playlist={playlist} onDone={() => setEditing(false)} />
        </div>
      ) : (
        <CollectionHeader
          artworkNode={<Collage tracks={tracks} liked={liked} />}
          kicker={liked ? "Auto playlist" : "Playlist"}
          title={title}
          lines={[
            liked ? "Songs you've liked on this device" : `${profileName || "You"} • ${new Date(playlist.createdAt).getFullYear()}`,
            `${tracks.length} songs${tracks.length ? ` • ${totalDuration(tracks)}` : ""}`
          ]}
          description={liked ? "" : playlist.description}
          onPlay={tracks.length ? () => playTracks(tracks, 0, from) : null}
          onShuffle={tracks.length ? () => shufflePlay(tracks, from) : null}
          actions={
            <>
              <DownloadAllButton tracks={tracks} />
              {!liked ? (
                <>
                  <button className="icon-btn border border-white/20" aria-label="Edit playlist" onClick={() => setEditing(true)}>
                    <Pencil size={18} />
                  </button>
                  <button
                    className="icon-btn border border-white/20"
                    aria-label="Delete playlist"
                    onClick={() => {
                      deletePlaylist(id);
                      toast(`Deleted "${title}"`);
                      navigate("/library");
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              ) : null}
            </>
          }
        />
      )}

      <div className="mt-8">
        {tracks.length ? (
          tracks.map((track, i) => (
            <div
              key={track.id}
              draggable={!liked}
              onDragStart={() => setDragFrom(i)}
              onDragOver={(event) => !liked && event.preventDefault()}
              onDrop={() => {
                if (dragFrom !== null && dragFrom !== i) movePlaylistTrack(id, dragFrom, i);
                setDragFrom(null);
              }}
            >
              <SongRow
                track={track}
                tracks={tracks}
                position={i}
                from={from}
                context={liked ? undefined : { playlistId: id }}
              />
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-yt-muted">
            {liked
              ? "Songs you like will show up here. Tap 👍 on anything playing."
              : "This playlist is empty. Use ⋮ → Save to playlist on any song to add it."}
          </div>
        )}
      </div>
    </div>
  );
}
