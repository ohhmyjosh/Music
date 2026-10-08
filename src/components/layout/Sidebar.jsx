import { NavLink, Link } from "react-router-dom";
import clsx from "clsx";
import { Compass, Home, Library, Menu, Pin, Plus } from "lucide-react";
import brandLogo from "../../assets/branding/logo.png";
import { useUiStore } from "../../store/uiStore";
import { useLibraryStore } from "../../store/libraryStore";
import { usePlayerStore } from "../../store/playerStore";
import PlayingBars from "../music/PlayingBars";

export const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/library", label: "Library", icon: Library }
];

export function Brand({ compact = false }) {
  return (
    <Link to="/" className="flex items-center gap-1.5" aria-label="Josh-Fy home">
      <img src={brandLogo} alt="" className="h-8 w-8 rounded-lg object-contain" />
      {!compact ? <span className="font-display text-xl font-bold tracking-tight">Josh-Fy</span> : null}
    </Link>
  );
}

function PlaylistLink({ to, title, subtitle, pinned, playing }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx("group flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10", isActive && "bg-white/10")
      }
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="flex items-center gap-1 truncate text-xs text-yt-muted">
          {pinned ? <Pin size={11} /> : null}
          {subtitle}
        </p>
      </div>
      {playing ? <PlayingBars className="h-3 shrink-0" /> : null}
    </NavLink>
  );
}

export default function Sidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const openCreatePlaylist = useUiStore((state) => state.openCreatePlaylist);
  const playlists = useLibraryStore((state) => state.playlists);
  const savedPlaylists = useLibraryStore((state) => state.savedPlaylists);
  const savedAlbums = useLibraryStore((state) => state.savedAlbums);
  const profileName = useLibraryStore((state) => state.profileName);
  const playingPath = usePlayerStore((state) => (state.isPlaying ? state.playingFrom?.path : null));

  return (
    <aside
      className={clsx(
        "fixed bottom-[var(--player-h)] left-0 top-0 z-40 hidden flex-col bg-yt-base lg:flex",
        collapsed ? "w-[72px]" : "w-60 border-r border-white/10"
      )}
    >
      <div className={clsx("flex h-16 shrink-0 items-center gap-3", collapsed ? "justify-center" : "px-4")}>
        <button className="icon-btn" aria-label="Toggle navigation" onClick={toggleSidebar}>
          <Menu size={22} />
        </button>
        {!collapsed ? <Brand /> : null}
      </div>

      <nav className={clsx("space-y-1", collapsed ? "px-1" : "px-2")}>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                "flex items-center rounded-lg transition-colors hover:bg-white/10",
                collapsed ? "flex-col gap-1 py-3 text-[10px]" : "h-12 gap-5 px-4 text-[15px] font-medium",
                isActive && "bg-white/10"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={collapsed ? 22 : 24} strokeWidth={isActive ? 2.4 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {!collapsed ? (
        <>
          <div className="mx-5 my-5 h-px bg-white/10" />
          <div className="px-4">
            <button
              className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white/10 text-sm font-medium hover:bg-white/20"
              onClick={() => openCreatePlaylist()}
            >
              <Plus size={20} /> New playlist
            </button>
          </div>
          <div className="mt-3 min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
            <PlaylistLink
              to="/library/liked"
              title="Liked Music"
              subtitle="Auto playlist"
              pinned
              playing={playingPath === "/library/liked"}
            />
            {playlists.map((playlist) => (
              <PlaylistLink
                key={playlist.id}
                to={`/library/playlist/${playlist.id}`}
                title={playlist.title}
                subtitle={profileName || "You"}
                playing={playingPath === `/library/playlist/${playlist.id}`}
              />
            ))}
            {[...savedPlaylists, ...savedAlbums].map((item) => (
              <PlaylistLink
                key={`${item.kind}-${item.id}`}
                to={`/${item.kind}/${item.id}`}
                title={item.title}
                subtitle={item.kind === "album" ? item.subtitle || "Album" : "Playlist"}
                playing={playingPath === `/${item.kind}/${item.id}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </aside>
  );
}
