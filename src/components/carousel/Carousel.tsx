"use client";

import { Children, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

function subscribeToReducedMotion(callback: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getPrefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getPrefersReducedMotionServerSnapshot() {
  return false;
}

const BOUNDARY_TOLERANCE_PX = 8;

// Gridsome's flickity-viewport mask fades both edges unconditionally, which
// only reads right on an infinitely-wrapping carousel - whatever sits at the
// edge is never truly the first/last item, just mid-loop. This carousel
// doesn't wrap, so a static two-sided fade would permanently obscure the
// real first/last card once Previous/Next disables at that boundary with no
// way to scroll further and reveal it. Faded edges are only where there's
// still more to scroll toward.
//
// Every branch keeps the same 4-stop shape (transparent/white/white/
// transparent), only sliding the two inner stops - atStart collapses the
// left stop to 0% (no left fade) and atEnd pushes the right stop to 100%
// (no right fade). Because the stop count and order never change, browsers
// that support gradient interpolation can crossfade between them on the
// `mask-image` transition below instead of snapping; browsers that don't
// just snap, same as before, so this is a strict progressive enhancement.
function getEdgeFadeMask(atStart: boolean, atEnd: boolean): string | undefined {
  if (atStart && atEnd) return undefined;
  const leftStop = atStart ? 0 : 40;
  const rightStop = atEnd ? 100 : 60;
  return `linear-gradient(to right, transparent 0%, white ${leftStop}%, white ${rightStop}%, transparent 100%)`;
}

// Matches ProjectTileImage's/AppShell's media-query-tracking pattern:
// subscribe via useSyncExternalStore so SSR and the first client render agree
// (both see `false`) with no hydration mismatch.
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getPrefersReducedMotion,
    getPrefersReducedMotionServerSnapshot,
  );
}

// Generic, content-agnostic horizontal carousel: a native CSS scroll-snap
// track plus Previous/Next buttons. Deliberately has no infinite wraparound
// (buttons disable at each end) and ships no JS dragging - native scrolling
// already gives keyboard users (Tab moves focus into an off-screen item,
// which the browser scrolls into view for free), touch users, and trackpad
// users a working carousel without reimplementing any of that.
//
// Takes pre-rendered, individually-keyed children rather than an
// items/renderItem pair - a render-prop function can't cross the
// Server/Client Component boundary (only serializable JSX can), and callers
// that are Server Components (like RelatedProjects) need to render their
// items themselves.
export default function Carousel({
  children,
  ariaLabel,
  edgeFade = false,
}: {
  children: ReactNode;
  ariaLabel: string;
  // Fades the track's left/right edges to transparent, matching the
  // Gridsome technology carousel's flickity-viewport mask. Off by default -
  // Related Projects doesn't use it.
  edgeFade?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  // A "page" is one screen's worth of cards - however many currently fit in
  // the track's width, matching what Previous/Next already scroll by. This
  // shrinks the dot count as more cards fit per row instead of one dot per
  // item, which would be unusably long for a project with a dozen-plus picks.
  const [pageCount, setPageCount] = useState(1);
  const [activePage, setActivePage] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const itemCount = Children.count(children);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    function updateBoundaries() {
      const track = trackRef.current;
      if (!track || track.clientWidth === 0) return;
      // Scroll-snap settles the first/last card a few pixels short of the
      // true 0/max scroll extent (the track's own end padding is itself a
      // valid snap position), so boundary detection needs slack wider than a
      // rounding error - otherwise Previous/Next never disable at rest.
      const maxScrollLeft = track.scrollWidth - track.clientWidth;
      const isAtEnd = track.scrollLeft >= maxScrollLeft - BOUNDARY_TOLERANCE_PX;
      const pages = Math.max(1, Math.ceil(track.scrollWidth / track.clientWidth));
      setAtStart(track.scrollLeft <= BOUNDARY_TOLERANCE_PX);
      setAtEnd(isAtEnd);
      setPageCount(pages);
      // The last page is usually partial (fewer cards than a full page), so
      // scrollLeft/clientWidth alone would round down and never reach the
      // final page index - reuse the same "at end" check the Next button's
      // disabled state relies on instead.
      setActivePage(isAtEnd ? pages - 1 : Math.round(track.scrollLeft / track.clientWidth));
    }

    updateBoundaries();
    track.addEventListener("scroll", updateBoundaries, { passive: true });
    const resizeObserver = new ResizeObserver(updateBoundaries);
    resizeObserver.observe(track);

    return () => {
      track.removeEventListener("scroll", updateBoundaries);
      resizeObserver.disconnect();
    };
  }, [itemCount]);

  function scrollByPage(direction: 1 | -1) {
    trackRef.current?.scrollBy({
      left: direction * trackRef.current.clientWidth,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  function scrollToPage(page: number) {
    trackRef.current?.scrollTo({
      left: page * trackRef.current.clientWidth,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  const edgeFadeMask = edgeFade ? getEdgeFadeMask(atStart, atEnd) : undefined;
  // Crossfades the mask between shapes (see getEdgeFadeMask) instead of
  // snapping, in browsers that interpolate compatible gradients. Slow and
  // ease-in-out rather than a snappy UI transition, to match the site's
  // other slow ambient motion (the star field's 150-600s drift, the 5s
  // shine sweep) instead of feeling like a button-press response. Skipped
  // under prefers-reduced-motion, same as the scroll behavior above.
  const edgeFadeStyle = edgeFadeMask
    ? {
        WebkitMaskImage: edgeFadeMask,
        maskImage: edgeFadeMask,
        transitionProperty: "mask-image, -webkit-mask-image",
        transitionDuration: reducedMotion ? "0ms" : "900ms",
        transitionTimingFunction: "ease-in-out",
      }
    : undefined;

  return (
    <div className="relative">
      <div
        ref={trackRef}
        role="region"
        aria-label={ariaLabel}
        style={edgeFadeStyle}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 py-1 motion-reduce:scroll-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <button
        type="button"
        onClick={() => scrollByPage(-1)}
        disabled={atStart}
        aria-label="Previous"
        className="absolute top-1/2 left-0 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-lg transition-opacity hover:cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:pointer-events-none disabled:opacity-0"
      >
        <MdChevronLeft aria-hidden="true" size={24} />
      </button>
      <button
        type="button"
        onClick={() => scrollByPage(1)}
        disabled={atEnd}
        aria-label="Next"
        className="absolute top-1/2 right-0 flex size-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-lg transition-opacity hover:cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:pointer-events-none disabled:opacity-0"
      >
        <MdChevronRight aria-hidden="true" size={24} />
      </button>

      {pageCount > 1 && (
        <div className="mt-4 hidden items-center justify-center gap-2 sm:flex">
          {Array.from({ length: pageCount }, (_, page) => (
            <button
              key={page}
              type="button"
              onClick={() => scrollToPage(page)}
              aria-label={`Go to page ${page + 1} of ${pageCount}`}
              aria-current={page === activePage}
              className={`size-2 rounded-full transition-colors hover:cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${
                page === activePage ? "bg-white" : "bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
