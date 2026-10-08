import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import clsx from "clsx";
import { ChevronDown, SkipBack, SkipForward } from "lucide-react";
import Artwork from "../media/Artwork";
import ArtistLinks from "../music/ArtistLinks";
import MenuButton from "../music/MenuButton";
import WaveformVisualizer from "./WaveformVisualizer";
import ProgressBar from "./ProgressBar";
import UpNextPanel from "./UpNextPanel";
import LyricsPanel from "./LyricsPanel";
import RelatedPanel from "./RelatedPanel";
import { LikeButtons, PlayPauseIcon, RepeatButton, ShuffleButton } from "./PlayerBar";
import { usePlaybackClock, usePlayerStore } from "../../store/playerStore";
import { useUiStore } from "../../store/uiStore";
import { unlockAudio } from "../../audio/analyser";
import { formatTime } from "../../utils/track";

const TABS = [
  { id: "upnext", label: "Up next" },
  { id: "lyrics", label: "Lyrics" },
  { id: "related", label: "Related" }
];

function TabBar({ tab, setTab }) {
  return (
    <div className="flex shrink-0 border-b border-white/10" role="tablist">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          role="tab"
          aria-selected={tab === id}
          onClick={() => setTab(id)}
          className={clsx(
            "relative flex-1 py-4 text-sm font-medium uppercase tracking-wide transition-colors",
            tab === id ? "text-white" : "text-yt-muted hover:text-white"
          )}
        >
          {label}
          {tab === id ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white" /> : null}
        </button>
      ))}
    </div>
  );
}

function TabContent({ tab }) {
  if (tab === "lyrics") return <LyricsPanel />;
  if (tab === "related") return <RelatedPanel />;
  return <UpNextPanel />;
}

