import { useState } from "react";
import { ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SearchBar from "../search/SearchBar";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning, Josh";
  if (hour < 18) return "Good afternoon, Josh";
  return "Good evening, Josh";
}

// Desktop-only top bar (xl+), where the sidebar replaces the mobile header.
// Gives large screens Spotify-style back/forward nav, a persistent live search,
// and quick access to settings — none of which the sidebar provides.
export default function DesktopHeader() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  // Enter runs a real, network-backed search on the Search page (Audius).
  const runSearch = (term) => {
    const q = (term ?? "").trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  return (
    <header className="sticky top-0 z-30 hidden border-b border-white/10 bg-slate-950/80 backdrop-blur-xl xl:block">
      <div className="flex items-center gap-4 px-10 py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => navigate(1)}
            aria-label="Go forward"
            className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="w-full max-w-md">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={runSearch}
            placeholder="Search all music — press Enter"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <p className="hidden text-sm text-slate-400 2xl:block">{getGreeting()}</p>
          <Link
            to="/settings"
            aria-label="Settings"
            className="rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-200 transition hover:bg-white/10"
          >
            <Settings2 size={18} />
          </Link>
          <Link
            to="/settings"
            aria-label="Your profile"
            className="grid h-9 w-9 place-items-center rounded-full bg-accent-500 text-sm font-semibold text-slate-950 transition hover:bg-accent-400"
          >
            J
          </Link>
        </div>
      </div>
    </header>
  );
}
