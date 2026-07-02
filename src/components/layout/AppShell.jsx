import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import DesktopHeader from "./DesktopHeader";
import BottomNav from "./BottomNav";
import MiniPlayer from "./MiniPlayer";
import WaveformVisualizer from "../player/WaveformVisualizer";
import { useLibraryStore } from "../../store/libraryStore";

export default function AppShell() {
  const hydrate = useLibraryStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1500px]">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <MobileHeader />
          <DesktopHeader />
          <main className="px-4 pb-[calc(11rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 lg:px-8 xl:px-10 xl:pb-36 xl:pt-8">
            <Outlet />
          </main>
        </div>
      </div>
      <WaveformVisualizer />
      <MiniPlayer />
      <BottomNav />
    </div>
  );
}
