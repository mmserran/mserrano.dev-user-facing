import Image from "next/image";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { getMediaVariants } from "@/lib/content";

const SIZES = "(min-width: 1024px) 50vw, 100vw";

// Percentage cutout shared by every browser-*.svg frame in decorDeviceFrame.vue
// (their viewBoxes all share the same 644x460 proportions, give or take a
// couple of px on the ie8 frame): the screenshot fills the chrome's content
// area beneath the toolbar, not the full frame.
const FRAME_ASPECT_RATIO = 460 / 644; // browser-*.svg viewBox height/width
const CUTOUT_TOP_FRACTION = 0.2175;
const CUTOUT_LEFT_FRACTION = 0.005;
const CUTOUT_WIDTH_FRACTION = 0.99;
const CUTOUT_HEIGHT_FRACTION = 0.7775;
const CUTOUT_STYLE = {
  top: `${CUTOUT_TOP_FRACTION * 100}%`,
  left: `${CUTOUT_LEFT_FRACTION * 100}%`,
  width: `${CUTOUT_WIDTH_FRACTION * 100}%`,
  height: `${CUTOUT_HEIGHT_FRACTION * 100}%`,
};
// The cutout's own height/width ratio - how tall (relative to width) a
// screenshot needs to be before object-fit: cover has any vertical overflow
// to pan through at all.
const CUTOUT_ASPECT_RATIO = (FRAME_ASPECT_RATIO * CUTOUT_HEIGHT_FRACTION) / CUTOUT_WIDTH_FRACTION;

// A fixed pan duration makes a tall page capture whip through at a much
// higher effective scroll speed than a short one, since both cover the same
// on-screen distance in the same time. Scaling the duration with the
// screenshot's height keeps the scroll speed roughly constant instead, with
// a floor so short screenshots don't scroll by too quickly either.
//
// decorDeviceFrame.vue's original formula (floor 4s, 0.5s per 1000 raw px)
// was calibrated against un-resized, full-resolution captures - roughly
// 6.47x wider than this manifest's 1600px-capped variants (measured across
// several screenshots on the live site: raw capture width consistently
// lands around 10.35-10.4k px against a 1600px manifest cap). Naively
// applying 0.5s/1000px to the manifest's proportionally smaller heights
// left every real screenshot floored at the same flat 4s, so an earlier
// pass here just picked 1.5s per 1000 effective px - a guess that turned
// out visibly faster than the live site. Measuring live pan durations
// (each frame's data-duration attribute) against the same screenshots'
// manifest heights gives the actual live-matching rate: 0.5 * ~6.47 =
// 3.24s per 1000 effective px. At that rate the tallest real screenshot
// lands around 24s, typical ones still floor near 4s.
const DEFAULT_REFERENCE_WIDTH = 1600; // fallback if a screenshot's largest manifest variant has no declared width
const MIN_PAN_SECONDS = 4;
const PAN_SECONDS_PER_1000PX = 3.24;

// Below this fraction of overflow, object-fit: cover crops so little
// vertically that panning through it barely moves - stretched over the
// pan's multi-second duration, that reads as a distractingly slow crawl
// rather than no motion at all, so it's better to just not animate.
// Empirically: real screenshots in this portfolio cluster either under ~3%
// overflow or over ~18%, with nothing in between, so 15% cleanly separates
// "nothing worth scrolling" from "genuinely tall."
const MIN_OVERFLOW_FRACTION = 0.15;

