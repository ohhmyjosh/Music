export default function Settings() {
  const hasJamendoKey = Boolean(import.meta.env.VITE_JAMENDO_CLIENT_ID);

  return (
    <div className="space-y-8">
      <section className="glass-panel rounded-[32px] p-6 lg:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-accent-300">Settings</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-white">Project configuration and next-step notes.</h1>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold text-white">API source toggle</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Add `VITE_JAMENDO_CLIENT_ID` to switch Josh-Fy from polished seed data to live Jamendo discovery results.
            </p>
            <p className="mt-4 text-sm text-slate-300">Status: {hasJamendoKey ? "Configured" : "Using fallback data"}</p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold text-white">Future-ready architecture</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              This repo stays intentionally web-only right now. It is ready for later additions like Dexie-powered offline
              storage, PWA setup, or a mobile wrapper without introducing that complexity yet.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
