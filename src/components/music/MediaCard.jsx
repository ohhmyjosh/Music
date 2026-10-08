import { memo } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Pause, Play, Radio } from "lucide-react";
import Artwork from "../media/Artwork";
import MenuButton, { openItemMenu } from "./MenuButton";
import ArtistLinks from "./ArtistLinks";
import { usePlayerStore } from "../../store/playerStore";
import { collectionPath, playCollection } from "../../lib/queries";

const KIND_LABEL = { album: "Album", playlist: "Playlist", artist: "Artist", "local-playlist": "Playlist" };

function isTrack(item) {
  return Boolean(item.source);
}

// A shelf card. Songs play on click; albums/playlists/artists open their page,
// with a hover play button that starts them without leaving the shelf.
// Mixes ({ kind: "mix", seed }) start a radio from their seed song.
function MediaCard({ item, tracks, position = 0, from, className, size = "md" }) {
  const navigate = useNavigate();
  const song = isTrack(item);
  const isArtist = item.kind === "artist";
  const isCurrent = usePlayerStore((state) => song && state.currentTrack?.id === item.id);
  const isPlaying = usePlayerStore((state) => isCurrent && state.isPlaying);

  const title = item.title;
  const subtitle = song ? null : item.kind === "mix" ? item.subtitle : item.subtitle || KIND_LABEL[item.kind];

  const play = (event) => {
    event?.stopPropagation();
    const player = usePlayerStore.getState();
    if (song) {
      if (isCurrent) player.togglePlay();
      else player.playTracks(tracks || [item], tracks ? position : 0, from || null);
    } else if (item.kind === "mix") {
      player.startRadio(item.seed, item.title);
    } else {
      playCollection(item);
    }
  };

  const open = () => {
    const path = song ? null : collectionPath(item);
    if (path) navigate(path);
    else play();
  };

  return (
    <div
      className={clsx(
        "group w-[160px] shrink-0 cursor-pointer snap-start sm:w-[180px]",
        size === "lg" && "lg:w-[226px]",
        size === "sm" && "!w-[140px]",
        className
      )}
      onClick={open}
      onContextMenu={(event) => openItemMenu(event, item, { from })}
    >
      <div className={clsx("relative overflow-hidden", isArtist ? "rounded-full" : "rounded-md")}>
        <Artwork
          src={item.artwork}
          artist={song ? item.artist : undefined}
          title={song ? item.title : undefined}
          alt={title}
          className={clsx("aspect-square w-full transition duration-200 group-hover:brightness-75")}
        />
        {item.kind === "mix" ? (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-medium">
            <Radio size={12} /> Mix
          </span>
        ) : null}
        {!isArtist ? (
          <>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-0 transition group-hover:opacity-100" />
            <MenuButton
              item={item}
              context={{ from }}
              className="absolute right-1 top-1 opacity-0 transition group-hover:opacity-100 max-lg:opacity-100"
            />
            <button
              className={clsx(
                "absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white transition hover:scale-110 hover:bg-black/90",
                isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
              aria-label={`Play ${title}`}
              onClick={play}
            >
              {isCurrent && isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>
          </>
        ) : null}
      </div>
      <div className={clsx("mt-2 min-w-0", isArtist && "text-center")}>
        <p className="line-clamp-2 text-[15px] font-medium leading-snug">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-sm text-yt-muted">
          {song ? <ArtistLinks track={item} /> : subtitle}
        </p>
      </div>
    </div>
  );
}

export default memo(MediaCard);
