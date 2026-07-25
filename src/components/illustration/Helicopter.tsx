"use client";

import { useEffect, useRef } from "react";
import lottie from "lottie-web/build/player/lottie_light";
import { scaledWidth } from "./scaling";

// Ported from the `helicopter-scw` piece of
// snippetEndcapMarkAnthonySerrano2020.vue's mounted() hook: the same Lottie
// file, played the same way, so the rotor flip-book animation matches the
// live site exactly rather than being hand-approximated in CSS.
export default function Helicopter() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const animation = lottie.loadAnimation({
      container,
      renderer: "svg",
      loop: !prefersReducedMotion,
      autoplay: !prefersReducedMotion,
      path: "/assets/helicopter-scw.json",
    });

    return () => animation.destroy();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute top-[12.5%] right-[15%] z-[5]"
      style={scaledWidth(125)}
    />
  );
}
