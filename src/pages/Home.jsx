import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "../components/search/SearchBar";
import SectionShelf from "../components/music/SectionShelf";
import TrackCard from "../components/music/TrackCard";
import TrackRow from "../components/music/TrackRow";
import PlaylistCard from "../components/music/PlaylistCard";
import GenreChip from "../components/music/GenreChip";
import { fetchJamendoTrending } from "../api/jamendo";
import { fetchAudiusTrending } from "../api/audius";
import { rankTracks } from "../utils/ranking";
import { usePlayerStore } from "../store/playerStore";
import brandLogo from "../assets/branding/logo.png";
import heroBanner from "../assets/branding/banner.png";

const chips = ["All", "Relax", "Workout", "Focus", "Indie", "R&B", "Hindi", "Downloadable"];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning, Josh";
  if (hour < 18) return "Good afternoon, Josh";
  return "Good evening, Josh";
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeChip, setActiveChip] = useState("All");
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const recentlyPlayed = usePlayerStore((state) => state.recentlyPlayed);

  const { data: jamendoTracks = [] } = useQuery({
    queryKey: ["jamendo-trending"],
    queryFn: fetchJamendoTrending
  });

  const { data: audiusTracks = [] } = useQuery({
    queryKey: ["audius-trending"],
    queryFn: fetchAudiusTrending
  });

  const allTracks = useMemo(() => [...jamendoTracks, ...audiusTracks], [jamendoTracks, audiusTracks]);

  const filteredTracks = useMemo(() => {
    let next = rankTracks(search, allTracks);

    if (activeChip !== "All") {
      next = next.filter((track) => {
        const haystack = [track.genre, track.mood, ...(track.tags || [])].join(" ").toLowerCase();
        if (activeChip === "Downloadable") return Boolean(track.downloadUrl || track.localOnly);
        return haystack.includes(activeChip.toLowerCase());
      });
    }

    return next;
  }, [activeChip, allTracks, search]);

  const listenAgain = recentlyPlayed.length ? recentlyPlayed : filteredTracks.slice(0, 6);
  const quickPicks = filteredTracks.slice(0, 5);
  const madeForJosh = [
    {
      title: "Made for Josh",
      subtitle: "Free tracks tuned for focus and night drives",
      artwork: heroBanner,
      tracks: filteredTracks.slice(0, 4),
      accent: "from-emerald-400/20 to-lime-300/10"
    },
    {
      title: "Mixed for you",
      subtitle: "Indie, chillhop, and discovery picks",
      artwork: filteredTracks[1]?.artwork || heroBanner,
      tracks: filteredTracks.slice(1, 5),
      accent: "from-cyan-400/20 to-blue-400/10"
    },
    {
      title: "Late night radio",
      subtitle: "A smooth queue from your recent energy",
      artwork: filteredTracks[2]?.artwork || heroBanner,
      tracks: filteredTracks.slice(2, 6),
      accent: "from-fuchsia-400/20 to-orange-300/10"
    }
  ];

  const moods = ["Chill", "Focus", "Indie", "Electronic", "Rainy", "Travel", "Hindi", "Workout"];

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <img src={brandLogo} alt="Josh-Fy logo" className="h-11 w-11 rounded-2xl object-contain bg-white/5 p-1.5 xl:hidden" />
          <div>
            <p className="text-sm text-slate-400">For you</p>
            <h1 className="font-display text-2xl font-semibold text-white">{getGreeting()}</h1>
          </div>
        </div>

        <SearchBar value={search} onChange={setSearch} placeholder="Search songs, artists, moods..." large />

        <div className="feed-scroll flex gap-2 overflow-x-auto pb-1">
          {chips.map((chip) => (
            <GenreChip key={chip} label={chip} active={chip === activeChip} onClick={() => setActiveChip(chip)} tone="green" />
          ))}
        </div>

        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04]">
          <img src={heroBanner} alt="Josh-Fy banner" className="h-28 w-full object-cover object-center sm:h-36" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/65 to-transparent" />
          <div className="absolute inset-y-0 left-0 flex max-w-[70%] flex-col justify-center px-4 sm:px-5">
            <p className="text-[11px] uppercase tracking-[0.3em] text-accent-300">Josh-Fy</p>
            <p className="mt-2 font-display text-lg font-semibold text-white sm:text-xl">Player-first listening, built for the phone.</p>
            <p className="mt-1 text-xs text-slate-300">{currentTrack ? `${currentTrack.title} - ${currentTrack.artist}` : "Start a track and the player comes alive."}</p>
          </div>
        </div>
      </section>

      <SectionShelf title="Listen again">
        <div className="feed-scroll flex gap-3 overflow-x-auto pb-1">
          {listenAgain.map((track) => (
            <TrackCard key={track.id} track={track} queue={listenAgain} compact />
          ))}
        </div>
      </SectionShelf>

      <SectionShelf title="Quick picks">
        <div className="space-y-3">
          {quickPicks.map((track) => (
            <TrackRow key={track.id} track={track} queue={filteredTracks} />
          ))}
        </div>
      </SectionShelf>

      <SectionShelf title="Made for Josh">
        <div className="feed-scroll flex gap-3 overflow-x-auto pb-1">
          {madeForJosh.map((item) => (
            <PlaylistCard key={item.title} {...item} />
          ))}
        </div>
      </SectionShelf>

      <SectionShelf title="Moods and genres">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {moods.map((mood, index) => (
            <button
              key={mood}
              className="rounded-[20px] border border-white/10 bg-white/[0.05] px-4 py-4 text-left"
              onClick={() => setActiveChip(mood === "Chill" ? "Relax" : mood)}
            >
              <p className="text-sm font-semibold text-white">{mood}</p>
              <p className="mt-1 text-xs text-slate-500">{index % 2 === 0 ? "Tap for quick picks" : "Mixes and tracks"}</p>
            </button>
          ))}
        </div>
      </SectionShelf>

      <SectionShelf title="New discoveries">
        <div className="feed-scroll flex gap-3 overflow-x-auto pb-1">
          {filteredTracks.slice(0, 8).map((track) => (
            <TrackCard key={`discover-${track.id}`} track={track} queue={filteredTracks} />
          ))}
        </div>
      </SectionShelf>
    </div>
  );
}
