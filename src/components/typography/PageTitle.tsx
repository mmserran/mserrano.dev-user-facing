import type { ReactNode } from "react";

// Mirrors the Gridsome frontend's baseHeader.vue: a viewport-height band
// (33vh, 50vh at md+) that vertically centers the title, plus a fixed
// ml-6 offset that recenters the tracked-out uppercase text optically -
// tracking-widest adds trailing space after the last letter, so plain
// text-center alone sits left of true center.
export default function PageTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex h-[33vh] items-center justify-center md:h-[50vh]">
      <h1
        className={`shine-text animate-shine motion-reduce:animate-none ml-6 text-center font-bold text-white uppercase tracking-widest [font-size:calc(0.5rem+7vmin)] lg:text-6xl ${className}`}
      >
        {children}
      </h1>
    </div>
  );
}
