import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { ArrowLeft, History, Search, X } from "lucide-react";
import Artwork from "../media/Artwork";
import useDebounced from "../../hooks/useDebounced";
import { getSongById, searchSuggestions } from "../../api/saavn";
import { useLibraryStore } from "../../store/libraryStore";
import { usePlayerStore } from "../../store/playerStore";
import { useUiStore } from "../../store/uiStore";

const KIND_LABEL = { song: "Song", artist: "Artist", album: "Album", playlist: "Playlist" };

// YouTube Music's search field: recent searches when empty, live suggestions
// while typing, ↑/↓ + Enter to pick, Esc to leave.
export default function SearchBox({ autoFocus = false, onBack, className }) {
  const navigate = useNavigate();
  const location = useLocation();
  const urlQuery = location.pathname === "/search" ? new URLSearchParams(location.search).get("q") || "" : "";
  const [text, setText] = useState(urlQuery);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const input = useRef(null);
  const box = useRef(null);
  const debounced = useDebounced(text.trim(), 200);

  const searchHistory = useLibraryStore((state) => state.searchHistory);
  const addSearch = useLibraryStore((state) => state.addSearch);
  const removeSearch = useLibraryStore((state) => state.removeSearch);

  useEffect(() => setText(urlQuery), [urlQuery]);

  const { data: suggestions = [] } = useQuery({
    queryKey: ["suggest", debounced.toLowerCase()],
    queryFn: () => searchSuggestions(debounced),
    enabled: open && debounced.length > 1,
    staleTime: 60 * 60 * 1000
  });

  // Rows shown in the dropdown, in keyboard order.
  const rows = useMemo(() => {
    if (!text.trim()) return searchHistory.map((query) => ({ type: "history", query }));
    const needle = text.trim().toLowerCase();
    const textRows = [
      { type: "query", query: text.trim() },
      ...searchHistory
        .filter((query) => query.toLowerCase().startsWith(needle) && query.toLowerCase() !== needle)
        .slice(0, 3)
        .map((query) => ({ type: "history", query }))
    ];
    return [...textRows, ...suggestions.map((item) => ({ type: "item", item }))];
  }, [text, searchHistory, suggestions]);

  useEffect(() => setCursor(-1), [rows.length, text]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (box.current && !box.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const submit = (query) => {
    const q = query.trim();
    if (!q) return;
    addSearch(q);
    setOpen(false);
    input.current?.blur();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const choose = async (row) => {
    if (row.type !== "item") {
      submit(row.query);
      return;
    }
    const { item } = row;
    setOpen(false);
    input.current?.blur();
    addSearch(item.title);
    if (item.kind === "song") {
      try {
        const song = await getSongById(item.id);
        if (song) usePlayerStore.getState().startRadio(song);
      } catch {
        useUiStore.getState().toast("Couldn't play that song");
      }
      return;
    }
    navigate(`/${item.kind}/${item.id}`);
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setCursor((value) => Math.min(rows.length - 1, value + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((value) => Math.max(-1, value - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (cursor >= 0 && rows[cursor]) choose(rows[cursor]);
      else submit(text);
    } else if (event.key === "Escape") {
      setOpen(false);
      input.current?.blur();
    }
  };

  return (
    <div ref={box} className={clsx("relative w-full", className)}>
      <div
        className={clsx(
          "flex h-10 items-center gap-2 border border-white/10 bg-white/[0.1] px-2 transition-colors",
          open && rows.length ? "rounded-t-lg bg-yt-bar" : "rounded-lg",
          open && "border-white/20"
        )}
      >
        {onBack ? (
          <button className="icon-btn h-8 w-8" aria-label="Back" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
        ) : (
          <Search size={20} className="ml-2 shrink-0 text-yt-muted" />
        )}
        <input
          id="joshfy-search"
          ref={input}
          value={text}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          placeholder="Search songs, albums, artists, playlists"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setText(event.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-yt-muted"
          role="combobox"
          aria-expanded={open}
          aria-controls="joshfy-search-list"
        />
        {text ? (
          <button
            className="icon-btn h-8 w-8"
            aria-label="Clear search"
            onClick={() => {
              setText("");
              input.current?.focus();
            }}
          >
            <X size={18} />
          </button>
        ) : null}
      </div>

      {open && rows.length ? (
        <ul
          id="joshfy-search-list"
          role="listbox"
          className="absolute inset-x-0 top-full z-50 max-h-[70vh] overflow-y-auto rounded-b-lg border border-t-0 border-white/20 bg-yt-bar py-2 shadow-2xl"
        >
          {rows.map((row, index) => (
            <li
              key={row.type === "item" ? `${row.item.kind}-${row.item.id}` : `${row.type}-${row.query}`}
              role="option"
              aria-selected={cursor === index}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => choose(row)}
              className={clsx(
                "group flex cursor-pointer items-center gap-4 px-4 py-2",
                cursor === index ? "bg-white/10" : "hover:bg-white/10"
              )}
            >
              {row.type === "item" ? (
                <>
                  <Artwork
                    src={row.item.artwork}
                    className={clsx("h-10 w-10", row.item.kind === "artist" ? "rounded-full" : "rounded")}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[15px]">{row.item.title}</p>
                    <p className="truncate text-sm text-yt-muted">
                      {KIND_LABEL[row.item.kind]}
                      {row.item.subtitle && row.item.subtitle !== "Artist" ? ` • ${row.item.subtitle}` : ""}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {row.type === "history" ? (
                    <History size={20} className="shrink-0 text-yt-muted" />
                  ) : (
                    <Search size={20} className="shrink-0 text-yt-muted" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[15px]">{row.query}</span>
                  {row.type === "history" ? (
                    <button
                      className="shrink-0 text-xs text-yt-muted opacity-0 hover:text-white group-hover:opacity-100 max-lg:opacity-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeSearch(row.query);
                      }}
                    >
                      Remove
                    </button>
                  ) : null}
                </>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
