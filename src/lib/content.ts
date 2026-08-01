import type { IconType } from "react-icons";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { MdDescription } from "react-icons/md";
import rawContent from "../../content/content.json";
import rawManifest from "../../content/manifest.json";

export interface HeaderLink {
  id: number;
  sort: number;
  title: string;
  url: string;
  parent: string;
}

export const HEADER_LINK_ICONS: Record<string, IconType> = {
  Resume: MdDescription,
  LinkedIn: FaLinkedin,
  GitHub: FaGithub,
};

export interface ProjectGeneral {
  date: string;
  role: string;
  title: string;
  content: string;
  url: string;
  url_wayback: string;
  repo: string;
  workplace: string[];
  supported_browsers: string[];
}

export interface ProjectThumbnail {
  static: string;
  on_hover: string;
}

export interface ProjectTechnology {
  language: string[];
  framework: string[];
  deployment: string[];
  software: string[];
}

export interface ProjectScreenshot {
  desktop: string[];
  desktop_cutoff?: string | null;
  mobile: string[];
}

export interface Project {
  sort: number;
  slug: string;
  value: string;
  general: ProjectGeneral;
  thumbnail: ProjectThumbnail;
  technology: ProjectTechnology;
  screenshot: ProjectScreenshot;
  pagebuilder: string;
}

export interface ProjectFilterStats {
  usage: number;
  first_year_used: number;
}

export interface ProjectFilter {
  slug: string;
  value: string;
  title: string;
  url: string;
  affinity: string;
  is_square: boolean;
  is_full_color: boolean;
  primary: string;
  secondary: string;
  image: string;
  alias: string[];
  priority: number;
  list_trait: string[];
  stats: ProjectFilterStats;
}

interface Content {
  "nav-header": HeaderLink[];
  projects: Project[];
  "project-filters": ProjectFilter[];
  resume: {
    filename: string;
    contact_email: string;
  };
}

const content = rawContent as Content;

interface ManifestVariant {
  width: number | null;
  path: string;
}

const manifest = rawManifest as Record<string, ManifestVariant[]>;

export interface MediaVariant {
  width: number | null;
  url: string;
}

// Looks up the restored build's manifest.json, which maps an original media
// filename (as referenced by content.json) to its processed responsive WebP
// variants. Filters and projects can both reference filenames the migration
// backend never received a source asset for - the manifest still carries the
// key with an empty variant list rather than omitting it, so callers must
// treat "no variants" as a normal, expected case and fall back gracefully
// (e.g. a filter chip falling back to its letter avatar) rather than throw.
export function getMediaVariants(filename: string): MediaVariant[] {
  const trimmedFilename = filename.trim();

  if (!trimmedFilename) {
    return [];
  }

  const variants = manifest[trimmedFilename] ?? [];
  return variants.map((variant) => ({
    width: variant.width,
    url: `/${variant.path}`,
  }));
}

export function getHeaderLinks(): HeaderLink[] {
  return [...content["nav-header"]].sort((a, b) => a.sort - b.sort);
}

export function getProjects(): Project[] {
  return [...content.projects].sort((a, b) => {
    if (a.general.date && b.general.date) {
      return b.general.date.localeCompare(a.general.date);
    }
    return b.sort - a.sort;
  });
}

export function getProjectBySlug(slug: string): Project | undefined {
  return content.projects.find((p) => p.slug === slug);
}

export function getProjectFilters(): ProjectFilter[] {
  return [...content["project-filters"]].sort((a, b) => a.priority - b.priority);
}

// Mirrors the Gridsome frontend's momentFormat('round') filter: a project's
// exact month is deliberately blurred into a season so the portfolio reads
// as "Mid 2020" rather than a specific date.
export function formatRoundedDate(date: string): string {
  const [yearPart, monthPart] = date.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);

  if (month < 5) {
    return `Early ${year}`;
  }
  if (month > 8) {
    return `Late ${year}`;
  }
  return `Mid ${year}`;
}

export function truncate(value: string, limit: number): string {
  if (value.length > limit) {
    return `${value.slice(0, limit - 3)}...`;
  }
  return value;
}

// Mirrors the Gridsome frontend's useProject.update_list_visible: a project
// is visible if no filters are selected, or if ANY selected filter slug
// matches ANY of its title/technology/workplace/year fields - selected
// filters combine with OR/union semantics, not AND. Confirmed live: adding
// a second filter tag grows the visible set rather than narrowing it.
export function filterProjects(projects: Project[], selectedSlugs: string[]): Project[] {
  if (selectedSlugs.length === 0) {
    return projects;
  }

  return projects.filter((project) => projectMatchesAnyFilter(project, selectedSlugs));
}

