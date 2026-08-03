"use client";

import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type Ref } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import SectionDivider from "@/components/typography/SectionDivider";
import { getCenterEmphasisCarousel, getMediaVariants, type CenterEmphasisSlide, type Project } from "@/lib/content";
import { usePrefersReducedMotion } from "./ProjectTileImage";

const TRANSITION_MS = 500;
const SLIDE_TRANSITION = `transform ${TRANSITION_MS}ms ease, opacity ${TRANSITION_MS}ms ease, visibility ${TRANSITION_MS}ms ease`;

const SIZES = "(min-width: 464px) 362px, 78vw";

// vue-carousel-3d's per-step fan geometry, read off the live site's rendered
// DOM (count=4, display=7): step 1 => translateX(240px) translateZ(-400px)
// rotateY(35deg); step 2 => translateX(480px) translateZ(-500px), rotateY
// held constant. Expressed here as a percentage of the slide's own width
// (240/362) rather than a fixed pixel offset, so the fan scales with the
// responsive card size instead of overflowing at narrow viewports.
const STEP_TRANSLATE_X_PERCENT = 66;
const STEP_TRANSLATE_Z_PX = [0, -400, -500];
const STEP_ROTATE_DEG = 35;
// How many steps from the active slide still get a visible fanned position -
// matches vue-carousel-3d clipping slides beyond its `display` count once a
// project has more slides than fit. Every project shipping this block today
// (cygnus-management-llc, hospitalitypulse-inc) has 4-5 slides, so this never
// actually clips real content; it only guards a future project with more.
const MAX_VISIBLE_STEPS = 2;

// The live carousel-3d instance loops (no disable-wrap set), so a slide's fan
// position is its *shortest circular* distance from the active index, not a
// plain index difference - e.g. with 4 slides, the slide opposite the active
// one fans to whichever side ties the modulo. Confirmed against the live
// site's own DOM: with "Home Page" (index 0) active, "Pricing Page" (index 2)
// renders 2 steps to the *left*, not the right.
function circularStep(index: number, activeIndex: number, total: number): number {
  const half = Math.floor(total / 2);
  return (((index - activeIndex + half) % total) + total) % total - half;
}

