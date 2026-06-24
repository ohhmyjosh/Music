import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Headphones, Radio, Sparkles, TrendingUp } from "lucide-react";
import SearchBar from "../components/search/SearchBar";
import SectionBlock from "../components/music/SectionBlock";
import TrackCard from "../components/music/TrackCard";
import RecommendationPanel from "../components/music/RecommendationPanel";
import { fetchJamendoTrending } from "../api/jamendo";
import { fetchAudiusTrending } from "../api/audius";
import { fetchRecommendations } from "../api/recommendations";
import { rankTracks } from "../utils/ranking";
import { usePlayerStore } from "../store/playerStore";
import brandLogo from "../assets/branding/logo.png";
import heroBanner from "../assets/branding/banner.png";

const quickStats = [
  { label: "Curated feel", value: "Spotify-inspired", icon: Sparkles },
  { label: "Discovery sources", value: "Jamendo + Audius", icon: Radio },
  { label: "Built for", value: "Web first", icon: Headphones }
];

export default function Home() {
  const [search, setSearch] = useState("");
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

  const { data: recommendations = [] } = useQuery({
    queryKey: ["recommendations", currentTrack?.id],
    queryFn: () => fetchRecommendations(currentTrack),
    enabled: Boolean(currentTrack)
  });

  const spotlightTracks = useMemo(() => {
    const merged = [...jamendoTracks, ...audiusTracks];
    return rankTracks(search, merged).slice(0, 6);
  }, [audiusTracks, jamendoTracks, search]);

  return (
    <div className="space-y-8">
      <section className="hero-grid glass-panel overflow-hidden rounded-[36px] p-4 shadow-glow sm:p-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-stretch">
          <div className="space-y-6 rounded-[30px] border border-white/10 bg-black/15 p-5 sm:p-6 lg:p-7">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <img src={brandLogo} alt="Josh-Fy logo" className="h-10 w-10 rounded-xl object-contain bg-black/20 p-1" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-accent-300">Josh-Fy</p>
                <p className="text-sm text-slate-300">Spotify-inspired discovery UI</p>
              </div>
            </div>

            <div>
              <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight text-white lg:text-6xl">
                Your free music space.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 lg:text-base">
                A Spotify-inspired discovery experience for exploring free music, previewing polished player UI, and
                showcasing a deployable React frontend that is ready for bigger features later.
              </p>
            </div>

            <SearchBar value={search} onChange={setSearch} placeholder="Search artists, moods, tracks, or genres..." />

            <div className="flex flex-wrap gap-3">
              <Link
                to="/search"
                className="rounded-full bg-accent-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-400"
              >
                Explore music
              </Link>
              <Link
                to="/player"
                className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Open player
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-slate-900/70 min-h-[260px] sm:min-h-[320px] xl:min-h-[420px]">
              <img
                src={heroBanner}
                alt="Josh-Fy banner"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <p className="text-sm text-slate-300">Now playing vibe</p>
                <h2 className="mt-3 max-w-lg font-display text-2xl font-semibold text-white sm:text-3xl">
                  {currentTrack?.title || "Pick a track to set the mood"}
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  {currentTrack?.artist || "Josh-Fy launches with discovery-first UI patterns."}
                </p>
                <div className="mt-5 flex items-center gap-2 text-sm text-accent-200">
                  <TrendingUp size={16} />
                  <span>Responsive, portfolio-ready, and Vercel-friendly.</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-3">
              {quickStats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <Icon size={18} className="text-accent-300" />
                  <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SectionBlock title="Spotlight picks" eyebrow="Tailored discovery">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {spotlightTracks.map((track) => (
            <TrackCard key={track.id} track={track} queue={spotlightTracks} />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock title="Trending free tracks" eyebrow="Jamendo">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {jamendoTracks.slice(0, 4).map((track) => (
            <TrackCard key={track.id} track={track} queue={jamendoTracks} />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock title="Fresh community finds" eyebrow="Audius">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {audiusTracks.slice(0, 4).map((track) => (
            <TrackCard key={track.id} track={track} queue={audiusTracks} />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock title="Recently touched" eyebrow="Listening history">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(recentlyPlayed.length ? recentlyPlayed : spotlightTracks.slice(0, 2)).map((track) => (
            <TrackCard key={track.id} track={track} queue={recentlyPlayed.length ? recentlyPlayed : spotlightTracks} compact />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock title="More like your current pick" eyebrow="Recommendations">
        <RecommendationPanel tracks={recommendations} />
      </SectionBlock>
    </div>
  );
}
