"use client";

import { useEffect, useRef, useState } from "react";
import { getMediaVariants } from "@/lib/content";

const SIZES = "(min-width: 1024px) 50vw, 100vw";
// Same 644x460-viewBox cutout geometry every browser-*.svg frame shares
// (BrowserDeviceFrame.tsx documents the derivation in detail for the header
// carousel) - inlined here rather than imported since this frame only ever
// renders the "chrome" skin, matching pbImageText.vue's hardcoded
// `get_device()` (always "browser-chrome", never derived from the project's
// supported_browsers list the way the header carousel's frame is).
const CUTOUT_STYLE = { top: "21.75%", left: "0.5%", width: "99%", height: "77.75%" };

// Ports decorDeviceFrame.vue's `offset="onhover"` mode: on hover, the
// screenshot pans from its top crop to its bottom crop over a slow 4s ease
// (cubic-bezier(0.7,0.5,1,1)). Deliberately CSS-only (a plain group-hover
// object-position transition) rather than BrowserDeviceFrame.tsx's
// JS-measured, content-height-aware pan duration - that machinery exists to
// keep a *continuous, autoplaying* pan proportional to screenshot height;
// this pan is fixed-duration and hover-triggered, a genuinely different
// interaction the live site itself only wires up via
// mouseover/mouseleave (no keyboard-focus equivalent).
//
// Deliberate deviation from the Vue source on release: decorDeviceFrame.vue
// reverts over that same slow 4s transition, but ProjectTileImage.tsx's
// catalog-tile hover pan (3s linear in, 0.75s ease-in-out snap back on
// release) reads better and is already an established pattern in this
// codebase, so this pan borrows that same asymmetry - slow pan in, quicker
// snap back out - just scaled to this pan's own slower pace rather than
// copying the tile's exact numbers. Achieved in pure CSS: the resting
// (non-hover) rule's own transition-duration/timing-function apply to the
// mouseleave transition, the group-hover rule's apply to the mouseover one -
// no JS hover-tracking needed.
export default function ImageTextDeviceFrame({ filename }: { filename: string }) {
  const [loaded, setLoaded] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const screenshotRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef<HTMLImageElement>(null);

  // Both images are plain <img> elements (not next/image, which checks this
  // internally on mount) - SSR'd markup can finish loading before React
  // hydrates and attaches these onLoad listeners, which would otherwise miss
  // that load event and strand the spinner/invisible cutout forever. Matches
  // BrowserDeviceFrame.tsx's own catch-up effect for its screenshot image.
  useEffect(() => {
    if (screenshotRef.current?.complete) setLoaded(true);
    if (frameRef.current?.complete) setFrameLoaded(true);
  }, [filename]);

  const variants = getMediaVariants(filename);
  if (variants.length === 0) return null;

  const largest = variants.reduce((a, b) => ((b.width ?? 0) > (a.width ?? 0) ? b : a));
  const srcSet = variants
    .filter((v): v is { width: number; url: string } => v.width != null)
    .map((v) => `${v.url} ${v.width}w`)
    .join(", ");

  return (
    <div className="group relative aspect-[644/460] w-full">
      <div
        className={`absolute overflow-hidden rounded-b-[4px] bg-white ${frameLoaded ? "" : "invisible"}`}
        style={CUTOUT_STYLE}
      >
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-400/50 border-t-brand-blue motion-reduce:animate-none" />
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element -- discrete pre-generated manifest widths need a manual srcset, not Next's continuous loader model */}
        <img
          ref={screenshotRef}
          src={largest.url}
          srcSet={srcSet || undefined}
          sizes={srcSet ? SIZES : undefined}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className="relative h-full w-full object-cover object-top transition-[object-position] duration-[1200ms] ease-in-out group-hover:duration-[4000ms] group-hover:ease-[cubic-bezier(0.7,0.5,1,1)] group-hover:object-bottom motion-reduce:transition-none"
        />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- static chrome skin, but next/image's fill layout would fight the sibling cutout's own absolute positioning here */}
      <img
        ref={frameRef}
        src="/assets/browser-chrome.svg"
        alt=""
        onLoad={() => setFrameLoaded(true)}
        className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
      />
    </div>
  );
}