function projectMatchesAnyFilter(project: Project, selectedSlugs: string[]): boolean {
  const lowerTitle = project.general.title.toLowerCase();

  return selectedSlugs.some((slug) => {
    const lowerSlug = slug.toLowerCase();
    return (
      lowerTitle.includes(lowerSlug) ||
      project.technology.language.includes(slug) ||
      project.technology.framework.includes(slug) ||
      project.technology.deployment.includes(slug) ||
      project.technology.software.includes(slug) ||
      project.general.workplace.includes(slug) ||
      project.general.date.includes(slug)
    );
  });
}

interface RelatedPostsBlock {
  type: "pbCarouselRelatedPosts";
  title: string;
  list_must_include: { value: string }[];
}

export interface RelatedProjects {
  title: string;
  projects: Project[];
}

function findRelatedPostsBlock(pagebuilder: string): RelatedPostsBlock | undefined {
  try {
    const blocks = JSON.parse(pagebuilder) as unknown[];
    return blocks.find(
      (block): block is RelatedPostsBlock =>
        typeof block === "object" && block !== null && (block as { type?: unknown }).type === "pbCarouselRelatedPosts",
    );
  } catch {
    return undefined;
  }
}

// Ports the Gridsome frontend's pbCarouselRelatedPosts recommendation_alg: the
// project's own pagebuilder block curates a must-include list (editorial
// picks, e.g. hospitalityPulse -> pulseMobile/pulseBooker/Internal Console 2),
// then remaining picks sharing any workplace tag are ordered before the rest
// by recency.
// Diverges from the Vue source in one place: a must_include value with no
// matching project (impossible today, but not guaranteed by the data) is
// skipped rather than pushed into the result as null, which would otherwise
// crash the React render.
export function getRelatedProjects(project: Project): RelatedProjects {
  const block = findRelatedPostsBlock(project.pagebuilder);
  if (!block) {
    return { title: "", projects: [] };
  }

  const pool = getProjects().filter((p) => p.value !== project.value);

  function take(predicate: (p: Project) => boolean): Project[] {
    const matches = pool.filter(predicate);
    for (const match of matches) {
      pool.splice(pool.indexOf(match), 1);
    }
    return matches;
  }

  const mustInclude = block.list_must_include
    .map((override) => take((p) => p.value === override.value)[0])
    .filter((p): p is Project => p !== undefined);

  const withinWorkplace = take((p) =>
    p.general.workplace.some((workplace) => project.general.workplace.includes(workplace)),
  );

  return {
    title: block.title,
    projects: [...mustInclude, ...withinWorkplace, ...pool],
  };
}

interface TechnologyCarouselBlock {
  type: "pbCarouselTechnology";
  title: string;
  use_language: boolean;
  use_framework: boolean;
  use_deployment: boolean;
  use_software: boolean;
}

export interface TechnologyCarousel {
  title: string;
  technologies: ProjectFilter[];
}

function findTechnologyCarouselBlock(pagebuilder: string): TechnologyCarouselBlock | undefined {
  try {
    const blocks = JSON.parse(pagebuilder) as unknown[];
    return blocks.find(
      (block): block is TechnologyCarouselBlock =>
        typeof block === "object" && block !== null && (block as { type?: unknown }).type === "pbCarouselTechnology",
    );
  } catch {
    return undefined;
  }
}

const TECHNOLOGY_CATEGORIES: { key: keyof ProjectTechnology; flag: keyof TechnologyCarouselBlock }[] = [
  { key: "language", flag: "use_language" },
  { key: "framework", flag: "use_framework" },
  { key: "deployment", flag: "use_deployment" },
  { key: "software", flag: "use_software" },
];

// Ports the Gridsome frontend's pbCarouselTechnology get_technology(): the
// block itself carries no logo list, just flags saying which of the
// project's own technology categories to pull slugs from (in field order -
// language, framework, deployment, software). Each slug is then resolved
// against project-filters for its title/url/logo. Diverges from the Vue
// source in the same way getRelatedProjects does: a slug with no matching
// filter is skipped rather than pushed into the result as undefined.
export function getTechnologyCarousel(project: Project): TechnologyCarousel {
  const block = findTechnologyCarouselBlock(project.pagebuilder);
  if (!block) {
    return { title: "", technologies: [] };
  }

  const filterBySlug = new Map(content["project-filters"].map((filter) => [filter.slug, filter]));

  const technologies = TECHNOLOGY_CATEGORIES.filter(({ flag }) => block[flag]).flatMap(({ key }) =>
    project.technology[key]
      .map((slug) => filterBySlug.get(slug))
      .filter((filter): filter is ProjectFilter => filter !== undefined),
  );

  return { title: block.title, technologies };
}

export function getMediaUrl(filename: string): string {
  const trimmedFilename = filename.trim();

  if (!trimmedFilename) {
    throw new Error("content.json resume.filename must not be empty.");
  }

  return `/media/${trimmedFilename
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

export function getResumeUrl(): string {
  return getMediaUrl(content.resume.filename);
}

export function getContactEmail(): string {
  const email = content.resume.contact_email.trim();

  if (!email) {
    throw new Error("content.json resume.contact_email must not be empty.");
  }

  return email;
}
