import { Search, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";
import brandLogo from "../../assets/branding/logo.png";

export default function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0f] xl:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={brandLogo} alt="Josh-Fy logo" className="h-10 w-10 rounded-xl object-contain bg-white/5 p-1" />
          <div>
            <p className="font-display text-base font-semibold text-white">Josh-Fy</p>
            <p className="text-xs text-slate-400">Your music space</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/search" className="rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-200">
            <Search size={18} />
          </Link>
          <Link to="/settings" className="rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-200">
            <Settings2 size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}
