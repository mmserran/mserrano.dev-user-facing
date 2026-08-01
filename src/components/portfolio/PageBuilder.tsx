import type { ReactNode } from "react";
import {
  getPageBuilderSections,
  type PageBuilderSection,
  type Project,
} from "@/lib/content";
import ProjectHeader from "./ProjectHeader";
import RelatedProjects from "./RelatedProjects";
import TechnologyBreakdown from "./TechnologyBreakdown";
import TechnologyCarousel from "./TechnologyCarousel";
import Triplet from "./Triplet";

type PageBuilderComponent = (props: {
  project: Project;
  section: PageBuilderSection;
  index: number;
}) => ReactNode;

// Maps a pagebuilder block's `type` to the component that renders it.
// Contract for a new entry:
//   - Component receives `{ project, section, index }` (mirroring Gridsome's
//     singleProject.vue `:section` / array index). A type that is always a
//     singleton in real content may ignore `section`/`index` and self-locate
//     via a `find<Type>Block()` helper in content.ts (how today's four mapped
//     types work). A multi-instance type (pbTriplet, pbImageText) must read
//     its data from the passed `section` instead of find-first, since
//     find-first would only surface the first occurrence.
//   - Renders null when its block is absent or resolves to empty content.
//   - Owns its own title chrome (SectionDivider, or deliberately suppressed
//     per pbDivider.vue's rules) - the dispatcher inserts no dividers itself.
//   - Test it standalone against real content.json fixtures; PageBuilder's
//     own tests only need touching to assert a type's position in the array.
//
// Block types without a ported component yet (pbMobileMozaic, pbFeatured,
// pbImageText, pbCarouselCenterEmphasis, pbParallax) are simply absent here
// and get skipped below; each is a future one-component-at-a-time addition
// per AGENTS.md.
const PAGE_BUILDER_COMPONENTS: Record<string, PageBuilderComponent> = {
  pbHeader: ProjectHeader as PageBuilderComponent,
  pbGraphBreakdown: TechnologyBreakdown as PageBuilderComponent,
  pbCarouselTechnology: TechnologyCarousel as PageBuilderComponent,
  pbCarouselRelatedPosts: RelatedProjects as PageBuilderComponent,
  pbTriplet: Triplet as PageBuilderComponent,
};

// Ports singleProject.vue's `<component :is="section.type">`: walks the
// project's pagebuilder array in its own order and renders the matching
// component once per occurrence (no dedup-by-type).
export default function PageBuilder({ project }: { project: Project }) {
  const sections = getPageBuilderSections(project);

  return (
    <>
      {sections.map((section, index) => {
        const Component = PAGE_BUILDER_COMPONENTS[section.type];
        if (!Component) {
          return null;
        }
        return (
          <Component
            key={`${project.slug}-${section.type}-${index}`}
            project={project}
            section={section}
            index={index}
          />
        );
      })}
    </>
  );
}
