import { useQuery } from "@tanstack/react-query";
import FullPlayerCard from "../components/player/FullPlayerCard";
import LyricsPanel from "../components/lyrics/LyricsPanel";
import RecommendationPanel from "../components/music/RecommendationPanel";
import SectionBlock from "../components/music/SectionBlock";
import { fetchLyrics } from "../api/lyrics";
import { fetchMusicMetadata } from "../api/musicbrainz";
import { fetchRecommendations } from "../api/recommendations";
import { usePlayerStore } from "../store/playerStore";

export default function PlayerPage() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);

  const { data: lyrics } = useQuery({
    queryKey: ["lyrics", currentTrack?.id],
    queryFn: () => fetchLyrics(currentTrack),
    enabled: Boolean(currentTrack)
  });

  const { data: metadata } = useQuery({
    queryKey: ["metadata", currentTrack?.id],
    queryFn: () => fetchMusicMetadata(currentTrack),
    enabled: Boolean(currentTrack)
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ["player-recommendations", currentTrack?.id],
    queryFn: () => fetchRecommendations(currentTrack),
    enabled: Boolean(currentTrack)
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-accent-300">Player</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-white">Immersive listening view for Josh-Fy.</h1>
      </div>

      <FullPlayerCard />

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <LyricsPanel lyrics={lyrics} />
        <div className="glass-panel rounded-[28px] p-6">
          <h2 className="section-title">Track metadata</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Album</p>
              <p className="mt-3 text-sm text-white">{currentTrack?.album || "Unknown"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Release</p>
              <p className="mt-3 text-sm text-white">{metadata?.releaseDate || "Pending lookup"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Credits</p>
              <p className="mt-3 text-sm text-white">{metadata?.credits || currentTrack?.artist || "Unknown"}</p>
            </div>
          </div>
        </div>
      </section>

      <SectionBlock title="Keep the vibe going" eyebrow="Recommendations">
        <RecommendationPanel tracks={recommendations} />
      </SectionBlock>
    </div>
  );
}
