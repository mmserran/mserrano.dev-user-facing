"use client";

import { useEffect, useRef } from "react";
import { MediaPlayer, MediaProvider, type MediaPlayerInstance } from "@vidstack/react";
import { DefaultVideoLayout, defaultLayoutIcons } from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

// Isolated from VideoPlayer.tsx so this file - and the Vidstack bundle/CSS it
// pulls in - only loads via VideoPlayer's next/dynamic(ssr:false) import, for
// a video that actually has `use_player` set. --video-brand is Vidstack's own
// customization hook into its internal --media-brand token (see
// player/styles/default/layouts/video.css), carrying over the brand-blue
// accent baseVideo.vue's Plyr skin used.
//
// Reports its MediaPlayerInstance up via onPlayerChange rather than a
// forwarded ref: next/dynamic's Loadable wrapper claims the `ref` prop for
// its own retry() handle and never forwards it to the lazily-loaded
// component (confirmed against the installed Next.js version), so a plain
// ref would silently never reach this component's caller.
export type EnhancedVideoPlayerProps = {
  src: string;
  poster?: string;
  muted?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  className?: string;
  title?: string;
  onPlayerChange?: (player: MediaPlayerInstance | null) => void;
};

export default function EnhancedVideoPlayer({
  src,
  poster,
  muted,
  loop,
  autoPlay,
  className,
  title,
  onPlayerChange,
}: EnhancedVideoPlayerProps) {
  const playerRef = useRef<MediaPlayerInstance>(null);

  useEffect(() => {
    onPlayerChange?.(playerRef.current);
    return () => onPlayerChange?.(null);
  }, [onPlayerChange]);

  return (
    <MediaPlayer
      ref={playerRef}
      className={className}
      title={title}
      src={src}
      poster={poster}
      muted={muted}
      loop={loop}
      autoPlay={autoPlay}
      playsInline
      preload="metadata"
      style={{ "--video-brand": "var(--color-brand-blue)" }}
    >
      <MediaProvider />
      <DefaultVideoLayout icons={defaultLayoutIcons} />
    </MediaPlayer>
  );
}
