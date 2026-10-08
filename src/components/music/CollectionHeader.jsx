import clsx from "clsx";
import { Play, Shuffle } from "lucide-react";
import Artwork from "../media/Artwork";

// The top of an album/playlist page: big art, title, meta lines and the
// Play / Shuffle / action buttons, laid out like YouTube Music.
export default function CollectionHeader({ artwork, artworkNode, kicker, title, lines = [], description, onPlay, onShuffle, actions, round }) {
  return (
    <header className="flex flex-col items-center gap-6 pt-6 text-center md:flex-row md:items-end md:gap-8 md:text-left">
      {artworkNode || (
        <Artwork
          src={artwork}
          alt={title}
          className={clsx("aspect-square w-52 shadow-2xl sm:w-60 lg:w-64", round ? "rounded-full" : "rounded-lg")}
        />
      )}
      <div className="min-w-0 flex-1">
        {kicker ? <p className="text-sm font-medium text-yt-muted">{kicker}</p> : null}
        <h1 className="mt-1 line-clamp-2 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{title}</h1>
        {lines.filter(Boolean).map((line, i) => (
          <p key={i} className="mt-2 text-sm text-yt-muted sm:text-base">
            {line}
          </p>
        ))}
        {description ? <p className="mt-3 line-clamp-3 max-w-2xl text-sm text-white/70">{description}</p> : null}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">
          {onPlay ? (
            <button className="pill-primary h-10 px-5" onClick={onPlay}>
              <Play size={18} fill="currentColor" /> Play
            </button>
          ) : null}
          {onShuffle ? (
            <button className="pill-outline h-10 px-5" onClick={onShuffle}>
              <Shuffle size={18} /> Shuffle
            </button>
          ) : null}
          {actions}
        </div>
      </div>
    </header>
  );
}
