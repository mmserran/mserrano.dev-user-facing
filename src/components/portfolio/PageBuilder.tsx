import type { ReactNode } from "react";
import { getPageBuilderSectionTypes, type Project } from "@/lib/content";
import ProjectHeader from "./ProjectHeader";
import RelatedProjects from "./RelatedProjects";
import TechnologyBreakdown from "./TechnologyBreakdown";
import TechnologyCarousel from "./TechnologyCarousel";

type PageBuilderComponent = (props: { project: Project }) => ReactNode;

// Maps a pagebuilder block's `type` to the component that renders it. Each
// component locates its own block within project.pagebuilder and renders
// nothing if that block is absent or empty, so this registry only needs to
// know which types are recognized - not each block's shape.
//
// Block types without a ported component yet (pbTriplet, pbMobileMozaic,
// pbFeatured, pbImageText, pbCarouselCenterEmphasis, pbParallax) are simply
// absent here and get skipped below; each is a future one-component-at-a-time
// addition per AGENTS.md.
const PAGE_BUILDER_COMPONENTS: Record<string, PageBuilderComponent> = {
  pbHeader: ProjectHeader,
  pbGraphBreakdown: TechnologyBreakdown,
  pbCarouselTechnology: TechnologyCarousel,
  pbCarouselRelatedPosts: RelatedProjects,
};

// Ports singleProject.vue's `<component :is="section.type">`: walks the
// project's pagebuilder array in its own order and renders the matching
// component for each recognized block type, once per type.
export default function PageBuilder({ project }: { project: Project }) {
  const seen = new Set<string>();
  const types = getPageBuilderSectionTypes(project).filter((type) => {
    if (seen.has(type) || !PAGE_BUILDER_COMPONENTS[type]) {
      return false;
    }
    seen.add(type);
    return true;
  });

  return (
    <>
      {types.map((type) => {
        const Component = PAGE_BUILDER_COMPONENTS[type];
        return <Component key={type} project={project} />;
      })}
    </>
  );
}
