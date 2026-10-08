import { useRef } from "react";
import clsx from "clsx";
import { Download, Upload } from "lucide-react";
import InstallButton from "../components/pwa/InstallButton";
import { LANGUAGES } from "../api/feed";
import { useLibraryStore } from "../store/libraryStore";
import { usePlayerStore } from "../store/playerStore";
import { useDownloadsStore } from "../store/downloadsStore";
import { useUiStore } from "../store/uiStore";

function Section({ title, description, children }) {
  return (
    <section className="border-b border-white/10 py-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {description ? <p className="mt-1 text-sm text-yt-muted">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Switch({ on, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-6 py-2">
      <span>
        <span className="block">{label}</span>
        {hint ? <span className="block text-sm text-yt-muted">{hint}</span> : null}
      </span>
      <button
        role="switch"
        aria-checked={on}
        onClick={onChange}
        className={clsx("relative h-5 w-9 shrink-0 rounded-full transition-colors", on ? "bg-accent-500/60" : "bg-white/30")}
      >
        <span
          className={clsx(
            "absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full shadow transition-all",
            on ? "left-4 bg-accent-400" : "left-[-2px] bg-white"
          )}
        />
      </button>
    </label>
  );
}

export default function Settings() {
  const profileName = useLibraryStore((state) => state.profileName);
  const setProfileName = useLibraryStore((state) => state.setProfileName);
  const languages = useLibraryStore((state) => state.languages);
  const setLanguages = useLibraryStore((state) => state.setLanguages);
  const exportLibrary = useLibraryStore((state) => state.exportLibrary);
  const importLibrary = useLibraryStore((state) => state.importLibrary);
  const clearHistory = useLibraryStore((state) => state.clearHistory);
  const clearSearchHistory = useLibraryStore((state) => state.clearSearchHistory);
  const autoplay = usePlayerStore((state) => state.autoplay);
  const toggleAutoplay = usePlayerStore((state) => state.toggleAutoplay);
  const downloads = useDownloadsStore((state) => state.items);
  const removeDownload = useDownloadsStore((state) => state.remove);
  const toast = useUiStore((state) => state.toast);
  const fileInput = useRef(null);

  const toggleLanguage = (lang) => {
    const next = languages.includes(lang) ? languages.filter((item) => item !== lang) : [...languages, lang];
    if (!next.length) {
      toast("Pick at least one language");
      return;
    }
    setLanguages(next);
  };

  const backup = () => {
    const blob = new Blob([JSON.stringify(exportLibrary(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `josh-fy-library-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const restore = async (file) => {
    try {
      importLibrary(JSON.parse(await file.text()));
      toast("Library restored and merged");
    } catch {
      toast("That file isn't a Josh-Fy backup");
    }
  };

  const downloadMb = downloads.reduce((sum, item) => sum + (item.size || 0), 0) / 1e6;

  return (
    <div className="page max-w-3xl pt-4">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Section title="Your profile" description="Josh-Fy has no accounts — your library lives on this device.">
        <label className="block max-w-sm">
          <span className="text-xs text-yt-muted">Name shown in the app</span>
          <input
            value={profileName}
            placeholder="Your name"
            onChange={(event) => setProfileName(event.target.value)}
            className="mt-1 w-full border-b border-white/30 bg-transparent py-1.5 text-base outline-none focus:border-white"
          />
        </label>
      </Section>

      <Section title="Languages" description="Home, Explore and moods are tuned to the languages you pick.">
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => toggleLanguage(lang)}
              className={clsx("chip capitalize", languages.includes(lang) && "chip-active")}
            >
              {lang}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Playback">
        <Switch
          on={autoplay}
          onChange={toggleAutoplay}
          label="Autoplay"
          hint="Keep playing similar songs when your queue ends"
        />
        <p className="mt-3 text-sm text-yt-muted">
          Keyboard: Space play/pause · ←/→ seek 10s · Shift+N / Shift+P next/previous · M mute · ↑/↓ volume · / search ·
          + like · − dislike
        </p>
      </Section>

      <Section
        title="Back up your library"
        description="Move your likes, playlists and subscriptions to another device. Restoring merges — nothing is overwritten."
      >
        <div className="flex flex-wrap gap-3">
          <button className="pill-outline" onClick={backup}>
            <Download size={18} /> Export backup
          </button>
          <button className="pill-outline" onClick={() => fileInput.current?.click()}>
            <Upload size={18} /> Restore from file
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) restore(file);
            }}
          />
        </div>
      </Section>

      <Section title="Storage & privacy">
        <div className="flex flex-wrap gap-3">
          <button
            className="pill-outline"
            onClick={() => {
              clearHistory();
              toast("Listening history cleared");
            }}
          >
            Clear listening history
          </button>
          <button
            className="pill-outline"
            onClick={() => {
              clearSearchHistory();
              toast("Search history cleared");
            }}
          >
            Clear search history
          </button>
          <button
            className="pill-outline"
            disabled={!downloads.length}
            onClick={async () => {
              for (const item of downloads) await removeDownload(item.track.id);
              toast("Downloads removed");
            }}
          >
            Remove all downloads ({downloadMb.toFixed(0)} MB)
          </button>
        </div>
      </Section>

      <Section title="Install app" description="Add Josh-Fy to your home screen for a full-screen app with lock-screen controls.">
        <InstallButton />
      </Section>

      <Section title="About">
        <p className="text-sm leading-6 text-yt-muted">
          Josh-Fy — free music for everyone. Songs, albums and artists come from the JioSaavn catalog, indie uploads from
          Audius, lyrics from LRCLIB and lyrics.ovh, cover fixes from iTunes.
        </p>
      </Section>
    </div>
  );
}
