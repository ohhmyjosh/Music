import { useRef } from "react";
import { FolderUp } from "lucide-react";
import SectionBlock from "../components/music/SectionBlock";
import OfflineTrackList from "../components/library/OfflineTrackList";
import PlaylistList from "../components/library/PlaylistList";
import { useLibraryStore } from "../store/libraryStore";
import { waveboxSeeds } from "../utils/normalizeTrack";

export default function Library() {
  const fileInputRef = useRef(null);
  const offlineTracks = useLibraryStore((state) => state.offlineTracks);
  const playlists = useLibraryStore((state) => state.playlists);
  const importLocalTrack = useLibraryStore((state) => state.importLocalTrack);

  const tracksById = [...waveboxSeeds, ...offlineTracks].reduce((accumulator, track) => {
    accumulator[track.id] = track;
    return accumulator;
  }, {});

  return (
    <div className="space-y-8">
      <section className="glass-panel rounded-[32px] p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-accent-300">Library</p>
            <h1 className="mt-3 font-display text-4xl font-semibold text-white">A clean foundation for saved music and future offline mode.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Josh-Fy is web-first right now, but this page already demonstrates the structure for playlists, local imports,
              and an IndexedDB-backed library when you want to expand the project later.
            </p>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              className="hidden"
              onChange={async (event) => {
                const files = Array.from(event.target.files || []);
                for (const file of files) {
                  await importLocalTrack(file);
                }
                event.target.value = "";
              }}
            />
            <button
              className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-accent-400"
              onClick={() => fileInputRef.current?.click()}
            >
              <FolderUp size={16} />
              Import local audio
            </button>
          </div>
        </div>
      </section>

      <SectionBlock title="Imported and cached tracks" eyebrow="Library prototype">
        <OfflineTrackList tracks={offlineTracks} />
      </SectionBlock>

      <SectionBlock title="Playlist previews" eyebrow="Collection layout">
        <PlaylistList playlists={playlists} tracksById={tracksById} />
      </SectionBlock>
    </div>
  );
}
