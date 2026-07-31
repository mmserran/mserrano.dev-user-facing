import Carousel from "@/components/carousel/Carousel";
import SectionDivider from "@/components/typography/SectionDivider";
import { getRelatedProjects, type Project } from "@/lib/content";
import ProjectTile from "./ProjectTile";

// Renders the project's pbCarouselRelatedPosts block, if it has one with any
// picks to show - a project with an empty recommendation pool (e.g. every
// other project already excluded) renders nothing rather than an empty rail.
export default function RelatedProjects({ project }: { project: Project }) {
  const related = getRelatedProjects(project);

  if (related.projects.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="related-projects-heading"
      className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8"
    >
      <SectionDivider>
        <span id="related-projects-heading">{related.title}</span>
      </SectionDivider>

      <div className="mt-8">
        <Carousel ariaLabel={`${related.title} projects`}>
          {related.projects.map((relatedProject) => (
            <div key={relatedProject.slug} className="w-72 shrink-0 snap-start sm:w-80">
              <ProjectTile project={relatedProject} className="h-full" />
            </div>
          ))}
        </Carousel>
      </div>
    </section>
  );
}
