import type { ReactNode } from "react";

// Mirrors the Gridsome frontend's pbDivider.vue: a centered, uppercase,
// tracked-out heading flanked by horizontal rules - used by titled page-builder
// blocks that share this chrome (Related, Exposed To, ...). TechnologyBreakdown
// uses its own header/legend treatment instead. Only the centered variant is
// ported here; pbDivider also supports left/right-aligned variants via
// `divider_position`, unused by any block built so far.
export default function SectionDivider({ children }: { children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-6 text-xs font-bold tracking-widest text-white uppercase">
      <span aria-hidden="true" className="h-px flex-1 bg-white/62" />
      {children}
      <span aria-hidden="true" className="h-px flex-1 bg-white/62" />
    </h3>
  );
}
