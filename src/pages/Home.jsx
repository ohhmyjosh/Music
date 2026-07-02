import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "../components/search/SearchBar";
import SectionShelf from "../components/music/SectionShelf";
import TrackCard from "../components/music/TrackCard";
import TrackRow from "../components/music/TrackRow";
import PlaylistCard from "../components/music/PlaylistCard";
import GenreChip from "../components/music/GenreChip";
import { usePlayerStore } from "../store/playerStore";
import { demoTracks } from "../data/demoTracks";
import { demoAlbums } from "../data/demoAlbums";
import { demoPlaylists } from "../data/demoPlaylists";
import { demoGenres } from "../data/demoGenres";
import { normalizeTrack } from "../utils/normalizeTrack";
import { rankTracks } from "../utils/ranking";
import { fetchAudiusTrending, fetchAudiusByGenre } from "../api/audius";
import heroBanner from "../assets/branding/banner.png";

const chips = ["All", "Relax", "Workout", "Focus", "Indie", "R&B", "Hindi", "Downloadable"];
const catalog = demoTracks.map((track) => normalizeTrack(track, "demo"));
const personalizedPlaylists = demoPlaylists.filter((playlist) =>
  [
    "playlist-josh-rap-mix",
    "playlist-late-night-rnb",
    "playlist-focus-lofi",
    "playlist-pop-drive",
    "playlist-hindi-mood"
  ].includes(playlist.id)
);
const radioStations = demoPlaylists.filter((playlist) => playlist.id.startsWith("radio-"));

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning, Josh";
  if (hour < 18) return "Good afternoon, Josh";
  return "Good evening, Josh";
}

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeChip, setActiveChip] = useState("All");

  // Enter runs a real, network-backed search on the Search page (Audius).
  const runSearch = (term) => {
    const q = term.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const recentlyPlayed = usePlayerStore((state) => state.recentlyPlayed);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const queueLength = usePlayerStore((state) => state.queue.length);

  // Real, streamable music from the free Audius network.
  const { data: trending = [] } = useQuery({
    queryKey: ["audius-trending"],
    queryFn: () => fetchAudiusTrending(20)
  });
  const { data: hipHop = [] } = useQuery({
    queryKey: ["audius-genre", "Hip-Hop/Rap"],
    queryFn: () => fetchAudiusByGenre("Hip-Hop/Rap", 12)
  });
  const { data: electronic = [] } = useQuery({
    queryKey: ["audius-genre", "Electronic"],
    queryFn: () => fetchAudiusByGenre("Electronic", 12)
  });
  const { data: rnb = [] } = useQuery({
    queryKey: ["audius-genre", "R&B/Soul"],
    queryFn: () => fetchAudiusByGenre("R&B/Soul", 12)
  });

  // Seed the player queue with real trending music once, so the very first Play
  // (and next/previous) flows through streamable Audius songs rather than nothing.
  useEffect(() => {
    if (trending.length && !queueLength) setQueue(trending);
  }, [trending, queueLength, setQueue]);

  const filteredTracks = useMemo(() => {
    let next = rankTracks(search, catalog);

    if (activeChip !== "All") {
      next = next.filter((track) => {
        const haystack = [track.genre, track.mood, ...(track.tags || [])]
          .join(" ")
          .toLowerCase();
        if (activeChip === "Downloadable") {
          return Boolean(track.isDownloadable || track.localOnly);
        }
        return haystack.includes(activeChip.toLowerCase());
      });
    }

    return next;
  }, [activeChip, search]);

  // Prefer real songs the user actually played; otherwise real trending music.
  const listenAgain = recentlyPlayed.length
    ? recentlyPlayed
    : (trending.length ? trending : filteredTracks).slice(0, 10);
  const quickPicks = (trending.length ? trending : filteredTracks).slice(0, 6);

  return (
    <div className="space-y-6">
      <section className="space-y-3.5">
        <div className="space-y-1">
          <p className="text-sm text-slate-400">For you</p>
          <h1 className="font-display text-2xl font-semibold text-white">{getGreeting()}</h1>
        </div>

        <SearchBar
          value={search}
          onChange={setSearch}
          onSubmit={runSearch}
          placeholder="Search all music — press Enter"
          large
        />

        <div className="feed-scroll flex gap-2 overflow-x-auto pb-1">
          {chips.map((chip) => (
            <GenreChip
              key={chip}
              label={chip}
              active={chip === activeChip}
              onClick={() => setActiveChip(chip)}
              tone="green"
            />
          ))}
        </div>

        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] shadow-[0_14px_36px_rgba(0,0,0,0.24)]">
          <img
            src={heroBanner}
            alt="Josh-Fy banner"
            className="h-20 w-full object-cover object-center sm:h-24"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/65 to-transparent" />
          <div className="absolute inset-y-0 left-0 flex max-w-[75%] flex-col justify-center px-4 sm:px-5">
            <p className="text-[11px] uppercase tracking-[0.3em] text-accent-300">Now spinning</p>
            <p className="mt-1 font-display text-sm font-semibold text-white sm:text-base">
              {currentTrack ? currentTrack.title : "Mainstream-inspired demo picks"}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-300 sm:text-xs">
              {currentTrack
                ? `${currentTrack.artist} - ${currentTrack.genre}`
                : "Pop, rap, R&B, lo-fi, Hindi, workout, and throwback moods."}
            </p>
          </div>
        </div>
      </section>

      {trending.length ? (
        <SectionShelf title="Trending now">
          <div className="feed-scroll flex gap-3 overflow-x-auto pb-1">
            {trending.map((track) => (
              <TrackCard key={track.id} track={track} queue={trending} compact />
            ))}
          </div>
        </SectionShelf>
      ) : null}

      {hipHop.length ? (
        <SectionShelf title="Hip-Hop right now">
          <div className="feed-scroll flex gap-3 overflow-x-auto pb-1">
            {hipHop.map((track) => (
              <TrackCard key={track.id} track={track} queue={hipHop} compact />
            ))}
          </div>
        </SectionShelf>
      ) : null}

      {electronic.length ? (
        <SectionShelf title="Electronic & dance">
          <div className="feed-scroll flex gap-3 overflow-x-auto pb-1">
            {electronic.map((track) => (
              <TrackCard key={track.id} track={track} queue={electronic} compact />
            ))}
          </div>
        </SectionShelf>
      ) : null}

      {rnb.length ? (
        <SectionShelf title="R&B & Soul">
          <div className="feed-scroll flex gap-3 overflow-x-auto pb-1">
            {rnb.map((track) => (
              <TrackCard key={track.id} track={track} queue={rnb} compact />
            ))}
          </div>
        </SectionShelf>
      ) : null}

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
            <TrackRow key={track.id} track={track} queue={quickPicks} />
          ))}
        </div>
      </SectionShelf>

      <SectionShelf title="Albums for you">
        <div className="feed-scroll flex gap-3 overflow-x-auto pb-1">
          {demoAlbums.map((album) => (
            <PlaylistCard
              key={album.id}
              title={album.title}
              subtitle={`${album.artist} · ${album.mood}`}
              artwork={album.image}
              tracks={filteredTracks.filter((track) => track.album === album.title)}
              badge="Album"
              meta={album.genre}
              compact
              onOpen={() => window.alert("Album view coming soon.")}
            />
          ))}
        </div>
      </SectionShelf>

      <SectionShelf title="Made for Josh">
        <div className="feed-scroll flex gap-3 overflow-x-auto pb-1">
          {personalizedPlaylists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              title={playlist.title}
              subtitle={`${playlist.genre} · ${playlist.mood}`}
              artwork={playlist.image}
              tracks={playlist.tracks.map((track) => normalizeTrack(track, "demo"))}
              badge="Playlist"
              meta={playlist.genre}
              compact
              onOpen={() => window.alert("Playlist view coming soon.")}
            />
          ))}
        </div>
      </SectionShelf>

      <SectionShelf title="Moods and genres">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {demoGenres.map((genre) => (
            <button
              key={genre.id}
              className="overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.05] text-left transition hover:bg-white/[0.07]"
              onClick={() => setActiveChip(genre.label === "Lo-fi" ? "Focus" : genre.label)}
            >
              <img src={genre.image} alt={genre.label} className="h-24 w-full object-cover" />
              <div className="p-3">
                <p className="text-sm font-semibold text-white">{genre.label}</p>
                <p className="mt-1 text-xs text-slate-500">{genre.description}</p>
              </div>
            </button>
          ))}
        </div>
      </SectionShelf>

      <SectionShelf title="Artist-inspired radios">
        <div className="feed-scroll flex gap-3 overflow-x-auto pb-1">
          {radioStations.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              title={playlist.title}
              subtitle={`${playlist.genre} · ${playlist.mood}`}
              artwork={playlist.image}
              tracks={playlist.tracks.map((track) => normalizeTrack(track, "demo"))}
              badge="Radio"
              meta={playlist.genre}
              compact
              onOpen={() => window.alert("Radio view coming soon.")}
            />
          ))}
        </div>
      </SectionShelf>
    </div>
  );
}
