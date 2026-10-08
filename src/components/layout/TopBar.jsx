import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { Search } from "lucide-react";
import SearchBox from "../search/SearchBox";
import InstallButton from "../pwa/InstallButton";
import { Brand } from "./Sidebar";
import { useLibraryStore } from "../../store/libraryStore";

export function Avatar({ size = 32 }) {
  const profileName = useLibraryStore((state) => state.profileName);
  const initial = (profileName || "J").trim().charAt(0).toUpperCase();
  return (
    <Link
      to="/settings"
      aria-label="Settings"
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-fuchsia-500 text-sm font-bold"
    >
      {initial}
    </Link>
  );
}

// Transparent over the page until it scrolls, then solid — as on YouTube Music.
export default function TopBar() {
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const onSearchPage = pathname === "/search";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={clsx(
        "sticky top-0 z-30 transition-colors duration-200",
        scrolled ? "border-b border-white/10 bg-yt-base" : "bg-gradient-to-b from-yt-base/90 to-transparent"
      )}
    >
      {/* Desktop */}
      <div className="hidden h-16 items-center gap-4 px-10 lg:flex">
        <SearchBox className="max-w-[480px]" />
        <div className="ml-auto flex items-center gap-2">
          <InstallButton compact />
          <Avatar />
        </div>
      </div>

      {/* Mobile: the search page shows its own full-width field instead. */}
      {!onSearchPage ? (
        <div className="flex h-14 items-center gap-2 px-4 lg:hidden">
          <Brand />
          <div className="ml-auto flex items-center gap-1">
            <InstallButton compact />
            <Link to="/search" className="icon-btn" aria-label="Search">
              <Search size={22} />
            </Link>
            <Avatar size={30} />
          </div>
        </div>
      ) : null}
    </header>
  );
}
