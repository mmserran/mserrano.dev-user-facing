"use client";

import {
  Children,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
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
// How much of a "page" gets sacrificed (on each side) to guarantee the item
// dimmed at a page's trailing edge clears the *next* page's own edge fade
// before settling - see getPageGeometry below. 45% keeps a sliver of the
// page always making forward progress even with very wide cards.
const MAX_EDGE_FADE_WIDTH_FRACTION = 0.45;
// Fallback fade width (as a fraction of the viewport) used whenever item
// width can't be measured - unchanged from the original flat two-sided
// fade this carousel shipped with.
const FALLBACK_EDGE_FADE_WIDTH_FRACTION = 0.4;

// Gridsome's flickity-viewport mask fades both edges unconditionally, which
// only reads right on an infinitely-wrapping carousel - whatever sits at the
// edge is never truly the first/last item, just mid-loop. This carousel
// doesn't wrap, so a static two-sided fade would permanently obscure the
// real first/last card once Previous/Next disables at that boundary with no
// way to scroll further and reveal it. Faded edges are only where there's
// still more to scroll toward.
//
// How opaque the fade zone's outer edge is animates via the
// @property-registered --carousel-edge-fade-*-opacity custom properties in
// globals.css. atStart pins the left edge's opacity to 1 (indistinguishable
// from fully opaque, since both ends of that stretch are then white) and
// atEnd does the same for the right; when both are true the whole mask is
// opaque end to end. Animating opacity in place, rather than sliding the
// fade zone's boundary wider/narrower, is what makes the transition read as
// the icons themselves fading rather than a wipe sweeping across them.
// Registering the opacities as typed <number> custom properties is what
// makes them glide instead of snap - a plain custom property is "discrete"
// to the browser, so a transitioned value swap just holds the old value and
// jumps to the new one partway through.
function getEdgeFadeOpacities(atStart: boolean, atEnd: boolean): { left: number; right: number } {
  return { left: atStart ? 1 : 0, right: atEnd ? 1 : 0 };
}

// The fade zone's *width* (as a percentage of the viewport) is the one part
// of the gradient's shape that does change - see getPageGeometry - so this
// builds the mask string per-render instead of hardcoding it as a constant.
function getEdgeFadeMask(edgeFadeWidthPercent: number): string {
  const left = Math.round(edgeFadeWidthPercent * 100) / 100;
  const right = Math.round((100 - edgeFadeWidthPercent) * 100) / 100;
  return `linear-gradient(to right, rgba(255, 255, 255, var(--carousel-edge-fade-left-opacity)) 0%, white ${left}%, white ${right}%, rgba(255, 255, 255, var(--carousel-edge-fade-right-opacity)) 100%)`;
}

// Paging by a full viewport width is what let an item dimmed at the
// trailing edge of one page vanish for good on the next: it's not clipped,
// just faded, but if the next page starts exactly where this one ended,
// that item is left behind rather than ever settling in fully opaque. The
// fix is to page by less than a full viewport - reserving two item-widths
// of overlap - so the item that was dimmed lands *past* the next page's own
// edge fade zone instead of inside it.
//
// This only works when item width can actually be measured (via the gap
// between the first two rendered children), which is also exactly when
// there's a meaningful "edge" to fade in the first place - RelatedProjects
// doesn't pass edgeFade, and content-less/unmeasurable cases fall back to
// the original full-viewport-per-page, no-overlap behavior.
function getPageGeometry(
  track: HTMLDivElement,
  edgeFade: boolean,
): { pageAdvancePx: number; edgeFadeWidthPercent: number } {
  const first = track.children[0] as HTMLElement | undefined;
  const second = track.children[1] as HTMLElement | undefined;
  const itemStride = edgeFade && first && second ? second.offsetLeft - first.offsetLeft : 0;

  const edgeFadeWidthPx =
    itemStride > 0
      ? Math.min(itemStride, track.clientWidth * MAX_EDGE_FADE_WIDTH_FRACTION)
      : track.clientWidth * FALLBACK_EDGE_FADE_WIDTH_FRACTION;
  const pageAdvancePx =
    itemStride > 0 ? Math.max(itemStride, track.clientWidth - 2 * edgeFadeWidthPx) : track.clientWidth;

  return {
    pageAdvancePx,
    edgeFadeWidthPercent: track.clientWidth > 0 ? (edgeFadeWidthPx / track.clientWidth) * 100 : 40,
  };
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
  // A "page" is (up to) one screen's worth of cards - however many
  // currently fit in the track's width, matching what Previous/Next/the
  // dots scroll by. With edgeFade on and item width measurable, a page
  // actually advances by less than a full screen (see getPageGeometry), so
  // this undercounts slightly versus one dot per screen - still far fewer
  // than one dot per item, which would be unusably long for a project with
  // a dozen-plus picks.
  const [pageCount, setPageCount] = useState(1);
  const [activePage, setActivePage] = useState(0);
  const [edgeFadeWidthPercent, setEdgeFadeWidthPercent] = useState(40);
  const reducedMotion = usePrefersReducedMotion();
  const itemCount = Children.count(children);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    function updateBoundaries() {
      const track = trackRef.current;
      if (!track || track.clientWidth === 0) return;
      const { pageAdvancePx, edgeFadeWidthPercent } = getPageGeometry(track, edgeFade);
      // Scroll-snap settles the first/last card a few pixels short of the
      // true 0/max scroll extent (the track's own end padding is itself a
      // valid snap position), so boundary detection needs slack wider than a
      // rounding error - otherwise Previous/Next never disable at rest.
      const maxScrollLeft = track.scrollWidth - track.clientWidth;
      const isAtEnd = track.scrollLeft >= maxScrollLeft - BOUNDARY_TOLERANCE_PX;
      const pages =
        track.scrollWidth <= track.clientWidth
          ? 1
          : Math.ceil((track.scrollWidth - track.clientWidth) / pageAdvancePx) + 1;
      setAtStart(track.scrollLeft <= BOUNDARY_TOLERANCE_PX);
      setAtEnd(isAtEnd);
      setPageCount(pages);
      setEdgeFadeWidthPercent(edgeFadeWidthPercent);
      // The last page is usually partial (fewer cards than a full page), so
      // scrollLeft/pageAdvancePx alone would round down and never reach the
      // final page index - reuse the same "at end" check the Next button's
      // disabled state relies on instead.
      setActivePage(isAtEnd ? pages - 1 : Math.round(track.scrollLeft / pageAdvancePx));
    }

    updateBoundaries();
    track.addEventListener("scroll", updateBoundaries, { passive: true });
    const resizeObserver = new ResizeObserver(updateBoundaries);
    resizeObserver.observe(track);

    return () => {
      track.removeEventListener("scroll", updateBoundaries);
      resizeObserver.disconnect();
    };
  }, [itemCount, edgeFade]);

  function scrollByPage(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * getPageGeometry(track, edgeFade).pageAdvancePx,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  function scrollToPage(page: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({
      left: page * getPageGeometry(track, edgeFade).pageAdvancePx,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  // Eased rather than a linear/instant snap, to feel like a smooth reveal
  // rather than a jarring cut - but not so slow that it lags behind the
  // scroll it's responding to. Skipped under prefers-reduced-motion, same
  // as the scroll behavior above.
  const edgeFadeOpacities = getEdgeFadeOpacities(atStart, atEnd);
  const edgeFadeMask = getEdgeFadeMask(edgeFadeWidthPercent);
  const edgeFadeStyle = edgeFade
    ? ({
        WebkitMaskImage: edgeFadeMask,
        maskImage: edgeFadeMask,
        "--carousel-edge-fade-left-opacity": edgeFadeOpacities.left,
        "--carousel-edge-fade-right-opacity": edgeFadeOpacities.right,
        transitionProperty: "--carousel-edge-fade-left-opacity, --carousel-edge-fade-right-opacity",
        transitionDuration: reducedMotion ? "0ms" : "400ms",
        transitionTimingFunction: "ease-in-out",
      } as CSSProperties)
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
