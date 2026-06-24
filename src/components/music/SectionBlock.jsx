export default function SectionBlock({ title, eyebrow, action, children }) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          {eyebrow ? <p className="text-xs uppercase tracking-[0.35em] text-accent-300">{eyebrow}</p> : null}
          <h2 className="section-title mt-2">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
