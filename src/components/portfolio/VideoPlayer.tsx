"use client";

import dynamic from "next/dynamic";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import type { MediaPlayerInstance } from "@vidstack/react";

const EnhancedVideoPlayer = dynamic(() => import("./EnhancedVideoPlayer"), { ssr: false });

// Shared by every ported video (ImageTextVideo, Featured): both baseVideo.vue
// call sites gate the same enhanced-player behavior behind a `use_player` CMS
// flag - a consistent, cross-browser control skin (blue accents,
// settings/PIP/fullscreen) versus a bare `<video>` with no native `controls`
// attribute either, exactly mirroring baseVideo.vue. Dynamically imports
// EnhancedVideoPlayer (and the Vidstack bundle/CSS it pulls in) so that only
// loads for a project that actually has a player-enabled video.
export interface VideoPlayerHandle {
  play(): Promise<void> | void;
}

type VideoPlayerProps = {
  src: string;
  poster?: string;
  muted?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  usePlayer: boolean;
  className?: string;
  title?: string;
};

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(function VideoPlayer(
  { usePlayer, src, poster, muted, loop, autoPlay, className, title },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<MediaPlayerInstance | null>(null);
  const pendingPlayRef = useRef(false);

  // EnhancedVideoPlayer reports its instance via this callback rather than a
  // forwarded ref: next/dynamic's Loadable wrapper claims `ref` for its own
  // retry() handle and never forwards it to the lazily-loaded component.
  const handlePlayerChange = useCallback((instance: MediaPlayerInstance | null) => {
    playerRef.current = instance;
    if (instance && pendingPlayRef.current) {
      pendingPlayRef.current = false;
      void Promise.resolve(instance.play()).catch(() => {});
    }
  }, []);

  useImperativeHandle(ref, () => ({
    play: () => {
      if (!usePlayer) {
        return videoRef.current?.play();
      }
      if (playerRef.current) {
        return playerRef.current.play();
      }
      pendingPlayRef.current = true;
    },
  }));

  if (usePlayer) {
    return (
      <EnhancedVideoPlayer
        onPlayerChange={handlePlayerChange}
        src={src}
        poster={poster}
        muted={muted}
        loop={loop}
        autoPlay={autoPlay}
        className={className}
        title={title}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className={className}
      muted={muted}
      loop={loop}
      autoPlay={autoPlay}
      playsInline
      preload="metadata"
      poster={poster}
    >
      <source src={src} />
    </video>
  );
});

export default VideoPlayer;
