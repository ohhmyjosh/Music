import { Home, Library, ListMusic, Search, Settings2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/library", label: "Library", icon: Library },
  { to: "/playlists", label: "Playlists", icon: ListMusic },
  { to: "/settings", label: "Settings", icon: Settings2 }
];

export default function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-white/10 bg-slate-950/65 px-5 py-6 backdrop-blur xl:flex">
      <div className="mb-10 rounded-[28px] border border-white/10 bg-gradient-to-br from-accent-500/14 via-white/[0.04] to-amber-500/8 p-5">
        <p className="text-xs uppercase tracking-[0.35em] text-accent-300">Josh-Fy</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-white">Your free music space.</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          A Spotify-inspired portfolio build for free music discovery, polished UI work, and future PWA expansion.
        </p>
      </div>

      <nav className="space-y-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                isActive
                  ? "bg-accent-500/15 text-white shadow-glow"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              )
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="glass-panel mt-auto rounded-3xl p-5">
        <p className="text-sm text-slate-200">Roadmap-ready foundation</p>
        <p className="mt-2 text-xs leading-6 text-slate-400">
          React, Vite, Tailwind, React Router, Zustand, and TanStack Query are wired now. IndexedDB and PWA layers can
          be added cleanly later.
        </p>
      </div>
    </aside>
  );
}
