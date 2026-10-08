import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { GripVertical, ListPlus, Loader2, Play } from "lucide-react";
import Artwork from "../media/Artwork";
import MenuButton, { openItemMenu } from "../music/MenuButton";
import PlayingBars from "../music/PlayingBars";
import { usePlayerStore } from "../../store/playerStore";
import { useUiStore } from "../../store/uiStore";
import { formatTime } from "../../utils/track";

function Toggle({ on, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={clsx(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
        on ? "bg-accent-500/60" : "bg-white/30"
      )}
    >
      <span
        className={clsx(
          "absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full shadow transition-all",
          on ? "left-4 bg-accent-400" : "left-[-2px] bg-white"
        )}
      />
    </button>
  );
}

// The queue, YouTube Music style: where it's playing from, Autoplay, and the
// list itself — drag to reorder (desktop), ⋮ to remove or save.
export default function UpNextPanel() {
  const queue = usePlayerStore((state) => state.queue);
  const index = usePlayerStore((state) => state.index);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playingFrom = usePlayerStore((state) => state.playingFrom);
  const autoplay = usePlayerStore((state) => state.autoplay);
  const autoplayLoading = usePlayerStore((state) => state.autoplayLoading);
  const toggleAutoplay = usePlayerStore((state) => state.toggleAutoplay);
  const jumpTo = usePlayerStore((state) => state.jumpTo);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const moveInQueue = usePlayerStore((state) => state.moveInQueue);
  const openSaveDialog = useUiStore((state) => state.openSaveDialog);
  const closeNowPlaying = useUiStore((state) => state.closeNowPlaying);
  const currentRef = useRef(null);
  const [dragFrom, setDragFrom] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  // Bring the playing song into view when the panel opens or the song changes.
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [index]);

  const firstAutoplay = queue.findIndex((item) => item.autoplay);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 px-2 pb-3 pt-4">
        <div className="min-w-0">
          <p className="text-sm text-yt-muted">Playing from</p>
          {playingFrom?.path ? (
            <Link
              to={playingFrom.path}
              onClick={closeNowPlaying}
              className="block truncate text-lg font-bold hover:underline"
            >
              {playingFrom.label}
            </Link>
          ) : (
            <p className="truncate text-lg font-bold">{playingFrom?.label || "Queue"}</p>
          )}
        </div>
        <button className="pill-primary shrink-0" onClick={() => openSaveDialog(queue)}>
          <ListPlus size={18} /> Save
        </button>
      </div>

      <div className="mx-2 mb-2 flex items-center justify-between gap-4 rounded-lg bg-white/[0.06] px-3 py-3">
        <div>
          <p className="font-medium">Autoplay</p>
          <p className="text-sm text-yt-muted">Add similar content to the end of the queue</p>
        </div>
        <Toggle on={autoplay} onChange={toggleAutoplay} label="Autoplay" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {queue.map((item, i) => {
          const current = i === index;
          return (
            <div key={item.qid}>
              {i === firstAutoplay ? (
                <p className="px-3 pb-1 pt-4 text-xs font-medium uppercase tracking-wider text-yt-muted">
                  Autoplay • similar songs
                </p>
              ) : null}
              <div
                ref={current ? currentRef : undefined}
                role="button"
                tabIndex={0}
                draggable
                onDragStart={() => setDragFrom(i)}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(i);
                }}
                onDragEnd={() => {
                  setDragFrom(null);
                  setDragOver(null);
                }}
                onDrop={() => {
                  if (dragFrom !== null) moveInQueue(dragFrom, i);
                  setDragFrom(null);
                  setDragOver(null);
                }}
                onClick={() => (current ? togglePlay() : jumpTo(i))}
                onKeyDown={(event) => event.key === "Enter" && (current ? togglePlay() : jumpTo(i))}
                onContextMenu={(event) => openItemMenu(event, item, { qid: current ? null : item.qid })}
                className={clsx(
                  "group flex h-16 items-center gap-3 border-b border-white/[0.06] px-2 outline-none hover:bg-white/10 focus-visible:bg-white/10",
                  current && "bg-white/10",
                  i < index && "opacity-60",
                  dragOver === i && dragFrom !== i && "border-t-2 border-t-accent-400"
                )}
              >
                <GripVertical size={16} className="hidden shrink-0 cursor-grab text-yt-dim group-hover:block max-lg:!hidden" />
                <div className="relative h-11 w-11 shrink-0">
                  <Artwork
                    src={item.artworkSmall || item.artwork}
                    artist={item.artist}
                    title={item.title}
                    className="h-11 w-11 rounded"
                  />
                  <span
                    className={clsx(
                      "absolute inset-0 items-center justify-center rounded bg-black/50",
                      current ? "flex" : "hidden group-hover:flex"
                    )}
                  >
                    {current && isPlaying ? <PlayingBars /> : <Play size={18} fill="currentColor" />}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{item.title}</p>
                  <p className="truncate text-sm text-yt-muted">{item.artist}</p>
                </div>
                <span className="text-sm tabular-nums text-yt-muted group-hover:hidden">
                  {formatTime(item.duration)}
                </span>
                <MenuButton
                  item={item}
                  context={{ qid: current ? null : item.qid }}
                  className="hidden group-hover:inline-flex max-lg:inline-flex"
                />
              </div>
            </div>
          );
        })}
        {autoplayLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-yt-muted">
            <Loader2 size={16} className="animate-spin" /> Finding similar songs…
          </div>
        ) : null}
      </div>
    </div>
  );
}
