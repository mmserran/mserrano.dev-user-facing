import Image from "next/image";
import { useState, type CSSProperties, type SyntheticEvent } from "react";
import { getMediaVariants } from "@/lib/content";

const SIZES = "(min-width: 1024px) 25vw, 50vw";

export type MobileDeviceKey =
  | "mobile-iphone4"
  | "mobile-iphone4--white"
  | "mobile-iphone6s"
  | "mobile-iphone6s--white"
  | "mobile-iphoneXs"
  | "mobile-iphoneXs--roseGold"
  | "mobile-galaxyNote3"
  | "mobile-galaxyNote9--blue"
  | "mobile-galaxyNote9--purple";

// Cutout geometry ported from decorDeviceFrame.vue's SCSS (the
// .mobile-iphone4/.mobile-iphone6s/etc. rules): each device frame SVG has a
// differently-shaped window for the screenshot underneath, expressed here as
// fractions of the frame's own box. aspectRatio (height/width) comes from
// each SVG's own viewBox, since - unlike the shared browser-*.svg frames -
// every mobile device frame has a different intrinsic shape.
const DEVICE_FRAMES: Record<
  MobileDeviceKey,
  {
    aspectRatio: number;
    // Cap from decorDeviceFrame.vue's per-device max-width (e.g. 350px * 0.5
    // for iphone4). Cells are 240px wide; without this every frame stretches
    // to full cell width and the mosaic denser/larger than the live site.
    maxWidthPx: number;
    cutout: { top: number; left: number; width: number; height: number };
  }
> = {
  "mobile-iphone4": {
    aspectRatio: 337.18 / 174.36,
    maxWidthPx: 175,
    cutout: { top: 0.1675, left: 0.075, width: 0.85, height: 0.665 },
  },
  "mobile-iphone4--white": {
    aspectRatio: 337.18 / 174.35,
    maxWidthPx: 175,
    cutout: { top: 0.1675, left: 0.075, width: 0.85, height: 0.665 },
  },
  "mobile-iphone6s": {
    aspectRatio: 396.96 / 193.13,
    maxWidthPx: 193.5,
    cutout: { top: 0.125, left: 0.063, width: 0.88, height: 0.75 },
  },
  "mobile-iphone6s--white": {
    aspectRatio: 396.96 / 193.13,
    maxWidthPx: 193.5,
    cutout: { top: 0.125, left: 0.063, width: 0.88, height: 0.75 },
  },
  "mobile-iphoneXs": {
    aspectRatio: 425.35 / 213.38,
    maxWidthPx: 213.5,
    cutout: { top: 0.03, left: 0.063, width: 0.88, height: 0.94 },
  },
  "mobile-iphoneXs--roseGold": {
    aspectRatio: 425.35 / 213.38,
    maxWidthPx: 213.5,
    cutout: { top: 0.03, left: 0.063, width: 0.88, height: 0.94 },
  },
  "mobile-galaxyNote3": {
    aspectRatio: 442.98 / 233.08,
    maxWidthPx: 234,
    cutout: { top: 0.08, left: 0.053, width: 0.895, height: 0.84 },
  },
  "mobile-galaxyNote9--blue": {
    aspectRatio: 466.54 / 219.33,
    maxWidthPx: 219.5,
    cutout: { top: 0.05, left: 0.03, width: 0.944, height: 0.91 },
  },
  "mobile-galaxyNote9--purple": {
    aspectRatio: 466.54 / 219.33,
    maxWidthPx: 219.5,
    cutout: { top: 0.05, left: 0.03, width: 0.944, height: 0.91 },
  },
};

export const MOBILE_DEVICE_POOL = Object.keys(DEVICE_FRAMES) as MobileDeviceKey[];

