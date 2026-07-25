"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { scaledWidth } from "./scaling";
import { useCyclingIndex } from "./useCyclingIndex";

// Ported from .aquarium-tank3 in snippetEndcapMarkAnthonySerrano2020.vue.
// Bat-ray and yellow-tang animate continuously; the other five creatures
// share one rotating "exhibit" slot, cross-fading in turn on the same
// timing as the Vue `play_nextTankExhibit` loop (index 0 shows immediately,
// then advances after eventDelay[index] seconds).
const EXHIBIT_DELAYS = [10, 33, 10, 45, 10];
const EXHIBIT_INITIAL_DELAY = 5;

const CROSSFADE = "transition-opacity duration-[3000ms] ease motion-reduce:transition-none";

// Cuttlefish and the two cephalopod variants (squid, comb-jelly) reuse a CSS
// mask technique from svgIllustration.vue: the creature's own SVG is masked
// against itself (mask-image pointing at the same file) while an animated
// gradient is painted as its background, so the gradient only shows through
// the creature's silhouette, layered over its actual artwork.
function maskedShimmerStyle(maskUrl: string, background: string, backgroundSize: string): CSSProperties {
  return {
    maskImage: `url(${maskUrl})`,
    WebkitMaskImage: `url(${maskUrl})`,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    background,
    backgroundSize,
  };
}

export default function AquariumTank3RotatingExhibit() {
  const activeExhibit = useCyclingIndex(EXHIBIT_DELAYS, EXHIBIT_INITIAL_DELAY);

  return (
    <div
      className="absolute overflow-hidden"
      style={{ bottom: "7.6vw", left: "15.6vw", width: "5.1vw", height: "4.6vw" }}
    >
      <Image
        src="/assets/bat-ray.svg"
        alt=""
        width={16}
        height={16}
        unoptimized
        className="absolute h-auto animate-bat-ray motion-reduce:animate-none"
        style={{ ...scaledWidth(33), top: "0.5vw", left: "6vw", opacity: 0.5 }}
      />

      <div
        className={`absolute ${CROSSFADE}`}
        style={{ top: "1.2vw", opacity: activeExhibit === 0 ? 0.75 : 0 }}
      >
        <Image
          src="/assets/cuttlefish-static.svg"
          alt=""
          width={24}
          height={32}
          unoptimized
          className="absolute h-auto"
          style={{ ...scaledWidth(49), top: "-0.5vw", left: "3vw" }}
        />
        <Image
          src="/assets/cuttlefish-dynamic.svg"
          alt=""
          width={24}
          height={32}
          unoptimized
          className="absolute h-auto animate-multicolor-cuttlefish motion-reduce:animate-none"
          style={{
            ...scaledWidth(49),
            top: "-0.5vw",
            left: "3vw",
            ...maskedShimmerStyle(
              "/assets/cuttlefish-dynamic.svg",
              "repeating-linear-gradient(-75deg, white 0 2px, black 2px 4px)",
              "800% 100%",
            ),
          }}
        />
      </div>

      <Image
        src="/assets/giant-pacific-octopus.svg"
        alt=""
        width={16}
        height={24}
        unoptimized
        className={`absolute h-auto animate-octopus-sink motion-reduce:animate-none ${CROSSFADE}`}
        style={{
          ...scaledWidth(33),
          top: "3vw",
          left: "5vw",
          opacity: activeExhibit === 1 ? 0.75 : 0,
        }}
      />

      <Image
        src="/assets/cephalopod.svg"
        alt=""
        width={20}
        height={20}
        unoptimized
        className={`absolute h-auto animate-multicolor-squid motion-reduce:animate-none ${CROSSFADE}`}
        style={{
          ...scaledWidth(41),
          top: "1.2vw",
          left: "3.1vw",
          opacity: activeExhibit === 2 ? 1 : 0,
          ...maskedShimmerStyle(
            "/assets/cephalopod.svg",
            "repeating-linear-gradient(-45deg, white 0 6px, #795548 6px 12px)",
            "800% 200%",
          ),
        }}
      />

      <div
        className={`absolute ${CROSSFADE}`}
        style={{ top: "1.2vw", opacity: activeExhibit === 3 ? 0.75 : 0 }}
      >
        <Image
          src="/assets/black-sea-nettle1.svg"
          alt=""
          width={50}
          height={51}
          unoptimized
          className="absolute h-auto animate-jelly-diagonal motion-reduce:animate-none"
          style={{ ...scaledWidth(51), top: "0.5vw", left: "6vw" }}
        />
        <Image
          src="/assets/black-sea-nettle2.svg"
          alt=""
          width={19}
          height={46}
          unoptimized
          className="absolute h-auto animate-jelly-upward motion-reduce:animate-none"
          style={{ ...scaledWidth(19.5), top: "0.5vw", left: "3vw" }}
        />
        <Image
          src="/assets/black-sea-nettle2.svg"
          alt=""
          width={19}
          height={46}
          unoptimized
          className="absolute h-auto animate-jelly-lazy motion-reduce:animate-none"
          style={{ ...scaledWidth(19.5), top: "0.5vw", left: "3.5vw", opacity: 0.5, transform: "scaleX(-1)" }}
        />
      </div>

      <Image
        src="/assets/cephalopod.svg"
        alt=""
        width={20}
        height={20}
        unoptimized
        className={`absolute h-auto animate-multicolor-comb-jelly motion-reduce:animate-none ${CROSSFADE}`}
        style={{
          ...scaledWidth(41),
          top: "1.2vw",
          left: "3.1vw",
          opacity: activeExhibit === 4 ? 1 : 0,
          ...maskedShimmerStyle(
            "/assets/cephalopod.svg",
            "linear-gradient(124deg, #ff2400, #e81d1d, #e8b71d, #e3e81d, #1de840, #1ddde8, #2b1de8, #dd00f3, #dd00f3)",
            "800% 800%",
          ),
        }}
      />

      <Image
        src="/assets/yellow-tang.svg"
        alt=""
        width={25}
        height={19}
        unoptimized
        className="absolute h-auto animate-yellow-tang motion-reduce:animate-none"
        style={{ ...scaledWidth(25.5), top: "0.6vw", left: "-2vw", opacity: 0.8 }}
      />
    </div>
  );
}
