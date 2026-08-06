// Mirrors the Gridsome frontend's pbDivider.vue, including the backend's
// three-way title mechanism (every titled page-builder block's `title`
// field, ultimately show_titleDivider/get_title in singleProject.vue):
//   - a real string -> centered, uppercase heading flanked by horizontal
//     rules (labeled).
//   - the literal "---" -> the same rule, unbroken and unlabeled, as a bare
//     section separator (TechnologyBreakdown's title is always this).
//   - empty string -> no divider at all.
// Callers pass the raw `title` straight through; this component owns the
// branch. Only the centered variant is ported here; pbDivider also supports
// left/right-aligned variants via `divider_position`, unused by any block
// built so far.
//
// `id` lands on the heading itself so a caller can point a wrapping
// <section>'s aria-labelledby straight at it. Unused for the unlabeled
// bare-rule variant, which has nothing to label.
//
// Also owns the vertical rhythm between page-builder sections: pbDivider.vue
// carries the same `pbBlock` margin class as every content block it precedes,
// and adjacent sibling margins collapse - so in practice the divider (not the
// block) is what visually spaces one section from the next. Every page-builder
// section's own wrapper is margin-free; my-8/sm:my-12 here is what puts space
// both above a divider (against the previous block) and below it (against its
// own block's content), keeping that spacing symmetric and centralized
// instead of each block guessing its own top/bottom values.
export default function SectionDivider({ id, title }: { id?: string; title: string }) {
  if (!title) {
    return null;
  }

  if (title === "---") {
    // The Gridsome source renders this case as an empty <h3> - a WCAG "empty
    // heading" anti-pattern (a heading with no accessible name). There's no
    // title to label it with, so this renders a plain decorative rule
    // instead of a heading.
    return (
      <div aria-hidden="true" className="my-8 flex items-center text-xs sm:my-12">
        <span className="h-px w-full bg-white/62" />
      </div>
    );
  }

  return (
    <h3
      id={id}
      className="my-8 flex items-center gap-4 text-xs font-bold tracking-widest text-white uppercase sm:my-12 sm:gap-6"
    >
      <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-white/62" />
      {title}
      <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-white/62" />
    </h3>
  );
}
