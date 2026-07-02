import { Search } from "lucide-react";

// A form so pressing Enter submits the query. Pass `onSubmit` to react to that
// (e.g. navigate to the live search page); `onChange` still fires per keystroke
// for as-you-type filtering.
export default function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search songs, artists, moods...",
  large = false
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(value);
      }}
      role="search"
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
        enterKeyHint="search"
        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
      />
    </form>
  );
}
