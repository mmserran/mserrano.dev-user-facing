"use client";

import { useEffect, useRef } from "react";
import { getMediaVariants, getVideoPosterUrl, type ImageTextMedia } from "@/lib/content";
import VideoPlayer, { type VideoPlayerHandle } from "./VideoPlayer";

const VIEWPORT_PLAY_THRESHOLD = 0.5;

// Ports baseVideo.vue: always muted (autoplay only works unmuted-blocked
// otherwise) and never looping - pbImageText.vue hardcodes `:loop="false"`
// regardless of the item's own data. `usePlayer` mirrors baseVideo.vue's own
// conditional: only then does it initialize the enhanced player for a
// consistent, cross-browser control skin (blue accents,
// settings/PIP/fullscreen) - a video without it renders with no native
// `controls` attribute either.
//
// Deliberate deviation from the Vue source: baseVideo.vue plays a clip
// immediately on mount whenever `front_is_autoplay` is set, regardless of
// whether it's actually on screen yet. Per explicit request, every video
// here instead plays through once as soon as it scrolls into view (an
// IntersectionObserver triggers a single `.play()`, then disconnects) -
// this also gives the clips that were previously silently frozen on their
// first frame (usePlayer and autoplay both false, e.g. "Form Validation") a
// way to actually play. Still muted/non-looping either way; an
// enhanced-player clip's own controls remain available to pause/replay/seek
// afterward. Poster uses the backend same-stem .jpg companion via
// getVideoPosterUrl.
export default function ImageTextVideo({ media }: { media: ImageTextMedia }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<VideoPlayerHandle>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        Promise.resolve(playerRef.current?.play()).catch(() => {});
        observer.disconnect();
      },
      { threshold: VIEWPORT_PLAY_THRESHOLD },
    );
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const [src] = getMediaVariants(media.filename);
  if (!src) return null;

  const poster = getVideoPosterUrl(media.filename);

  return (
    <div ref={containerRef}>
      <VideoPlayer
        ref={playerRef}
        src={src.url}
        poster={poster}
        usePlayer={media.usePlayer}
        muted
        loop={false}
        className="mx-auto h-auto max-h-[450px] w-full object-cover"
      />
    </div>
  );
}
