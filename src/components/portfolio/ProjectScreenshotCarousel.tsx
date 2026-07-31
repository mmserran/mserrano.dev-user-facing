"use client";

import { useEffect, useRef, useState } from "react";
import BrowserDeviceFrame from "./BrowserDeviceFrame";
import { usePrefersReducedMotion } from "./ProjectTileImage";

// Matches the carousel-fade-in/out keyframes' duration in globals.css - 300ms,
// copied from the live site's actual Vuetify fade-transition duration rather
// than guessed.
const FADE_MS = 300;

// The live site doesn't crossfade the outgoing and incoming slides
// concurrently - it fades the outgoing slide out completely, holds on a
// blank frame briefly, then fades the incoming slide in (Vue's out-in
// transition mode, not a simultaneous dissolve). This duration wasn't
// independently measurable off the live site the way FADE_MS was, so it's a
// reasonable approximation rather than a confirmed figure.
const PAUSE_MS = 200;

// Schedules the advance-to-next-slide timer before the active screenshot
// has loaded and reported its actual (height-scaled) pan duration - matches
// BrowserDeviceFrame's own pre-measurement fallback, so a slow-loading
// image still advances at a reasonable pace instead of stalling. Overridden
// by the real duration as soon as BrowserDeviceFrame reports it, via
// handlePanDuration below.
const FALLBACK_SLIDE_SECONDS = 4;

type Phase = "fade-out" | "pause" | "fade-in" | "idle";

function browserForIndex(supportedBrowsers: string[], index: number): string {
  return supportedBrowsers[index % supportedBrowsers.length];
}

// Ported from snippetCarouselBrowser.vue: cycles through a project's desktop
// screenshots, wrapping each one in an SVG browser frame that alternates
// through general.supported_browsers by index (get_browser()), sequencing
// slide changes the way the live site's Vuetify fade-transition did: fade
// the outgoing slide out, pause on blank, then fade the incoming slide in.
// Unlike a fixed per-slide interval, the wait before advancing is driven by
// each screenshot's own measured pan duration (BrowserDeviceFrame.tsx), so
// a tall screenshot gets proportionally longer on screen instead of having
// its pan cut short.
export default function ProjectScreenshotCarousel({
  screenshots,
  supportedBrowsers,
}: {
  screenshots: string[];
  supportedBrowsers: string[];
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [display, setDisplay] = useState<{ index: number; phase: Phase }>({ index: 0, phase: "idle" });

  const currentIndexRef = useRef(0);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Whether the current slide has reported its real pan duration yet - once
  // it has, the fallback timer must not clobber that real schedule.
  const measuredCurrentRef = useRef(false);

  function armFallbackAdvance() {
    if (measuredCurrentRef.current) return;
    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    advanceTimeoutRef.current = setTimeout(beginTransitionToNext, FALLBACK_SLIDE_SECONDS * 1000);
  }

  function handlePanDuration(seconds: number) {
    measuredCurrentRef.current = true;
    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    advanceTimeoutRef.current = setTimeout(beginTransitionToNext, seconds * 1000);
  }

  function beginTransitionToNext() {
    if (screenshots.length <= 1) return;
    const nextIndex = (currentIndexRef.current + 1) % screenshots.length;

    setDisplay((prev) => ({ index: prev.index, phase: "fade-out" }));
    const t1 = setTimeout(() => {
      setDisplay((prev) => ({ index: prev.index, phase: "pause" }));
      const t2 = setTimeout(() => {
        currentIndexRef.current = nextIndex;
        measuredCurrentRef.current = false;
        setDisplay({ index: nextIndex, phase: "fade-in" });
        armFallbackAdvance();
        const t3 = setTimeout(() => {
          setDisplay((prev) => ({ index: prev.index, phase: "idle" }));
        }, FADE_MS);
        phaseTimeoutsRef.current.push(t3);
      }, PAUSE_MS);
      phaseTimeoutsRef.current.push(t2);
    }, FADE_MS);
    phaseTimeoutsRef.current.push(t1);
  }

  useEffect(() => {
    if (reducedMotion || screenshots.length <= 1) return;
    armFallbackAdvance();
    return () => {
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
      for (const id of phaseTimeoutsRef.current) clearTimeout(id);
      phaseTimeoutsRef.current = [];
    };
    // armFallbackAdvance/beginTransitionToNext close over component state
    // via refs, not props, so they don't need to be dependencies here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, screenshots.length]);

  if (screenshots.length === 0) {
    return null;
  }

  const isOutgoing = display.phase === "fade-out";

  return (
    <div className="relative aspect-[644/460] w-full">
      {display.phase !== "pause" && (
        <div
          className={
            display.phase === "fade-out" || display.phase === "fade-in"
              ? `animate-carousel-${display.phase} motion-reduce:hidden`
              : ""
          }
        >
          <BrowserDeviceFrame
            filename={screenshots[display.index]}
            browser={browserForIndex(supportedBrowsers, display.index)}
            animate={!isOutgoing && !reducedMotion}
            restPosition={isOutgoing ? "bottom" : "top"}
            onPanDuration={!isOutgoing ? handlePanDuration : undefined}
          />
        </div>
      )}
    </div>
  );
}
