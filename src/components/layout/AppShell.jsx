import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import clsx from "clsx";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import AudioEngine from "../player/AudioEngine";
import PlayerBar from "../player/PlayerBar";
import NowPlaying from "../player/NowPlaying";
import ItemMenu from "../overlays/ItemMenu";
import PlaylistDialogs from "../overlays/PlaylistDialogs";
import Toasts from "../overlays/Toasts";
import { useUiStore } from "../../store/uiStore";
import { useDownloadsStore } from "../../store/downloadsStore";

export default function AppShell() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const hydrateDownloads = useDownloadsStore((state) => state.hydrate);
  const { pathname } = useLocation();

  useEffect(() => {
    hydrateDownloads();
  }, [hydrateDownloads]);

  // New page, start at the top (YouTube Music doesn't keep scroll across pages).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-[100dvh] bg-yt-base">
      <Sidebar />
      <div className={clsx("min-w-0", collapsed ? "lg:ml-[72px]" : "lg:ml-60")}>
        <TopBar />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
      <AudioEngine />
      <NowPlaying />
      <PlayerBar />
      <BottomNav />
      <ItemMenu />
      <PlaylistDialogs />
      <Toasts />
    </div>
  );
}
