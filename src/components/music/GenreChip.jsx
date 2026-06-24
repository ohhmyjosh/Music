export default function GenreChip({ label, active = false, onClick, tone = "default" }) {
  const toneMap = {
    default: active ? "bg-white text-slate-950" : "bg-white/6 text-slate-300",
    green: active ? "bg-accent-400 text-slate-950" : "bg-accent-500/12 text-accent-200"
  };

  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border border-white/10 px-3 py-2 text-xs font-medium transition ${toneMap[tone] || toneMap.default}`}
    >
      {label}
    </button>
  );
}
