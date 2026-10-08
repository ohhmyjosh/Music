import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { NAV_ITEMS } from "./Sidebar";

// Mobile tab bar — YouTube Music's Home / Explore / Library.
export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-yt-bar pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto flex h-[var(--mobile-nav-h)] max-w-xl items-stretch">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
                isActive ? "text-white" : "text-yt-muted"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
