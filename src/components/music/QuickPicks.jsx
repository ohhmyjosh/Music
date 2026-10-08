import { useMemo } from "react";
import clsx from "clsx";
import { Pause, Play } from "lucide-react";
import Artwork from "../media/Artwork";
import ArtistLinks from "./ArtistLinks";
import MenuButton, { openItemMenu } from "./MenuButton";
import PlayingBars from "./PlayingBars";
import { usePlayerStore } from "../../store/playerStore";

const ROWS = 4;

function PickRow({ track, tracks, position, from }) {
  const isCurrent = usePlayerStore((state) => state.currentTrack?.id === track.id);
  const isPlaying = usePlayerStore((state) => isCurrent && state.isPlaying);

  const play = () => {
    const player = usePlayerStore.getState();
    if (isCurrent) player.togglePlay();
    else player.playTracks(tracks, position, from);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={play}
      onKeyDown={(event) => event.key === "Enter" && play()}
      onContextMenu={(event) => openItemMenu(event, track, { from })}
      className="group flex h-14 items-center gap-3 rounded-md pr-1 outline-none hover:bg-white/10 focus-visible:bg-white/10"
    >
      <div className="relative h-12 w-12 shrink-0">
        <Artwork
          src={track.artworkSmall || track.artwork}
          artist={track.artist}
          title={track.title}
          className="h-12 w-12 rounded"
        />
        <span
          className={clsx(
            "absolute inset-0 items-center justify-center rounded bg-black/50",
            isCurrent ? "flex" : "hidden group-hover:flex"
          )}
        >
          {isPlaying ? (
            <>
              <PlayingBars className="group-hover:hidden" />
              <Pause size={18} fill="currentColor" className="hidden group-hover:block" />
            </>
          ) : (
            <Play size={18} fill="currentColor" />
          )}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">{track.title}</p>
        <p className="truncate text-sm text-yt-muted">
          <ArtistLinks track={track} />
          {track.album ? ` • ${track.album}` : ""}
        </p>
      </div>
      <MenuButton item={track} context={{ from }} className="opacity-0 group-hover:opacity-100 max-lg:opacity-100" />
    </div>
  );
}

// "Quick picks": songs laid out in columns of four that scroll sideways.
export default function QuickPicks({ tracks, from }) {
  const columns = useMemo(() => {
    const out = [];
    for (let i = 0; i < tracks.length; i += ROWS) out.push(tracks.slice(i, i + ROWS));
    return out;
  }, [tracks]);

  return columns.map((column, c) => (
    <div key={c} className="flex w-[85vw] max-w-[400px] shrink-0 snap-start flex-col sm:w-[380px]">
      {column.map((track, r) => (
        <PickRow key={track.id} track={track} tracks={tracks} position={c * ROWS + r} from={from} />
      ))}
    </div>
  ));
}