// The three named pan curves from decorDeviceFrame.vue: each pans the
// screenshot's object-position through a fixed curve once (see the
// mosaic-*-scroll keyframes in globals.css), timed to the screenshot's own
// natural height, then holds at its final position. staticEnd is that final
// position, used as a static (non-animated) crop under reduced motion.
const NAMED_PANS = {
  slowScrollFromTop: { animationClass: "animate-mosaic-slow-scroll-from-top", staticEnd: "50%" },
  footerScrollUp: { animationClass: "animate-mosaic-footer-scroll-up", staticEnd: "70%" },
  midScroll: { animationClass: "animate-mosaic-mid-scroll", staticEnd: "100%" },
} as const;

// Recalibrated the same way BrowserDeviceFrame.tsx was: decorDeviceFrame.vue's
// original formula (floor 4s, 0.5s per 1000 raw px) was calibrated against
// full-resolution captures, but this manifest's screenshots cap far lower -
// reusing BrowserDeviceFrame's own recalibrated slope keeps pan speed
// consistent between the two device-frame components.
const DEFAULT_REFERENCE_WIDTH = 1600;
const MIN_PAN_SECONDS = 4;
const PAN_SECONDS_PER_1000PX = 1.5;

export default function MobileDeviceFrame({
  filename,
  device,
  offset,
  reducedMotion,
}: {
  filename: string;
  device: MobileDeviceKey;
  // Either a CSS percentage ("0%", "66%", ...) for a static crop, or one of
  // the three named pan curves above.
  offset: string;
  reducedMotion: boolean;
}) {
  const [panSeconds, setPanSeconds] = useState<number | null>(null);

  const variants = getMediaVariants(filename);
  if (variants.length === 0) return null;

  const frame = DEVICE_FRAMES[device];
  const namedPan = (NAMED_PANS as Record<string, (typeof NAMED_PANS)[keyof typeof NAMED_PANS]>)[offset];

  const largest = variants.reduce((a, b) => ((b.width ?? 0) > (a.width ?? 0) ? b : a));
  const srcSet = variants
    .filter((v): v is { width: number; url: string } => v.width != null)
    .map((v) => `${v.url} ${v.width}w`)
    .join(", ");

  function handleLoad(event: SyntheticEvent<HTMLImageElement>) {
    if (!namedPan || reducedMotion) return;
    const img = event.currentTarget;
    if (!img.naturalWidth || !img.naturalHeight) return;

    const aspectRatio = img.naturalHeight / img.naturalWidth;
    const referenceWidth = largest.width ?? DEFAULT_REFERENCE_WIDTH;
    const effectiveHeight = aspectRatio * referenceWidth;
    setPanSeconds(Math.max(MIN_PAN_SECONDS, (effectiveHeight / 1000) * PAN_SECONDS_PER_1000PX));
  }

  const style: CSSProperties = {};
  let objectPositionClass = "";
  if (namedPan) {
    if (reducedMotion) {
      style.objectPosition = `0 ${namedPan.staticEnd}`;
    } else {
      objectPositionClass = `${namedPan.animationClass} motion-reduce:animate-none`;
      if (panSeconds !== null) {
        style.animationDuration = `${panSeconds}s`;
      }
    }
  } else {
    style.objectPosition = `0 ${offset}`;
  }

  return (
    <div
      className="relative w-full"
      style={{ aspectRatio: `1 / ${frame.aspectRatio}`, maxWidth: frame.maxWidthPx }}
    >
      <div
        className="absolute overflow-hidden"
        style={{
          top: `${frame.cutout.top * 100}%`,
          left: `${frame.cutout.left * 100}%`,
          width: `${frame.cutout.width * 100}%`,
          height: `${frame.cutout.height * 100}%`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- discrete manifest widths need a manual srcset */}
        <img
          src={largest.url}
          srcSet={srcSet || undefined}
          sizes={srcSet ? SIZES : undefined}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          style={style}
          className={`h-full w-full object-cover ${objectPositionClass}`}
        />
      </div>
      <Image
        src={`/assets/${device}.svg`}
        alt=""
        fill
        unoptimized
        className="pointer-events-none absolute inset-0 z-10 object-contain"
      />
    </div>
  );
}
