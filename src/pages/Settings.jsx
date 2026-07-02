import InstallButton from "../components/pwa/InstallButton";

export default function Settings() {
  const hasJamendoKey = Boolean(import.meta.env.VITE_JAMENDO_CLIENT_ID);

  const sections = [
    {
      title: "Playback",
      rows: ["Autoplay queue - On", "Gapless playback - Coming soon"]
    },
    {
      title: "Music sources",
      rows: [`Jamendo API - ${hasJamendoKey ? "Connected" : "Using fallback data"}`, "Audius discovery - Ready"]
    },
    {
      title: "Downloads",
      rows: ["Offline mode - Coming soon", "Clear cache - Placeholder action"]
    },
    {
      title: "App",
      rows: ["About Josh-Fy", "Version 0.1.0"]
    }
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-slate-400">Preferences</p>
        <h1 className="font-display text-2xl font-semibold text-white">Settings</h1>
      </div>

      <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
        <h2 className="font-display text-lg font-semibold text-white">Install app</h2>
        <p className="mt-1 text-sm text-slate-400">
          Add Josh-Fy to your phone or desktop home screen for a full-screen,
          app-like experience with offline support.
        </p>
        <div className="mt-3">
          <InstallButton />
        </div>
      </section>

      <div className="space-y-4">
        {sections.map((section) => (
          <section key={section.title} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <h2 className="font-display text-lg font-semibold text-white">{section.title}</h2>
            <div className="mt-3 divide-y divide-white/6">
              {section.rows.map((row) => (
                <div key={row} className="flex items-center justify-between gap-3 py-3 text-sm text-slate-300">
                  <span>{row}</span>
                  <button
                    className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-slate-400 transition hover:bg-white/5 hover:text-white"
                    onClick={() => window.alert("This setting is a placeholder for the next version.")}
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
