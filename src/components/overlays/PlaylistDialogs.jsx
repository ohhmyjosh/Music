import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListMusic, Plus, X } from "lucide-react";
import Artwork from "../media/Artwork";
import { useUiStore } from "../../store/uiStore";
import { useLibraryStore } from "../../store/libraryStore";

function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[85vh] w-full animate-pop-in flex-col rounded-t-2xl bg-yt-menu shadow-2xl ring-1 ring-white/10 sm:max-w-md sm:rounded-xl"
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button className="icon-btn -mr-2" aria-label="Close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}

function SaveDialog({ tracks }) {
  const close = useUiStore((state) => state.closeSaveDialog);
  const openCreate = useUiStore((state) => state.openCreatePlaylist);
  const toast = useUiStore((state) => state.toast);
  const playlists = useLibraryStore((state) => state.playlists);
  const addToPlaylist = useLibraryStore((state) => state.addToPlaylist);

  const save = (playlist) => {
    const added = addToPlaylist(playlist.id, tracks);
    close();
    if (!added) toast(`Already in "${playlist.title}"`);
    else toast(`Saved to "${playlist.title}"`);
  };

  return (
    <Modal title="Save to playlist" onClose={close}>
      <button
        className="mb-2 flex w-full items-center gap-4 rounded-md p-2 text-left hover:bg-white/10"
        onClick={() => openCreate(tracks)}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded bg-white/10">
          <Plus size={22} />
        </span>
        <span className="font-medium">New playlist</span>
      </button>
      {playlists.length ? (
        playlists.map((playlist) => (
          <button
            key={playlist.id}
            className="flex w-full items-center gap-4 rounded-md p-2 text-left hover:bg-white/10"
            onClick={() => save(playlist)}
          >
            {playlist.tracks[0] ? (
              <Artwork src={playlist.tracks[0].artworkSmall || playlist.tracks[0].artwork} className="h-12 w-12 rounded" />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded bg-white/10 text-yt-muted">
                <ListMusic size={20} />
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate font-medium">{playlist.title}</span>
              <span className="block text-sm text-yt-muted">{playlist.tracks.length} songs</span>
            </span>
          </button>
        ))
      ) : (
        <p className="p-2 text-sm text-yt-muted">You haven't made any playlists yet.</p>
      )}
    </Modal>
  );
}

function CreateDialog({ tracks }) {
  const close = useUiStore((state) => state.closeCreatePlaylist);
  const toast = useUiStore((state) => state.toast);
  const createPlaylist = useLibraryStore((state) => state.createPlaylist);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const input = useRef(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  const create = (event) => {
    event.preventDefault();
    if (!title.trim()) return;
    const id = createPlaylist(title, tracks, description.trim());
    close();
    toast(tracks.length ? `Saved to "${title.trim()}"` : `Created "${title.trim()}"`);
    if (!tracks.length) navigate(`/library/playlist/${id}`);
  };

  return (
    <Modal
      title="New playlist"
      onClose={close}
      footer={
        <>
          <button className="pill-btn text-white hover:bg-white/10" onClick={close}>
            Cancel
          </button>
          <button className="pill-primary" form="create-playlist" disabled={!title.trim()}>
            Create
          </button>
        </>
      }
    >
      <form id="create-playlist" onSubmit={create} className="space-y-5 pt-2">
        <label className="block">
          <span className="text-xs text-yt-muted">Title</span>
          <input
            ref={input}
            value={title}
            maxLength={150}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full border-b border-white/30 bg-transparent py-1.5 text-base outline-none focus:border-white"
          />
        </label>
        <label className="block">
          <span className="text-xs text-yt-muted">Description</span>
          <input
            value={description}
            maxLength={500}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1 w-full border-b border-white/30 bg-transparent py-1.5 text-base outline-none focus:border-white"
          />
        </label>
      </form>
    </Modal>
  );
}

export default function PlaylistDialogs() {
  const saveTarget = useUiStore((state) => state.saveTarget);
  const createPlaylist = useUiStore((state) => state.createPlaylist);
  return (
    <>
      {saveTarget ? <SaveDialog tracks={saveTarget} /> : null}
      {createPlaylist ? <CreateDialog tracks={createPlaylist.tracks} /> : null}
    </>
  );
}
