import Image from "next/image";
import { getMediaVariants } from "@/lib/content";

const SIZES = "(min-width: 1024px) 50vw, 100vw";

// Percentage cutout shared by every browser-*.svg frame in decorDeviceFrame.vue
// (their viewBoxes all share the same 644x460 proportions, give or take a
// couple of px on the ie8 frame): the screenshot fills the chrome's content
// area beneath the toolbar, not the full frame.
const CUTOUT_STYLE = { top: "21.75%", left: "0.5%", width: "99%", height: "77.75%" };

export default function BrowserDeviceFrame({
  filename,
  browser,
  animate,
}: {
  filename: string;
  browser: string;
  animate: boolean;
}) {
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

  return (
    <div className="relative aspect-[644/460] w-full">
      <div className={`absolute overflow-hidden ${roundedBottom ? "rounded-b-[4px]" : ""}`} style={CUTOUT_STYLE}>
        {/* eslint-disable-next-line @next/next/no-img-element -- discrete manifest widths need a manual srcset */}
        <img
          src={largest.url}
          srcSet={srcSet || undefined}
          sizes={srcSet ? SIZES : undefined}
          alt=""
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-cover object-left-top ${
            animate ? "animate-project-screenshot-pan motion-reduce:animate-none" : ""
          }`}
        />
      </div>
      <Image
        src={`/assets/browser-${browser}.svg`}
        alt=""
        fill
        unoptimized
        className="pointer-events-none absolute inset-0 z-10 object-contain"
      />
    </div>
  );
}
