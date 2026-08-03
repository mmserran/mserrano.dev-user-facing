"use client";

import { useEffect, useRef } from "react";
import { getMediaVariants, type ImageTextMedia } from "@/lib/content";
import usePlyrPlayer from "./usePlyrPlayer";

const VIEWPORT_PLAY_THRESHOLD = 0.5;

// Ports baseVideo.vue: always muted (autoplay only works unmuted-blocked
// otherwise) and never looping - pbImageText.vue hardcodes `:loop="false"`
// regardless of the item's own data. `usePlayer` mirrors baseVideo.vue's own
// conditional: only then does it initialize Plyr for a consistent,
// cross-browser control skin (blue accents, settings/PIP/fullscreen) - a
// video without it renders with no native `controls` attribute either.
//
// Deliberate deviation from the Vue source: baseVideo.vue plays a clip
// immediately on mount whenever `front_is_autoplay` is set, regardless of
// whether it's actually on screen yet. Per explicit request, every video
// here instead plays through once as soon as it scrolls into view (an
// IntersectionObserver triggers a single `.play()`, then disconnects) -
// this also gives the clips that were previously silently frozen on their
// first frame (usePlayer and autoplay both false, e.g. "Form Validation") a
// way to actually play. Still muted/non-looping either way; a Plyr-enhanced
// clip's own controls remain available to pause/replay/seek afterward.
export default function ImageTextVideo({ media }: { media: ImageTextMedia }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  usePlyrPlayer(videoRef, media.usePlayer);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        video.play()?.catch(() => {});
        observer.disconnect();
      },
      { threshold: VIEWPORT_PLAY_THRESHOLD },
    );
    observer.observe(video);

    return () => observer.disconnect();
  }, []);

  const [src] = getMediaVariants(media.filename);
  if (!src) return null;

  return (
    <video
      ref={videoRef}
      className="mx-auto h-auto max-h-[450px] w-full object-cover"
      muted
      loop={false}
      playsInline
      preload="metadata"
    >
      <source src={src.url} />
    </video>
  );
}
