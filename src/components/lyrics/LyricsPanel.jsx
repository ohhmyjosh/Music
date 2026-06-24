export default function LyricsPanel({ lyrics }) {
  return (
    <section className="glass-panel rounded-[28px] p-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Lyrics</h2>
        <span className="text-xs uppercase tracking-[0.25em] text-slate-500">{lyrics?.source || "placeholder"}</span>
      </div>
      <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-300">
        {lyrics?.text || "Lyrics will appear here when available."}
      </p>
    </section>
  );
}
