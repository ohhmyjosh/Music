import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

// A titled, horizontally scrolling row — YouTube Music's basic home-feed unit.
// The ‹ › buttons page by one viewport width and disable at either end.
export default function Shelf({ title, strapline, avatar, moreTo, action, children, className }) {
  const scroller = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
    });
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  // Content arriving (a shelf finishing its fetch) changes the scroll width.
  useEffect(measure, [measure, children]);

  const page = (direction) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <section className={clsx("mt-10 first:mt-4", className)}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {avatar}
          <div className="min-w-0">
            {strapline ? (
              <p className="truncate text-sm uppercase tracking-wide text-yt-muted">{strapline}</p>
            ) : null}
            <h2 className="truncate text-2xl font-bold sm:text-[28px]">{title}</h2>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {moreTo ? (
            <Link to={moreTo} className="pill-outline h-8 px-3">
              More
            </Link>
          ) : null}
          <div className="hidden gap-2 sm:flex">
            <button
              className="icon-btn h-9 w-9 border border-white/20"
              aria-label="Scroll left"
              disabled={edges.start}
              onClick={() => page(-1)}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="icon-btn h-9 w-9 border border-white/20"
              aria-label="Scroll right"
              disabled={edges.end}
              onClick={() => page(1)}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
      <div
        ref={scroller}
        onScroll={measure}
        className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto scroll-px-4 px-4 sm:-mx-6 sm:gap-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0"
      >
        {children}
      </div>
    </section>
  );
}

export function ShelfSkeleton({ round = false, title = true }) {
  return (
    <section className="mt-10 first:mt-4">
      {title ? <div className="skeleton mb-4 h-8 w-56 rounded" /> : null}
      <div className="flex gap-4 overflow-hidden sm:gap-6">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="w-[160px] shrink-0 sm:w-[180px]">
            <div className={clsx("skeleton aspect-square", round ? "rounded-full" : "rounded-md")} />
            <div className="skeleton mt-3 h-4 w-3/4 rounded" />
            <div className="skeleton mt-2 h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function RowsSkeleton({ rows = 8 }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex h-14 items-center gap-4 px-2">
          <div className="skeleton h-10 w-10 rounded" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-1/3 rounded" />
            <div className="skeleton h-3 w-1/4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
