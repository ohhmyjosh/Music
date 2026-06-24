export default function SectionShelf({ title, action, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
        {action ? <div className="text-xs text-slate-400">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
