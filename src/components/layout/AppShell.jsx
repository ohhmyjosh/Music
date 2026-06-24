import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import MiniPlayer from "../player/MiniPlayer";
import { useLibraryStore } from "../../store/libraryStore";
import brandLogo from "../../assets/branding/logo.png";

export default function AppShell() {
  const hydrate = useLibraryStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="min-h-screen bg-aurora text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1560px]">
        <Sidebar />
        <main className="flex-1 px-4 pb-40 pt-4 sm:px-6 lg:px-8 lg:pb-32 lg:pt-8 xl:px-10">
          <div className="mb-6 flex items-center justify-between rounded-[28px] border border-white/10 bg-black/20 px-5 py-4 backdrop-blur xl:hidden">
            <div className="flex items-center gap-3">
              <img src={brandLogo} alt="Josh-Fy logo" className="h-11 w-11 rounded-2xl object-contain bg-black/20 p-1.5" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-accent-300">Josh-Fy</p>
                <p className="mt-1 font-display text-lg text-white">Your free music space.</p>
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              Web first
            </div>
          </div>
          <Outlet />
        </main>
      </div>
      <MiniPlayer />
      <MobileNav />
    </div>
  );
}
