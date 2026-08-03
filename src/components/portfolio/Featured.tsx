"use client";

import { useRef } from "react";
import SectionDivider from "@/components/typography/SectionDivider";
import { getFeaturedSectionView, getMediaVariants, type PageBuilderSection } from "@/lib/content";
import usePlyrPlayer from "./usePlyrPlayer";

// Ports pbFeatured.vue: a titled, centered archived-video recording (used by
// e.g. pulsemobile's "Archived Video", pulsebooker-consumer-version's
// "Archived Recording"). Unlike ImageTextVideo, this doesn't hardcode
// loop/autoplay away - baseVideo.vue's own `loop` prop default (true) and
// `is_autoplay` flag both carry through unmodified, since nothing here
// overrides them the way pbImageText.vue hardcodes `:loop="false"`. Confirmed
// against the live site: every real instance has is_autoplay false, so the
// video sits paused behind Plyr's big-play-button overlay until clicked.
export default function Featured({ section }: { section: PageBuilderSection }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const view = getFeaturedSectionView(section);

  usePlyrPlayer(videoRef, view?.usePlayer ?? false);

  if (!view) {
    return null;
  }

  const [src] = getMediaVariants(view.filename);
  if (!src) {
    return null;
  }

  return (
    <section
      aria-label={view.title || undefined}
      className="mx-auto w-full max-w-[768px] px-5 pb-16 sm:pb-24 md:max-w-[1024px] md:px-[60px] xl:max-w-[1440px] xl:px-[100px]"
    >
      {view.title && <SectionDivider>{view.title}</SectionDivider>}

      {view.content && (
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-white/70">{view.content}</p>
      )}

      <div className="mx-auto mt-10 w-full max-w-[800px]">
        <video
          ref={videoRef}
          className="mx-auto h-auto max-h-[450px] w-full object-cover"
          muted
          loop
          autoPlay={view.autoplay}
          playsInline
          preload="metadata"
        >
          <source src={src.url} />
        </video>
      </div>
    </section>
  );
}