export default function BrowserDeviceFrame({
  filename,
  browser,
  animate,
  restPosition = "top",
  onPanDuration,
}: {
  filename: string;
  browser: string;
  animate: boolean;
  // Where a non-animating frame's screenshot rests. Defaults to "top" (the
  // pan's starting crop); the carousel's outgoing slide passes "bottom" so
  // it freezes at the pan's ending crop instead of snapping back to the top
  // while it fades out.
  restPosition?: "top" | "bottom";
  // Reports the computed pan duration once the screenshot loads, so a
  // parent carousel can wait for the actual pan to finish (rather than a
  // fixed interval) before advancing to the next slide. Fires with
  // MIN_PAN_SECONDS (not a computed pan duration) when the screenshot isn't
  // tall enough to be worth scrolling at all.
  onPanDuration?: (seconds: number) => void;
}) {
  const [panSeconds, setPanSeconds] = useState<number | null>(null);
  const [scrollEligible, setScrollEligible] = useState(true);
  // Screenshots routinely load slower than the frame chrome around them -
  // this backs the neutral placeholder + spinner shown in the cutout until
  // the current src actually paints, rather than leaving it empty.
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  // Whether the SVG frame chrome itself has loaded. The cutout (placeholder
  // and screenshot alike) stays invisible until this flips true, so a
  // slow-loading frame never leaves the grey placeholder floating on its
  // own with no chrome around it - they always appear together.
  const [frameLoaded, setFrameLoaded] = useState(false);

  // filename/browser change on every carousel slide (same component
  // instance, new screenshot src and/or frame src) - reset during render,
  // React's documented pattern for state that depends on a prop, so the
  // placeholder reappears for the next slide's own loads instead of
  // carrying over the previous slide's.
  const [trackedKey, setTrackedKey] = useState(`${filename}|${browser}`);
  const key = `${filename}|${browser}`;
  if (key !== trackedKey) {
    setTrackedKey(key);
    setLoaded(false);
    setFrameLoaded(false);
  }

  // Catches images the browser already finished decoding (SSR'd markup can
  // complete loading before React hydrates and attaches the onLoad listener
  // below, which would otherwise miss that load event and strand the
  // spinner forever).
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) {
      handleLoad({ currentTarget: img } as SyntheticEvent<HTMLImageElement>);
    }
    // handleLoad closes over this render's props/filename; it only needs to
    // re-run this catch-up check when the src itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const variants = getMediaVariants(filename);
  if (variants.length === 0) return null;

  const largest = variants.reduce((a, b) => ((b.width ?? 0) > (a.width ?? 0) ? b : a));
  const srcSet = variants
    .filter((v): v is { width: number; url: string } => v.width != null)
    .map((v) => `${v.url} ${v.width}w`)
    .join(", ");

  // ie8's chrome has square corners; the other three frames round the
  // content area's bottom corners to match their rounded frame body.
  const roundedBottom = browser !== "ie8";

  function handleLoad(event: SyntheticEvent<HTMLImageElement>) {
    setLoaded(true);
    if (!animate) return;

    const img = event.currentTarget;
    if (!img.naturalWidth || !img.naturalHeight) return;

    const aspectRatio = img.naturalHeight / img.naturalWidth;
    const overflowFraction = aspectRatio / CUTOUT_ASPECT_RATIO - 1;

    if (overflowFraction < MIN_OVERFLOW_FRACTION) {
      setScrollEligible(false);
      onPanDuration?.(MIN_PAN_SECONDS);
      return;
    }

    // Natural dimensions reflect whichever responsive srcset candidate the
    // browser actually loaded, so normalize by aspect ratio against the
    // manifest's own reference width - the computed duration then stays
    // consistent regardless of which width variant loaded.
    const referenceWidth = largest.width ?? DEFAULT_REFERENCE_WIDTH;
    const effectiveHeight = aspectRatio * referenceWidth;
    const seconds = Math.max(MIN_PAN_SECONDS, (effectiveHeight / 1000) * PAN_SECONDS_PER_1000PX);
    setScrollEligible(true);
    setPanSeconds(seconds);
    onPanDuration?.(seconds);
  }

  const shouldPan = animate && scrollEligible;

  return (
    <div className="relative aspect-[644/460] w-full">
      <div
        className={`absolute overflow-hidden bg-white ${roundedBottom ? "rounded-b-[4px]" : ""} ${
          frameLoaded ? "" : "invisible"
        }`}
        style={CUTOUT_STYLE}
      >
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-400/50 border-t-brand-blue motion-reduce:animate-none" />
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element -- discrete manifest widths need a manual srcset */}
        <img
          // Positioned elements always paint above non-positioned in-flow
          // content, regardless of DOM order - without `relative` here the
          // spinner (position: absolute) would stack above this img even
          // after it decodes, so a load that paints a frame or two before
          // React's onLoad-triggered re-render removes the spinner would
          // flash the spinner over the already-visible screenshot.
          ref={imgRef}
          src={largest.url}
          srcSet={srcSet || undefined}
          sizes={srcSet ? SIZES : undefined}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          style={shouldPan && panSeconds !== null ? { animationDuration: `${panSeconds}s` } : undefined}
          className={`relative h-full w-full object-cover ${
            shouldPan
              ? "object-left-top animate-project-screenshot-pan motion-reduce:animate-none motion-reduce:object-left-top"
              : restPosition === "bottom" && scrollEligible
                ? "object-left-bottom"
                : "object-left-top"
          }`}
        />
      </div>
      <Image
        src={`/assets/browser-${browser}.svg`}
        alt=""
        fill
        unoptimized
        onLoad={() => setFrameLoaded(true)}
        className="pointer-events-none absolute inset-0 z-10 object-contain"
      />
    </div>
  );
}