// YouTube Music's "Song / Video" switch — here the alternative to the cover is
// Josh-Fy's live audio visualizer.
function ViewSwitch({ view, setView }) {
  return (
    <div className="inline-flex rounded-full bg-white/10 p-1 text-sm font-medium">
      {["Song", "Visualizer"].map((name) => (
        <button
          key={name}
          onClick={() => setView(name)}
          className={clsx(
            "rounded-full px-4 py-1.5 transition-colors",
            view === name ? "bg-white/20 text-white" : "text-yt-muted hover:text-white"
          )}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

function Stage({ track, view, className }) {
  return view === "Visualizer" ? (
    <div className={clsx("relative overflow-hidden rounded-lg bg-black", className)}>
      <img src={track.artwork} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl" />
      <div className="absolute inset-x-0 bottom-0 top-1/4">
        <WaveformVisualizer variant="inline" />
      </div>
      <Artwork
        src={track.artworkSmall || track.artwork}
        className="absolute left-1/2 top-[18%] h-24 w-24 -translate-x-1/2 rounded-lg shadow-2xl"
      />
    </div>
  ) : (
    <Artwork
      src={track.artwork}
      artist={track.artist}
      title={track.title}
      alt={track.title}
      className={clsx("rounded-lg object-cover shadow-[0_20px_60px_rgba(0,0,0,0.6)]", className)}
    />
  );
}

function Times() {
  const currentTime = usePlaybackClock((state) => state.currentTime);
  const duration = usePlaybackClock((state) => state.duration);
  return (
    <div className="flex justify-between text-xs tabular-nums text-yt-muted">
      <span>{formatTime(currentTime)}</span>
      <span>{formatTime(duration)}</span>
    </div>
  );
}

function MobileSheet({ tab, setTab, onClose }) {
  return (
    <div className="absolute inset-0 z-10 flex animate-slide-up flex-col bg-yt-raised">
      <div className="flex items-center gap-2 px-2 pt-[env(safe-area-inset-top)]">
        <button className="icon-btn" aria-label="Back to player" onClick={onClose}>
          <ChevronDown size={26} />
        </button>
        <div className="flex-1">
          <TabBar tab={tab} setTab={setTab} />
        </div>
      </div>
      <div className="min-h-0 flex-1 px-2">
        <TabContent tab={tab} />
      </div>
    </div>
  );
}

export default function NowPlaying() {
  const open = useUiStore((state) => state.nowPlayingOpen);
  const tab = useUiStore((state) => state.nowPlayingTab);
  const setTab = useUiStore((state) => state.setNowPlayingTab);
  const close = useUiStore((state) => state.closeNowPlaying);
  const track = usePlayerStore((state) => state.currentTrack);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const next = usePlayerStore((state) => state.next);
  const previous = usePlayerStore((state) => state.previous);
  const [view, setView] = useState("Song");
  const [mobileSheet, setMobileSheet] = useState(false);
  const { pathname } = useLocation();
  const firstPath = useRef(pathname);

  // Any navigation (tapping an artist or album inside the panel) closes it.
  useEffect(() => {
    if (firstPath.current !== pathname) close();
    firstPath.current = pathname;
  }, [pathname, close]);

  useEffect(() => {
    if (!open) setMobileSheet(false);
    if (!open) return undefined;
    const onKey = (event) => event.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // The phone back gesture should close the player, not leave the page.
  useEffect(() => {
    if (!open || window.innerWidth >= 1024) return undefined;
    window.history.pushState({ joshfyPlayer: true }, "");
    const onPop = () => close();
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (window.history.state?.joshfyPlayer) window.history.back();
    };
  }, [open, close]);

  if (!open || !track) return null;

  const play = () => {
    unlockAudio();
    togglePlay();
  };

  return (
    <>
      {/* ---- Desktop: fills the area between top bar and player bar ---------- */}
      <div className="fixed inset-x-0 bottom-[var(--player-h)] top-0 z-[45] hidden animate-slide-up bg-yt-base lg:block">
        <div
          className="pointer-events-none absolute inset-0 opacity-25 blur-3xl"
          style={{ backgroundImage: `url(${track.artwork})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-yt-base/70 via-yt-base/90 to-yt-base" />
        <div className="relative mx-auto flex h-full max-w-[1600px] gap-12 px-12 pb-6 pt-6">
          <div className="flex min-w-0 flex-1 flex-col items-center">
            <ViewSwitch view={view} setView={setView} />
            <div className="flex min-h-0 w-full flex-1 items-center justify-center py-8">
              <Stage track={track} view={view} className="aspect-square h-full max-h-[min(70vh,720px)] max-w-full" />
            </div>
          </div>
          <div className="flex w-[40%] min-w-[380px] max-w-[620px] flex-col">
            <TabBar tab={tab} setTab={setTab} />
            <div className="min-h-0 flex-1">
              <TabContent tab={tab} />
            </div>
          </div>
        </div>
      </div>

      {/* ---- Mobile: full screen ----------------------------------------------- */}
      <div className="fixed inset-0 z-[60] flex animate-slide-up flex-col overflow-hidden bg-yt-raised lg:hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-40 blur-3xl"
          style={{ backgroundImage: `url(${track.artwork})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-yt-raised/80 to-yt-raised" />

        <div className="relative flex items-center justify-between px-2 pt-[calc(env(safe-area-inset-top)+8px)]">
          <button className="icon-btn" aria-label="Close player" onClick={close}>
            <ChevronDown size={28} />
          </button>
          <ViewSwitch view={view} setView={setView} />
          <MenuButton item={track} />
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col justify-center gap-6 px-6">
          <Stage track={track} view={view} className="mx-auto aspect-square w-full max-w-[min(100%,52vh)]" />

          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-2xl font-bold">{track.title}</p>
              <p className="truncate text-base text-yt-muted">
                <ArtistLinks track={track} />
              </p>
            </div>
            <LikeButtons track={track} size={22} />
          </div>

          <div>
            <ProgressBar variant="full" />
            <Times />
          </div>

          <div className="flex items-center justify-between">
            <ShuffleButton size={24} />
            <button className="icon-btn h-14 w-14" aria-label="Previous" onClick={previous}>
              <SkipBack size={32} fill="currentColor" />
            </button>
            <button
              className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white text-black active:scale-95"
              aria-label="Play or pause"
              onClick={play}
            >
              <PlayPauseIcon size={34} />
            </button>
            <button className="icon-btn h-14 w-14" aria-label="Next" onClick={() => next()}>
              <SkipForward size={32} fill="currentColor" />
            </button>
            <RepeatButton size={24} />
          </div>
        </div>

        <div className="relative flex justify-around pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              className="px-4 py-3 text-sm font-medium uppercase tracking-wide text-white/80"
              onClick={() => {
                setTab(id);
                setMobileSheet(true);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {mobileSheet ? <MobileSheet tab={tab} setTab={setTab} onClose={() => setMobileSheet(false)} /> : null}
      </div>
    </>
  );
}
