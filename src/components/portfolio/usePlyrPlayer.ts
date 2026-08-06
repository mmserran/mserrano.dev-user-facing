"use client";

import { useEffect, type RefObject } from "react";

// Shared by every ported video (ImageTextVideo, Featured): both baseVideo.vue
// call sites gate the same Plyr construct/destroy lifecycle behind a
// `use_player` CMS flag - a consistent, cross-browser control skin (blue
// accents, settings/PIP/fullscreen) versus no native `controls` attribute
// either. Dynamically imported so the ~30kb Plyr bundle only loads for a
// project that actually has a player-enabled video.
export default function usePlyrPlayer(videoRef: RefObject<HTMLVideoElement | null>, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const video = videoRef.current;
    if (!video) return;

    let player: import("plyr").default | undefined;
    let cancelled = false;

    Promise.all([import("plyr/dist/plyr.css"), import("plyr")]).then(([, { default: Plyr }]) => {
      if (cancelled) return;
      player = new Plyr(video);
    });

    return () => {
      cancelled = true;
      player?.destroy();
    };
  }, [videoRef, enabled]);
}
