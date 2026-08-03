"use client";

import {
  useCallback,
  useEffect,
  useRef,
} from "react";
import SectionDivider from "@/components/typography/SectionDivider";
import {
  getMediaVariants,
  getParallaxSectionView,
  type PageBuilderSection,
} from "@/lib/content";

const IMAGE_SIZES =
  "(min-width: 1440px) 1240px, (min-width: 768px) calc(100vw - 120px), calc(100vw - 40px)";
const MAX_SCROLL_OFFSET = 72;
// At 60fps, a full-range move decays to SETTLED_THRESHOLD in ~6.7s.
const DRIFT_EASING = 0.02;
const SETTLED_THRESHOLD = 0.02;

export default function Parallax({
  section,
}: {
  section: PageBuilderSection;
}) {
  const view = getParallaxSectionView(section);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const reducedMotionRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const animationStepRef = useRef<FrameRequestCallback>(() => undefined);

  const scheduleDrift = useCallback(() => {
    if (!reducedMotionRef.current && frameRef.current === null) {
      frameRef.current = window.requestAnimationFrame((time) =>
        animationStepRef.current(time),
      );
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    reducedMotionRef.current = reducedMotion.matches;
    if (reducedMotion.matches) return;

    const driftToTarget = () => {
      frameRef.current = null;
      const target = targetRef.current;
      const current = currentRef.current;
      current.x += (target.x - current.x) * DRIFT_EASING;
      current.y += (target.y - current.y) * DRIFT_EASING;
      image.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;

      if (
        Math.abs(target.x - current.x) > SETTLED_THRESHOLD ||
        Math.abs(target.y - current.y) > SETTLED_THRESHOLD
      ) {
        frameRef.current = window.requestAnimationFrame(driftToTarget);
      }
    };
    animationStepRef.current = driftToTarget;

    const updateScrollTarget = () => {
      const rect = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const progress = Math.max(
        -1,
        Math.min(1, (viewportHeight / 2 - (rect.top + rect.height / 2)) / viewportHeight),
      );
      targetRef.current.y = progress * MAX_SCROLL_OFFSET;
      scheduleDrift();
    };

    updateScrollTarget();
    window.addEventListener("scroll", updateScrollTarget, { passive: true });
    window.addEventListener("resize", updateScrollTarget, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateScrollTarget);
      window.removeEventListener("resize", updateScrollTarget);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [scheduleDrift, view?.image]);

  if (!view) return null;

  const variants = getMediaVariants(view.image);
  const largest = variants.reduce((a, b) =>
    (b.width ?? 0) > (a.width ?? 0) ? b : a,
  );
  const srcSet = variants
    .filter((variant): variant is { width: number; url: string } =>
      variant.width !== null,
    )
    .map((variant) => `${variant.url} ${variant.width}w`)
    .join(", ");

  return (
    <section
      aria-label={
        view.title && view.title !== "---"
          ? view.title
          : view.content || undefined
      }
      className="mx-auto w-full max-w-[768px] px-5 pb-16 sm:pb-24 md:max-w-[1024px] md:px-[60px] xl:max-w-[1440px] xl:px-[100px]"
    >
      {view.title && view.title !== "---" && (
        <div className="pb-10">
          <SectionDivider>{view.title}</SectionDivider>
        </div>
      )}
      <div
        ref={containerRef}
        className="relative isolate flex h-[150px] w-full items-center justify-center overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- discrete pre-generated manifest widths need a manual srcset */}
        <img
          ref={imageRef}
          src={largest.url}
          srcSet={srcSet || undefined}
          sizes={srcSet ? IMAGE_SIZES : undefined}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          style={{
            WebkitMaskImage:
              "linear-gradient(90deg, transparent, #fff 40%, #fff 60%, transparent)",
            maskImage:
              "linear-gradient(90deg, transparent, #fff 40%, #fff 60%, transparent)",
          }}
          className="absolute inset-x-0 -top-[80px] -z-20 h-[calc(100%+160px)] w-full max-w-none object-cover opacity-25 will-change-transform select-none motion-reduce:inset-0 motion-reduce:h-full motion-reduce:transform-none motion-reduce:will-change-auto"
        />
        {view.content && (
          <h2 className="px-0 text-center text-[30px] leading-10 font-bold tracking-[9.75px] text-white uppercase md:pl-10">
            {view.content}
          </h2>
        )}
      </div>
    </section>
  );
}
