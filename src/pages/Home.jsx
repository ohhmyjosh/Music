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
      <section className="hero-grid glass-panel overflow-hidden rounded-[36px] p-6 shadow-glow lg:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-accent-300">Josh-Fy</p>
              <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight text-white lg:text-6xl">
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
            <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-accent-500/16 via-white/[0.04] to-amber-400/10 p-6">
              <p className="text-sm text-slate-300">Now playing vibe</p>
              <h2 className="mt-3 font-display text-2xl font-semibold text-white">
                {currentTrack?.title || "Pick a track to set the mood"}
              </h2>
              <p className="mt-2 text-sm text-slate-400">{currentTrack?.artist || "Josh-Fy launches with discovery-first UI patterns."}</p>
              <div className="mt-6 flex items-center gap-2 text-sm text-accent-200">
                <TrendingUp size={16} />
                <span>Responsive, portfolio-ready, and Vercel-friendly.</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
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