// Ports the Gridsome frontend's pbCarouselCenterEmphasisActual: a 3D
// coverflow of a project's own page screenshots. Renders nothing when the
// project has no center-emphasis-carousel block or every slide resolved to
// no media.
//
// Deliberate departures from the vue-carousel-3d original, all in service of
// this migration's cross-browser/accessibility/responsive-design goals:
//   - Previous/Next buttons and dot pagination are always present (the live
//     site has no visible controls at all - dragging or clicking a side
//     slide are the only ways to navigate, which excludes keyboard users
//     entirely).
//   - Left/Right arrow keys move the carousel while focus is anywhere inside
//     it, moving DOM focus along with the active slide (a roving tabindex -
//     only the active slide's own button is a Tab stop, so Tab from outside
//     the carousel lands directly on whichever slide is centered, matching
//     what the user sees, rather than always on the first slide in DOM
//     order).
//   - A visually-hidden aria-live region announces the active slide, since
//     its position is otherwise conveyed only by the 3D layout.
//   - Non-active slides are aria-hidden (only the active slide's caption and
//     image are exposed as real content) to keep the accessibility tree from
//     duplicating every slide's caption once via its own text and again via
//     its selectable button's aria-label.
//   - The fan's transition is skipped under prefers-reduced-motion, matching
//     every other interactive animation in this codebase.
export default function CenterEmphasisCarousel({ project }: { project: Project }) {
  const { title, content, slides: rawSlides } = getCenterEmphasisCarousel(project);
  const slides = rawSlides.filter((slide) => getMediaVariants(slide.filename).length > 0);
  const headingId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  // Guards against a second move starting before the first one's 3D
  // transform transition has finished. Without this, an interrupted
  // transition - one slide re-targeted mid-flight toward a new position
  // while another is also still moving - left transform-style: preserve-3d
  // depth-sorting the two incorrectly for the rest of that move: the
  // (still-transitioning) previously-active slide could render in front of
  // the new one instead of behind it, clipping across the middle of what
  // should be the frontmost card. Confirmed live: rapid clicking doesn't
  // reproduce this on the reference site, meaning it also ignores
  // navigation input mid-move rather than actually resolving overlapping
  // transitions correctly.
  const transitionLockRef = useRef(false);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // One entry per slide, indexed to match `slides` - populated via each
  // CarouselSlide's own ref callback, so handleKeyDown can move DOM focus
  // to whichever slide becomes active without needing a re-render/effect
  // round trip first (the button is the same DOM node across a navigation
  // regardless - see CarouselSlide - so it's already mounted and focusable
  // the instant goTo returns).
  const slideRefs = useRef<(HTMLButtonElement | null)[]>([]);

  if (slides.length === 0) {
    return null;
  }

  const total = slides.length;

  // Returns whether it actually navigated (false when ignored - see
  // transitionLockRef above - or when index is already the active one),
  // so callers that need to react to a real move (handleKeyDown moving
  // focus along with it) don't do so for a no-op call.
  function goTo(index: number): boolean {
    const next = ((index % total) + total) % total;
    if (transitionLockRef.current || next === activeIndex) {
      return false;
    }
    setActiveIndex(next);
    transitionLockRef.current = true;
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    transitionTimeoutRef.current = setTimeout(
      () => {
        transitionLockRef.current = false;
      },
      reducedMotion ? 0 : TRANSITION_MS,
    );
    return true;
  }

  function goToFromPointer(index: number): void {
    const next = ((index % total) + total) % total;
    if (goTo(index)) {
      slideRefs.current[next]?.focus();
    }
  }

  // Arrow keys move which slide is active without moving DOM focus off of
  // whatever was already focused - by itself, that leaves the visible focus
  // ring sitting on the slide that was tabbed to, wherever the fan has since
  // rotated it to, rather than on the slide now actually centered. Explicitly
  // moving focus to the new active slide's own button here (composite-widget
  // "roving focus", same idea as arrow keys in a tablist) is what keeps the
  // ring on the centered slide, matching Tab's own behavior of landing
  // exactly on whichever slide becomes active.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      const next = (activeIndex - 1 + total) % total;
      if (goTo(next)) {
        slideRefs.current[next]?.focus();
      }
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      const next = (activeIndex + 1) % total;
      if (goTo(next)) {
        slideRefs.current[next]?.focus();
      }
    }
  }

  return (
    <section
      aria-labelledby={headingId}
      className="mx-auto w-full max-w-[768px] px-5 pb-16 sm:pb-24 md:max-w-[1024px] md:px-[60px] xl:max-w-[1440px] xl:px-[100px]"
    >
      <SectionDivider id={headingId} title={title} />

      {content && (
        // content.json is trusted, developer-controlled build-time data (see
        // AGENTS.md's Data section) restored via `make restore-media`, not
        // user input - this mirrors the Gridsome source's own v-html.
        // Styling (size, weight, left alignment, full-opacity white, no max
        // width) matches .reading--space's own computed style on the live
        // site, read directly off hospitalitypulse-inc's carousel (the only
        // project whose content is non-empty) rather than reusing a
        // different block's paragraph treatment.
        <p
          className="mt-6 text-base leading-normal text-white [&_a]:text-brand-blue [&_a]:underline [&_a]:underline-offset-2"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}

      <div className="relative mt-10" onKeyDown={handleKeyDown}>
        <p aria-live="polite" className="sr-only">
          {`Slide ${activeIndex + 1} of ${total}: ${slides[activeIndex].title}`}
        </p>

        {/* --slide-w/--slide-h pin every slide (via CarouselSlide's own
            w-[var(--slide-w)] h-[var(--slide-h)]) to the live site's actual
            fixed 362x602 slide box - confirmed against its computed styles,
            which hold that size at any viewport wide enough to fit it rather
            than scaling it down early. min(78vw,362px) is what makes it
            responsive instead of literally fixed: it only shrinks (still at
            the true 362:602 ratio, via the --slide-h calc) once the viewport
            can no longer fit 362px. Defined here (not on the perspective
            element below) so they're still inherited by both it and the
            slides - custom-property inheritance doesn't care which element
            in the chain carries which other styles.

            This element is deliberately wider than one slide - fanned
            neighbors translate outside a slide's own box, and a wrapper
            sized to match one slide would clip them entirely instead of
            letting them peek in from the sides - and its mask-image is the
            live site's own edge fade (`.pbCarousel .carousel-3d-container`'s
            computed mask, read directly off it - not scoped to mobile the
            way its source SCSS's `@include sm` naming suggests; that mixin
            means "sm and up", so it's present at every width worth matching
            here). overflow-hidden keeps the fan's reach from bleeding past
            the section as well as backstopping the mask on browsers that
            don't support mask-image (Safari still needs the -webkit- prefix
            below).

            perspective and transform-style: preserve-3d deliberately live on
            the *inner* div below, not here, even though nothing stops this
            element from also declaring them: overflow other than visible,
            and mask-image other than none, are both "grouping properties"
            that the CSS Transforms spec requires to force transform-style to
            compute as flat regardless of what's declared, on whichever
            element they're set on. Both are set here for the edge fade, so
            preserve-3d here would silently do nothing. This is exactly what
            broke stacking on first load in real (GPU-compositing) Chrome
            while looking fine in this sandbox's headless/software-rendered
            one - headless didn't enforce the flattening the same way,
            which is what let the bug through undetected. */}
        <div className="relative mx-auto h-[var(--slide-h)] w-full overflow-hidden [--slide-h:calc(var(--slide-w)*602/362)] [--slide-w:min(78vw,362px)] [-webkit-mask-image:linear-gradient(90deg,transparent,white_40%,white_60%,transparent)] [mask-image:linear-gradient(90deg,transparent,white_40%,white_60%,transparent)]">
          {/* Each slide is a *direct* child of this element deliberately -
              perspective only applies to an element's direct children, and
              transform-style: preserve-3d governs how *its own* children
              are depth-sorted relative to each other - both need to be the
              slides' actual parent, not some ancestor further up, for the
              fan to render with correct perspective and for the incoming
              and outgoing slide during a move to correctly pass in front of
              and behind each other (matching the live site) instead of
              needing an approximated z-index flip.

              These slides are pointer-events-none (see CarouselSlide) -
              this layer is purely visual now. Real preserve-3d (once it's
              not silently flattened by a grouping property somewhere in its
              ancestor chain, which an earlier version of this element was
              guilty of) turns out to make mouse hit-testing for a rotated,
              overlapping sibling fundamentally unreliable in practice, not
              just imprecise at the shape's true edges as a rotated
              rectangle's bounding-box math alone would explain: a dense
              64-point grid sampled across a fanned slide's own bounding box
              found elementFromPoint resolving to *something else* at every
              single point, then a 312-point grid confirmed the same result
              (verified via Playwright, both before and after this had a
              real click silently land on the wrong element and never
              register). The flat, unrotated click-catcher layer just below
              this one is what actually handles clicks now - since it
              doesn't need to depth-sort anything, ordinary 2D hit-testing
              there is completely reliable. */}
          <div className="h-full w-full [perspective:1400px] [transform-style:preserve-3d]">
            {slides.map((slide, index) => {
              const step = circularStep(index, activeIndex, total);
              return (
                <CarouselSlide
                  key={`${slide.filename}-${index}`}
                  ref={(el) => {
                    slideRefs.current[index] = el;
                  }}
                  slide={slide}
                  index={index}
                  total={total}
                  step={step}
                  isActive={step === 0}
                  reducedMotion={reducedMotion}
                  onSelect={() => goTo(index)}
                />
              );
            })}
          </div>

          {/* The click-catcher layer: flat (no rotateY/translateZ/preserve-3d
              at all) invisible buttons, one per visible slide, positioned at
              the same X offset the visual layer's fan uses but without any
              of the rotation that makes hit-testing there unreliable. Each
              one is a real <button> so it's a genuine click/tap target, but
              aria-hidden and unfocusable (tabIndex -1) - the *visual*
              layer's own buttons (see CarouselSlide) are what screen reader
              and keyboard users interact with; this layer exists only to
              give mouse/touch users a working click target that lines up
              with what they see. z-index favors whichever slide is
              nominally closer to center, matching the visual stacking, for
              the ~114px zones where adjacent slides' flat catcher boxes
              overlap. */}
          <div className="absolute inset-0 h-full w-full" aria-hidden="true">
            {slides.map((slide, index) => {
              const step = circularStep(index, activeIndex, total);
              const magnitude = Math.min(Math.abs(step), MAX_VISIBLE_STEPS);
              const isVisible = Math.abs(step) <= MAX_VISIBLE_STEPS;
              if (!isVisible) {
                return null;
              }
              const fanOffsetPercent = Math.sign(step) * magnitude * STEP_TRANSLATE_X_PERCENT;
              return (
                <button
                  key={`${slide.filename}-${index}-catcher`}
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => goToFromPointer(index)}
                  aria-hidden="true"
                  style={{
                    transform: `translateX(calc(-50% + ${fanOffsetPercent}%))`,
                    zIndex: MAX_VISIBLE_STEPS + 1 - magnitude,
                  }}
                  className="absolute top-0 left-1/2 h-[var(--slide-h)] w-[var(--slide-w)] cursor-pointer appearance-none border-0 bg-transparent p-0"
                />
              );
            })}
          </div>
        </div>

        {total > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => goToFromPointer(activeIndex - 1)}
              aria-label="Previous slide"
              className="flex size-10 items-center justify-center rounded-full bg-white text-black shadow-lg hover:cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              <MdChevronLeft aria-hidden="true" size={24} />
            </button>

            <div className="flex items-center gap-2">
              {slides.map((slide, index) => (
                <button
                  key={`${slide.filename}-${index}`}
                  type="button"
                  onClick={() => goToFromPointer(index)}
                  aria-label={`Go to slide ${index + 1} of ${total}: ${slide.title}`}
                  aria-current={index === activeIndex}
                  className={`size-2 rounded-full transition-colors hover:cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${
                    index === activeIndex ? "bg-white" : "bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => goToFromPointer(activeIndex + 1)}
              aria-label="Next slide"
              className="flex size-10 items-center justify-center rounded-full bg-white text-black shadow-lg hover:cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              <MdChevronRight aria-hidden="true" size={24} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function CarouselSlide({
  slide,
  index,
  total,
  step,
  isActive,
  reducedMotion,
  onSelect,
  ref,
}: {
  slide: CenterEmphasisSlide;
  index: number;
  total: number;
  step: number;
  isActive: boolean;
  reducedMotion: boolean;
  onSelect: () => void;
  // React 19 forwards a `ref` prop on function components without needing
  // forwardRef - handleKeyDown uses it to move focus onto this slide's own
  // button when arrow keys make it the active one.
  ref?: Ref<HTMLButtonElement>;
}) {
  const variants = getMediaVariants(slide.filename);
  if (variants.length === 0) {
    return null;
  }

  const largest = variants.reduce((a, b) => ((b.width ?? 0) > (a.width ?? 0) ? b : a));
  const srcSet = variants
    .filter((v): v is { width: number; url: string } => v.width != null)
    .map((v) => `${v.url} ${v.width}w`)
    .join(", ");

  const magnitude = Math.min(Math.abs(step), MAX_VISIBLE_STEPS);
  const direction = Math.sign(step);
  const isVisible = Math.abs(step) <= MAX_VISIBLE_STEPS;

  // -50% first re-centers the slide on the stage's horizontal midpoint (its
  // `left-1/2` positioning below only anchors its left edge there); the
  // step offset then fans it out from that centered rest position. Both
  // percentages are relative to the slide's own width, per the CSS
  // transform spec, so this still holds at every breakpoint's slide size.
  //
  // No z-index here - the stage's own transform-style: preserve-3d puts
  // every slide in a shared 3D space, so the browser stacks them by their
  // actual rendered depth (this translateZ) each frame instead of needing
  // an approximated, discretely-flipped z-index to fake it. That's what
  // makes the incoming and outgoing slide during a move correctly pass in
  // front of and behind each other continuously, matching the live site,
  // rather than snapping stacking order at one single moment.
  const fanOffsetPercent = direction * magnitude * STEP_TRANSLATE_X_PERCENT;
  const style: CSSProperties = {
    transform: `translateX(calc(-50% + ${fanOffsetPercent}%)) translateZ(${STEP_TRANSLATE_Z_PX[magnitude]}px) rotateY(${direction === 0 ? 0 : -direction * STEP_ROTATE_DEG}deg)`,
    opacity: isVisible ? 1 : 0,
    visibility: isVisible ? "visible" : "hidden",
    transition: reducedMotion ? "none" : SLIDE_TRANSITION,
  };

  // w-[var(--slide-w)]/h-[var(--slide-h)] read the same two custom
  // properties the stage (this element's parent) sets, rather than each
  // slide computing its own size independently - that's what keeps every
  // slide (and the stage's own height) at identical, agreeing dimensions.
  //
  // pointer-events-none: this button is purely visual now - the flat
  // click-catcher layer rendered alongside it (see the parent component)
  // is what mouse/touch clicks actually land on, since real 3D
  // hit-testing here proved unreliable. Keyboard users are unaffected:
  // pointer-events only gates pointer-device hit-testing, not the
  // synthetic click a focused button's own Enter/Space activation fires,
  // so onClick below still fires for them.
  const className =
    "pointer-events-none absolute top-0 left-1/2 h-[var(--slide-h)] w-[var(--slide-w)] flex flex-col gap-2 p-1 [backface-visibility:hidden]";

  const content = (
    <>
      <h6
        aria-hidden={!isActive}
        className="shine-text animate-shine motion-reduce:animate-none text-center text-xs font-semibold tracking-widest text-white uppercase"
      >
        {slide.title}
      </h6>
      {/* Not object-fit at all for the common case (no offset): the live
          site's own screenshots range from a 0.45 to a 2.03 width/height
          ratio (verified against its computed styles), each rendered at
          full slide width with height left to auto - so the image is never
          shrunk to fit, only ever clipped by this wrapper's fixed height
          when it's naturally taller than the slot (confirmed live: e.g. the
          Services Page screenshot's own box computes taller than its slide
          and simply overflows-hidden at the bottom, rather than being
          scaled down to fit - object-contain's shrink-to-fit was the wrong
          model and made every screenshot look smaller than the live site's).
          A slide with an explicit crop offset (e.g. hospitalitypulse's
          "bottom") is the one exception - that's a deliberate art-directed
          crop, so it still uses object-fit: cover against the full slot to
          make the offset meaningful. */}
      <div className="flex-1 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- discrete manifest widths need a manual srcset */}
        <img
          src={largest.url}
          srcSet={srcSet || undefined}
          sizes={srcSet ? SIZES : undefined}
          alt=""
          aria-hidden={!isActive}
          loading="lazy"
          decoding="async"
          style={slide.offset ? { objectFit: "cover", objectPosition: `0 ${slide.offset}` } : undefined}
          className={slide.offset ? "h-full w-full" : "h-auto w-full"}
        />
      </div>
    </>
  );

  // Always the same element (a button), active or not - switching between a
  // <div> and a <button> as a slide became/stopped being active forced React
  // to unmount and recreate the DOM node on every transition (different host
  // tags can't be reconciled in place), which left the fan transition with
  // no previous frame to animate from and made it snap instead of glide.
  // Clicking the already-active slide is a harmless no-op re-select.
  return (
    <button
      ref={ref}
      type="button"
      onClick={onSelect}
      style={style}
      // Roving tabindex: only the active slide is a Tab stop, so Tab from
      // outside the carousel lands directly on whichever slide is
      // currently centered instead of always on the first slide in DOM
      // order regardless of selection. The rest stay reachable - arrow
      // keys move both the active slide and DOM focus together (see
      // handleKeyDown) via direct .focus() calls, which work on a
      // tabIndex={-1} element same as any other; only *Tab itself* skips
      // them.
      tabIndex={isActive ? 0 : -1}
      aria-hidden={!isVisible}
      aria-current={isActive}
      aria-label={`Show slide ${index + 1} of ${total}: ${slide.title}`}
      className={`${className} text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-blue`}
    >
      {content}
    </button>
  );
}
