import Carousel from "@/components/carousel/Carousel";
import SectionDivider from "@/components/typography/SectionDivider";
import { getTechnologyCarousel, type Project, type ProjectFilter } from "@/lib/content";
import TechLogo from "./TechLogo";

// Renders the project's pbCarouselTechnology block ("Exposed To"), if it has
// one with any resolvable technologies - a project whose flagged categories
// are all empty (or whose slugs don't resolve to a filter) renders nothing
// rather than an empty rail, matching RelatedProjects.
export default function TechnologyCarousel({ project }: { project: Project }) {
  const { title, technologies } = getTechnologyCarousel(project);

  if (technologies.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="technology-carousel-heading"
      className="mx-auto w-full max-w-[768px] px-5 pb-16 sm:pb-24 md:max-w-[1024px] md:px-[60px] xl:max-w-[1440px] xl:px-[100px]"
    >
      <SectionDivider>
        <span id="technology-carousel-heading">{title}</span>
      </SectionDivider>

      <div className="mt-8">
        <Carousel ariaLabel={`${title} technologies`} edgeFade>
          {technologies.map((technology, index) => (
            <TechnologyCard key={`${technology.slug}-${index}`} technology={technology} />
          ))}
        </Carousel>
      </div>
    </section>
  );
}

// A single link wraps the logo and label (one tab stop), per ProjectTile's
// link-purpose precedent - except a filter with no external url (e.g.
// Cloudinary, which content.json never gave a public marketing page), which
// renders as a plain, non-interactive cell instead of a dead link.
function TechnologyCard({ technology }: { technology: ProjectFilter }) {
  const body = (
    <>
      <TechLogo filter={technology} size={100} backdrop={false} square={technology.is_square} />
      <span className="shine-text animate-shine motion-reduce:animate-none mt-6 block text-center text-sm font-semibold tracking-wide text-white uppercase">
        {technology.title}
      </span>
    </>
  );

  const className = "flex w-[200px] shrink-0 snap-start flex-col items-center justify-center";

  if (!technology.url) {
    return <div className={className}>{body}</div>;
  }

  return (
    <a
      href={technology.url}
      target="_blank"
      rel="noopener noreferrer"
      title={technology.title}
      className={`${className} rounded-lg transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue motion-reduce:transform-none`}
    >
      {body}
    </a>
  );
}
