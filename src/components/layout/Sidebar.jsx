import { Home, Library, ListMusic, Search, Settings2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";
import brandLogo from "../../assets/branding/logo.png";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/library", label: "Library", icon: Library },
  { to: "/playlists", label: "Playlists", icon: ListMusic },
  { to: "/settings", label: "Settings", icon: Settings2 }
];

export default function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-24 shrink-0 border-r border-white/10 bg-black/30 px-3 py-5 backdrop-blur xl:flex xl:flex-col">
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.03] px-2 py-4">
        <img src={brandLogo} alt="Josh-Fy logo" className="h-12 w-12 rounded-2xl object-contain bg-white/5 p-1" />
        <div className="text-center">
          <p className="font-display text-sm font-semibold text-white">Josh-Fy</p>
          <p className="mt-1 text-[10px] text-slate-500">Music app</p>
        </div>
      </div>

      <nav className="mt-6 space-y-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-[11px] transition",
                isActive ? "bg-accent-500/15 text-white soft-ring" : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
              )
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-3xl border border-white/10 bg-white/[0.03] p-3 text-center text-[11px] leading-5 text-slate-500">
        Mobile-first feed and player UI.
      </div>
    </aside>
  );
}
