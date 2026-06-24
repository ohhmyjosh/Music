import { useState } from "react";
import SectionBlock from "../components/music/SectionBlock";
import PlaylistList from "../components/library/PlaylistList";
import { useLibraryStore } from "../store/libraryStore";
import { waveboxSeeds } from "../utils/normalizeTrack";

export default function Playlists() {
  const [name, setName] = useState("");
  const playlists = useLibraryStore((state) => state.playlists);
  const offlineTracks = useLibraryStore((state) => state.offlineTracks);
  const createPlaylist = useLibraryStore((state) => state.createPlaylist);

  const tracksById = [...waveboxSeeds, ...offlineTracks].reduce((accumulator, track) => {
    accumulator[track.id] = track;
    return accumulator;
  }, {});

  return (
    <div className="space-y-8">
      <section className="glass-panel rounded-[32px] p-6 lg:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-accent-300">Playlists</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-white">Build themed sets the way a music product should feel.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
          This page shows the product thinking behind Josh-Fy: reusable playlist cards, fast creation flow, and a UI
          pattern that can scale into collaboration or sync features later.
        </p>
        <form
          className="mt-6 flex flex-col gap-3 sm:flex-row"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!name.trim()) return;
            await createPlaylist(name.trim());
            setName("");
          }}
        >
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Create a playlist"
            className="glass-panel flex-1 rounded-full px-5 py-3 text-sm text-white outline-none placeholder:text-slate-500"
          />
          <button className="rounded-full bg-accent-500 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-accent-400">
            Save playlist
          </button>
        </form>
      </section>

      <SectionBlock title="Your collections" eyebrow="Saved playlists">
        <PlaylistList playlists={playlists} tracksById={tracksById} />
      </SectionBlock>
    </div>
  );
}
