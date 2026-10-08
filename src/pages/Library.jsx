import { useRef } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import { FolderUp, History, ListMusic, Plus, ThumbsUp } from "lucide-react";
import MediaCard from "../components/music/MediaCard";
import SongRow from "../components/music/SongRow";
import Artwork from "../components/media/Artwork";
import { useLibraryStore } from "../store/libraryStore";
import { useDownloadsStore } from "../store/downloadsStore";
import { useUiStore } from "../store/uiStore";

const TABS = [
  { id: "playlists", label: "Playlists" },
  { id: "songs", label: "Songs" },
  { id: "albums", label: "Albums" },
  { id: "artists", label: "Artists" },
  { id: "downloads", label: "Downloads" }
];

function Empty({ children }) {
  return <p className="py-16 text-center text-yt-muted">{children}</p>;
}

function Grid({ children }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 [&>*]:!w-full">
      {children}
    </div>
  );
}

// A tile for one of your own playlists (or the pinned Liked Music).
function OwnPlaylistTile({ to, title, subtitle, tracks, icon: Icon }) {
  return (
    <Link to={to} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-md bg-white/[0.07]">
        {tracks[0] ? (
          <Artwork src={tracks[0].artwork} className="h-full w-full transition group-hover:brightness-75" />
        ) : null}
        <span
          className={clsx(
            "absolute inset-0 flex items-center justify-center",
            tracks[0] ? "bg-black/30" : "text-yt-muted"
          )}
        >
          <Icon size={40} />
        </span>
      </div>
      <p className="mt-2 truncate text-[15px] font-medium">{title}</p>
      <p className="truncate text-sm text-yt-muted">{subtitle}</p>
    </Link>
  );
}

function PlaylistsTab() {
  const playlists = useLibraryStore((state) => state.playlists);
  const savedPlaylists = useLibraryStore((state) => state.savedPlaylists);
  const liked = useLibraryStore((state) => state.liked);
  const profileName = useLibraryStore((state) => state.profileName);
  const openCreatePlaylist = useUiStore((state) => state.openCreatePlaylist);

  return (
    <Grid>
      <button onClick={() => openCreatePlaylist()} className="group block self-start text-left">
        <div className="flex aspect-square items-center justify-center rounded-md bg-white/[0.07] transition group-hover:bg-white/[0.15]">
          <Plus size={44} />
        </div>
        <p className="mt-2 text-[15px] font-medium">New playlist</p>
      </button>
      <OwnPlaylistTile
        to="/library/liked"
        title="Liked Music"
        subtitle={`Auto playlist • ${liked.length} songs`}
        tracks={liked}
        icon={ThumbsUp}
      />
      {playlists.map((playlist) => (
        <OwnPlaylistTile
          key={playlist.id}
          to={`/library/playlist/${playlist.id}`}
          title={playlist.title}
          subtitle={`${profileName || "You"} • ${playlist.tracks.length} songs`}
          tracks={playlist.tracks}
          icon={ListMusic}
        />
      ))}
      {savedPlaylists.map((item) => (
        <MediaCard key={item.id} item={item} />
      ))}
    </Grid>
  );
}

function SongsTab() {
  const liked = useLibraryStore((state) => state.liked);
  if (!liked.length) return <Empty>Songs you like show up here. Tap 👍 on any song.</Empty>;
  return (
    <div>
      {liked.map((track, i) => (
        <SongRow
          key={track.id}
          track={track}
          tracks={liked}
          position={i}
          from={{ label: "Liked Music", path: "/library/liked" }}
        />
      ))}
    </div>
  );
}

function SavedTab({ kind }) {
  const items = useLibraryStore((state) => (kind === "album" ? state.savedAlbums : state.subscriptions));
  if (!items.length) {
    return (
      <Empty>
        {kind === "album"
          ? "Albums you save to your library show up here."
          : "Artists you subscribe to show up here."}
      </Empty>
    );
  }
  return (
    <Grid>
      {items.map((item) => (
        <MediaCard key={item.id} item={item} />
      ))}
    </Grid>
  );
}

function DownloadsTab() {
  const items = useDownloadsStore((state) => state.items);
  const importFiles = useDownloadsStore((state) => state.importFiles);
  const toast = useUiStore((state) => state.toast);
  const input = useRef(null);
  const tracks = items.map((item) => item.track);
  const megabytes = items.reduce((sum, item) => sum + (item.size || 0), 0) / 1e6;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-yt-muted">
          {items.length} songs • {megabytes.toFixed(0)} MB on this device. Downloads play with no internet.
        </p>
        <button className="pill-outline" onClick={() => input.current?.click()}>
          <FolderUp size={18} /> Import from device
        </button>
        <input
          ref={input}
          type="file"
          accept="audio/*"
          multiple
          hidden
          onChange={async (event) => {
            const files = [...event.target.files];
            event.target.value = "";
            const added = await importFiles(files);
            toast(added ? `Imported ${added} songs` : "No audio files were selected");
          }}
        />
      </div>
      {tracks.length ? (
        tracks.map((track, i) => (
          <SongRow
            key={track.id}
            track={track}
            tracks={tracks}
            position={i}
            from={{ label: "Downloads", path: "/library/downloads" }}
          />
        ))
      ) : (
        <Empty>Download songs from the ⋮ menu to listen offline, or import audio files from this device.</Empty>
      )}
    </div>
  );
}

export default function Library() {
  const { tab = "playlists" } = useParams();
  const navigate = useNavigate();
  const active = TABS.some((item) => item.id === tab) ? tab : "playlists";

  return (
    <div className="page pt-4">
      <div className="flex items-center justify-between gap-4">
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0">
          {TABS.map((item) => (
            <NavLink
              key={item.id}
              to={item.id === "playlists" ? "/library" : `/library/${item.id}`}
              end
              className={clsx("chip", active === item.id && "chip-active")}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <button className="pill-outline hidden shrink-0 sm:inline-flex" onClick={() => navigate("/history")}>
          <History size={18} /> History
        </button>
      </div>
      <div className="mt-6">
        {active === "playlists" ? <PlaylistsTab /> : null}
        {active === "songs" ? <SongsTab /> : null}
        {active === "albums" ? <SavedTab kind="album" /> : null}
        {active === "artists" ? <SavedTab kind="artist" /> : null}
        {active === "downloads" ? <DownloadsTab /> : null}
      </div>
      <button
        className="pill-outline mt-8 sm:hidden"
        onClick={() => navigate("/history")}
      >
        <History size={18} /> History
      </button>
    </div>
  );
}
