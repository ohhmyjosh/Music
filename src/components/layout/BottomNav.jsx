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

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-950/98 px-2 py-2 backdrop-blur xl:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-between">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                "flex min-w-[58px] flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] transition",
                isActive ? "text-accent-300" : "text-slate-500"
              )
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
