// Mirrors the Gridsome frontend's pbDivider.vue, including the backend's
// three-way title mechanism (every titled page-builder block's `title`
// field, ultimately show_titleDivider/get_title in singleProject.vue):
//   - a real string -> centered, uppercase heading flanked by horizontal
//     rules (labeled).
//   - the literal "---" -> the same rule, unbroken and unlabeled, as a bare
//     section separator.
//   - empty string -> no divider at all.
// Centralized here so callers pass the raw `title` straight through instead
// of each re-implementing the branch - every one of this component's five
// callers handled the empty case (via `title && <SectionDivider>`) but none
// handled "---", since no built block's data has hit it yet. Only the
// centered variant is ported here; pbDivider also supports left/right-aligned
// variants via `divider_position`, unused by any block built so far.
//
// `id` lands on the heading itself so a caller can point a wrapping
// <section>'s aria-labelledby straight at it. Unused for the unlabeled
// bare-rule variant, which has nothing to label.
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
      <div aria-hidden="true" className="flex items-center text-xs">
        <span className="h-px w-full bg-white/62" />
      </div>
    );
  }

  return (
    <h3 id={id} className="flex items-center gap-4 text-xs font-bold tracking-widest text-white uppercase sm:gap-6">
      <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-white/62" />
      {title}
      <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-white/62" />
    </h3>
  );
}
