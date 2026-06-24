import { Search } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder = "Search songs, artists, moods...", large = false }) {
  return (
    <label
      className={[
        "flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] text-slate-200 backdrop-blur-xl",
        large ? "px-4 py-3.5" : "px-4 py-3"
      ].join(" ")}
    >
      <Search size={18} className="text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
      />
    </label>
  );
}
