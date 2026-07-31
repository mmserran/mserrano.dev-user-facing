"use client";

import { useMemo } from "react";
import { useCyclingIndex } from "../illustration/useCyclingIndex";
import BrowserDeviceFrame from "./BrowserDeviceFrame";
import { usePrefersReducedMotion } from "./ProjectTileImage";

// Matches the pan keyframe's duration in globals.css - each slide holds long
// enough for the screenshot to finish panning top to bottom before the
// carousel swaps to the next screenshot and browser skin.
const SLIDE_SECONDS = 6;

// Ported from snippetCarouselBrowser.vue: cycles through a project's desktop
// screenshots, wrapping each one in an SVG browser frame that alternates
// through general.supported_browsers by index (get_browser()).
export default function ProjectScreenshotCarousel({
  screenshots,
  supportedBrowsers,
}: {
  screenshots: string[];
  supportedBrowsers: string[];
}) {
  const reducedMotion = usePrefersReducedMotion();
  // useCyclingIndex's effect keys off this array by reference, so it has to
  // stay stable across re-renders (a fresh `.map()` result every render
  // would restart the schedule from index 0 each time the index advances).
  const delays = useMemo(
    () => Array<number>(Math.max(screenshots.length, 1)).fill(SLIDE_SECONDS),
    [screenshots.length],
  );
  const cycledIndex = useCyclingIndex(delays, SLIDE_SECONDS);

  if (screenshots.length === 0) {
    return null;
  }

  const activeIndex = reducedMotion ? 0 : cycledIndex;
  const browser = supportedBrowsers[activeIndex % supportedBrowsers.length];

  return (
    <div className="w-full">
      <BrowserDeviceFrame
        key={activeIndex}
        filename={screenshots[activeIndex]}
        browser={browser}
        animate={!reducedMotion}
      />
    </div>
  );
}
