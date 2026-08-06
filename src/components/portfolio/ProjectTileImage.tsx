"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getMediaVariants } from "@/lib/content";

const SIZES = "(min-width: 1440px) 33vw, (min-width: 794px) 50vw, 100vw";

// Absolute-fill positioning shared by every thumbnail media layer. The
// video/image is deliberately 2px wider than its wrapper and shifted 1px
// left - overscanning past both edges, clipped back by the wrapper's
// overflow-hidden - rather than sized to exactly 100%. CSS Grid's 1fr
// tracks routinely give tiles fractional-pixel widths (e.g. 349.34375px),
// and object-fit: cover's GPU compositing rounds against that fractional
// box independently of layout, leaving a ~1px sliver of the card's white
// background visible along one edge otherwise. `max-w-none` overrides
// Tailwind Preflight's `video, img { max-width: 100% }`, which would
// otherwise silently clamp the overscan width back down to 100% - without
// it this whole fix is a no-op. (An earlier attempt at this used
// `-inset-px` on an element that also had explicit `h-full w-full` classes,
// which over-constrains the box: browsers keep the specified width and
// reposition via `left` instead of growing it, which just shifts the
// element and makes the gap worse. Setting an explicit wider `width`
// alongside the inset avoids that.)
const MEDIA_LAYER_BASE_CLASS = "absolute -inset-x-px inset-y-0 block h-full w-[calc(100%+2px)] max-w-none object-cover";

function getFormat(filename: string): "video" | "image" | "" {
  if (!filename) return "";
  return filename.toLowerCase().includes(".mp4") ? "video" : "image";
}

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

// Matches AppShell's breakpoint-tracking pattern: subscribe to the media
// query's change event via useSyncExternalStore so SSR and the first client
// render agree (both see `false`) with no hydration mismatch.
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getPrefersReducedMotion,
    getPrefersReducedMotionServerSnapshot,
  );
}

// Muted/looping background-style video layer. `playWhenActive=true` always
// autoplays (the legacy "static video" cases); a defined value instead ties
// playback to hover/touch so a paused frame 0 doubles as that layer's resting
// poster (the legacy "blank static + hover video" case).
function VideoLayer({
  filename,
  playWhenActive,
  className = "",
}: {
  filename: string;
  playWhenActive: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const [src] = getMediaVariants(filename);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.01 },
    );
    observer.observe(video);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (!isVisible || reducedMotion) {
      video.pause();
      if (!isVisible) video.load();
      return;
    }
    if (playWhenActive) {
      video.play()?.catch(() => {});
    } else {
      video.pause();
    }
  }, [isVisible, playWhenActive, reducedMotion]);

  if (!src) return null;

  return (
    <video
      ref={ref}
      className={`${MEDIA_LAYER_BASE_CLASS} object-left-top ${className}`}
      src={isVisible ? src.url : undefined}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}

// Static or hover-swap image layer. `pan` enables the legacy "blank static +
// image hover" scroll effect: a slow (3s linear) pan from the top crop down
// to the bottom crop while `active`, reverting over the image's normal 0.75s
// ease-in-out transition (a comparatively quick "snap back") once released -
// timings pulled directly from the Gridsome frontend's projectCardImage.vue.
function ImageLayer({
  filename,
  className = "",
  pan = false,
  active = false,
}: {
  filename: string;
  className?: string;
  pan?: boolean;
  active?: boolean;
}) {
  const variants = getMediaVariants(filename);
  if (variants.length === 0) return null;

  const largest = variants.reduce((a, b) => ((b.width ?? 0) > (a.width ?? 0) ? b : a));
  const srcSet = variants
    .filter((v): v is { width: number; url: string } => v.width != null)
    .map((v) => `${v.url} ${v.width}w`)
    .join(", ");

  return (
    // eslint-disable-next-line @next/next/no-img-element -- discrete pre-generated manifest widths need a manual srcset, not Next's continuous loader model
    <img
      src={largest.url}
      srcSet={srcSet || undefined}
      sizes={srcSet ? SIZES : undefined}
      alt=""
      loading="lazy"
      decoding="async"
      className={`${MEDIA_LAYER_BASE_CLASS} transition-[object-position] motion-reduce:transition-none ${
        pan && active ? "duration-[3000ms] ease-linear object-left-bottom" : "duration-[750ms] ease-in-out object-left-top"
      } ${className}`}
    />
  );
}

export default function ProjectTileImage({
  staticFilename,
  hoverFilename,
}: {
  staticFilename: string;
  hoverFilename: string;
}) {
  const [hover, setHover] = useState(false);
  const [touch, setTouch] = useState(false);
  const active = hover || touch;

  const staticFormat = getFormat(staticFilename);
  const hoverFormat = getFormat(hoverFilename);
  const showStatic = staticFormat !== "";
  const showHover = hoverFormat !== "";

  const wrapperProps = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onTouchStart: () => setTouch(true),
    onTouchMove: () => setTouch(true),
    onTouchEnd: () => setTouch(false),
    onTouchCancel: () => setTouch(false),
  };

  if (!showStatic && !showHover) {
    return (
      <div
        className="h-[200px] w-full shrink-0 border-b border-black/20 bg-black/10"
        aria-hidden="true"
        {...wrapperProps}
      />
    );
  }

  // Legacy case 8 ("blank static + image hover"): only reachable when there's
  // no static layer to swap away from, so the hover image is the resting
  // image and gets the slow pan-and-snap treatment instead of a crossfade.
  const doScrollAnimation = !showStatic && hoverFormat === "image";

  // The static slot's opacity fades to 0 on hover/touch whenever a hover
  // layer exists underneath it to reveal - true for every static format,
  // video included: a static video keeps autoplaying invisibly once faded
  // out, exactly like the Gridsome frontend's `:play-on-condition="true"`
  // on that slot being independent of its opacity toggle.
  const staticClassName = `transition-opacity duration-500 ease-in motion-reduce:transition-none ${
    active && showHover ? "opacity-0" : "opacity-100"
  }`;

  return (
    <div className="relative h-[200px] w-full shrink-0 overflow-hidden isolate border-b border-black/20" {...wrapperProps}>
      {showHover &&
        (hoverFormat === "video" ? (
          <VideoLayer filename={hoverFilename} playWhenActive={active} />
        ) : (
          <ImageLayer filename={hoverFilename} pan={doScrollAnimation} active={active} />
        ))}
      {showStatic &&
        (staticFormat === "video" ? (
          <VideoLayer filename={staticFilename} playWhenActive className={staticClassName} />
        ) : (
          <ImageLayer filename={staticFilename} className={staticClassName} />
        ))}
    </div>
  );
}
