import { Search } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder = "Search songs, artists, moods..." }) {
  return (
    <label className="glass-panel flex items-center gap-3 rounded-[28px] px-4 py-3">
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
