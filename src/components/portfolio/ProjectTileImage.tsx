"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getMediaVariants } from "@/lib/content";

const SIZES = "(min-width: 1440px) 33vw, (min-width: 794px) 50vw, 100vw";

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
function usePrefersReducedMotion(): boolean {
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
  const reducedMotion = usePrefersReducedMotion();
  const [src] = getMediaVariants(filename);

  useEffect(() => {
    const video = ref.current;
    if (!video || reducedMotion) return;
    if (playWhenActive) {
      video.play()?.catch(() => {});
    } else {
      video.pause();
    }
  }, [playWhenActive, reducedMotion]);

  if (!src) return null;

  return (
    <video
      ref={ref}
      className={`h-full w-full object-cover [object-position:top_left] ${className}`}
      src={src.url}
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
      className={`h-full w-full object-cover transition-[object-position] motion-reduce:transition-none ${
        pan && active
          ? "duration-[3000ms] ease-linear [object-position:bottom_left]"
          : "duration-[750ms] ease-in-out [object-position:top_left]"
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
    return <div className="h-[200px] border-b border-black/20 bg-black/10" aria-hidden="true" {...wrapperProps} />;
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
  const staticClassName = `absolute inset-0 transition-opacity duration-500 ease-in motion-reduce:transition-none ${
    active && showHover ? "opacity-0" : "opacity-100"
  }`;

  return (
    <div className="relative h-[200px] overflow-hidden border-b border-black/20" {...wrapperProps}>
      {showHover &&
        (hoverFormat === "video" ? (
          <VideoLayer filename={hoverFilename} playWhenActive={active} className="absolute inset-0" />
        ) : (
          <ImageLayer
            filename={hoverFilename}
            pan={doScrollAnimation}
            active={active}
            className="absolute inset-0"
          />
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
