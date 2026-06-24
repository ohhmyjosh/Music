export default function SectionShelf({ title, action, children }) {
  return (
    <section className="space-y-3.5">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="font-display text-[1.02rem] font-semibold tracking-tight text-white">{title}</h2>
        {action ? <div className="text-xs text-slate-500">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
