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

interface CannedMessage {
  title: string;
  content: string;
}

export interface Trait {
  slug: string;
  value: string;
  title: string;
}

interface Content {
  "nav-header": HeaderLink[];
  projects: Project[];
  "project-filters": ProjectFilter[];
  traits: Trait[];
  resume: {
    filename: string;
    contact_email: string;
  };
  "theme-options/canned-msgs": CannedMessage[];
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

export function getTraits(): Trait[] {
  return content.traits;
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

interface PageBuilderSelection {
  value: string;
}

interface TechnologyBreakdownEntry {
  technology__weight: string;
  technology__use_language: boolean;
  technology__selection: PageBuilderSelection[];
}

interface LanguageBreakdownEntry {
  language__weight: string;
  language__selection: PageBuilderSelection[];
  complex_technology: TechnologyBreakdownEntry[];
}

interface TechnologyBreakdownBlock {
  type: "pbGraphBreakdown";
  title: string;
  complex_language: LanguageBreakdownEntry[];
}

export interface TechnologyGraphSlice {
  technology: ProjectFilter;
  weight: number;
  breakdown: TechnologyGraphChildSlice[];
}

export interface TechnologyGraphChildSlice {
  technology?: ProjectFilter;
  weight: number;
}

export interface TechnologyLegendEntry {
  technology?: ProjectFilter;
  children: ProjectFilter[];
  general: boolean;
}

export interface TechnologyLegendSection {
  title: string;
  entries: TechnologyLegendEntry[];
}

export interface TechnologyBreakdown {
  graph: TechnologyGraphSlice[];
  legend: TechnologyLegendSection[];
}

const TECHNOLOGY_LEGEND_SECTIONS = [
  ["Scripts", "scripts"],
  ["Template / Styles", "template-styles"],
  ["Server", "server"],
  ["Dev Environment", "dev_env"],
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// One entry from a project's pagebuilder JSON array. Shape varies by `type`;
// the dispatcher passes the object through so multi-instance blocks can read
// their own payload instead of find-first helpers.
export interface PageBuilderSection {
  type: string;
  [key: string]: unknown;
}

// Ports singleProject.vue's `get_pagebuilder()`: the ordered pagebuilder array
// for components that dispatch on type (see PageBuilder).
export function getPageBuilderSections(project: Project): PageBuilderSection[] {
  try {
    const blocks = JSON.parse(project.pagebuilder) as unknown;
    if (!Array.isArray(blocks)) {
      return [];
    }
    return blocks.filter(
      (block): block is PageBuilderSection =>
        isRecord(block) && typeof block.type === "string",
    );
  } catch {
    return [];
  }
}

function findTechnologyBreakdownBlock(pagebuilder: string): TechnologyBreakdownBlock | undefined {
  try {
    const blocks = JSON.parse(pagebuilder) as unknown;
    if (!Array.isArray(blocks)) {
      return undefined;
    }

    const block = blocks.find(
      (candidate) => isRecord(candidate) && candidate.type === "pbGraphBreakdown",
    );
    if (!isRecord(block) || !Array.isArray(block.complex_language)) {
      return undefined;
    }

    return block as unknown as TechnologyBreakdownBlock;
  } catch {
    return undefined;
  }
}

function parseWeight(value: unknown): number | undefined {
  const weight = typeof value === "string" || typeof value === "number" ? Number(value) / 100 : Number.NaN;
  return Number.isFinite(weight) && weight >= 0 ? weight : undefined;
}

// Ports pbGraphBreakdown.vue's data transformation while keeping malformed or
// stale CMS references from breaking the static export. Page-builder selections
// use the filter's canonical Carbon Fields value; the project's technology
// lists use filter slugs, so both lookup maps are required.
export function getTechnologyBreakdown(project: Project): TechnologyBreakdown | undefined {
  const block = findTechnologyBreakdownBlock(project.pagebuilder);
  if (!block) {
    return undefined;
  }

  const filters = getProjectFilters();
  const byValue = new Map(filters.map((filter) => [filter.value, filter]));
  const bySlug = new Map(filters.map((filter) => [filter.slug, filter]));
  const technologyPool = Object.values(project.technology).flat();
  const grouped = new Map<string, TechnologyLegendEntry[]>();
  const graph: TechnologyGraphSlice[] = [];

  const removeFromPool = (slug: string) => {
    let index = technologyPool.indexOf(slug);
    while (index !== -1) {
      technologyPool.splice(index, 1);
      index = technologyPool.indexOf(slug);
    }
  };

  for (const language of block.complex_language) {
    if (!isRecord(language) || !Array.isArray(language.language__selection)) {
      continue;
    }

    const languageSelection = language.language__selection[0];
    const languageTechnology = isRecord(languageSelection)
      ? byValue.get(String(languageSelection.value))
      : undefined;
    const languageWeight = parseWeight(language.language__weight);
    if (!languageTechnology || languageWeight === undefined) {
      continue;
    }

    const children: ProjectFilter[] = [];
    const childSlices: TechnologyGraphChildSlice[] = [];
    const complexTechnology = Array.isArray(language.complex_technology)
      ? language.complex_technology
      : [];

    for (const child of complexTechnology) {
      if (!isRecord(child)) {
        continue;
      }
      const childWeight = parseWeight(child.technology__weight);
      if (childWeight === undefined) {
        continue;
      }

      const selections = Array.isArray(child.technology__selection)
        ? child.technology__selection
        : [];
      const selection = selections[0];
      const childTechnology = isRecord(selection)
        ? byValue.get(String(selection.value))
        : undefined;

      if (childTechnology) {
        children.push(childTechnology);
        childSlices.push({ technology: childTechnology, weight: childWeight });
        removeFromPool(childTechnology.slug);
      } else if (child.technology__use_language === true) {
        childSlices.push({ weight: childWeight });
      }
    }

    const entries = grouped.get(languageTechnology.affinity) ?? [];
    entries.push({ technology: languageTechnology, children, general: false });
    grouped.set(languageTechnology.affinity, entries);
    removeFromPool(languageTechnology.slug);
    graph.push({ technology: languageTechnology, weight: languageWeight, breakdown: childSlices });
  }

  const generalByAffinity = new Map<string, ProjectFilter[]>();
  for (const slug of technologyPool) {
    const technology = bySlug.get(slug);
    if (!technology) {
      continue;
    }
    const entries = generalByAffinity.get(technology.affinity) ?? [];
    if (!entries.some((entry) => entry.slug === technology.slug)) {
      entries.push(technology);
    }
    generalByAffinity.set(technology.affinity, entries);
  }

  for (const [affinity, technologies] of generalByAffinity) {
    technologies.sort((a, b) => a.title.localeCompare(b.title));
    const entries = grouped.get(affinity) ?? [];
    entries.unshift({ children: technologies, general: true });
    grouped.set(affinity, entries);
  }

  const legend = TECHNOLOGY_LEGEND_SECTIONS.map(([title, affinity]) => {
    const entries = [...(grouped.get(affinity) ?? [])];
    if (affinity === "template-styles") {
      entries.reverse();
    }
    return { title, entries };
  });

  return { graph, legend };
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

interface CenterEmphasisSlideBlock {
  title: string;
  slide_desktop?: string;
  slide_mobile?: string;
  offset?: string;
}

interface CenterEmphasisCarouselBlock {
  type: "pbCarouselCenterEmphasis";
  title: string;
  content?: string;
  list_slide: CenterEmphasisSlideBlock[];
}

export interface CenterEmphasisSlide {
  title: string;
  filename: string;
  offset: string;
}

export interface CenterEmphasisCarousel {
  title: string;
  content: string;
  slides: CenterEmphasisSlide[];
}

function findCenterEmphasisCarouselBlock(pagebuilder: string): CenterEmphasisCarouselBlock | undefined {
  try {
    const blocks = JSON.parse(pagebuilder) as unknown;
    if (!Array.isArray(blocks)) {
      return undefined;
    }
    const block = blocks.find((candidate) => isRecord(candidate) && candidate.type === "pbCarouselCenterEmphasis");
    return isRecord(block) && Array.isArray(block.list_slide)
      ? (block as unknown as CenterEmphasisCarouselBlock)
      : undefined;
  } catch {
    return undefined;
  }
}

// Ports the Gridsome frontend's pbCarouselCenterEmphasisActual: a coverflow of
// a project's own page screenshots, one slide per list_slide entry. Falls back
// to a slide's mobile capture when no desktop one was set
// (`obj.slide_desktop || obj.slide_mobile`, from snippetMedia.vue's `src`
// prop); a slide with neither is skipped rather than rendered blank.
export function getCenterEmphasisCarousel(project: Project): CenterEmphasisCarousel {
  const block = findCenterEmphasisCarouselBlock(project.pagebuilder);
  if (!block) {
    return { title: "", content: "", slides: [] };
  }

  const slides = block.list_slide
    .map((slide) => ({
      title: slide.title,
      filename: slide.slide_desktop || slide.slide_mobile || "",
      offset: slide.offset ?? "",
    }))
    .filter((slide): slide is CenterEmphasisSlide => slide.filename !== "");

  return { title: block.title, content: block.content ?? "", slides };
}

interface TripletTechnologyRef {
  value: string;
}

export interface TripletItemTechnology {
  type: "itemTechnology";
  title: string;
  technology: TripletTechnologyRef[];
}

export interface TripletItemGraph {
  type: "itemGraph";
  title: string;
  use_language: boolean;
  use_framework: boolean;
  use_deployment: boolean;
  use_software: boolean;
}

export type TripletItem = TripletItemTechnology | TripletItemGraph;

export interface TripletTechnologyItemView {
  type: "itemTechnology";
  key: string;
  technology: ProjectFilter;
}

export interface TripletTechCardView {
  key: string;
  technology: ProjectFilter;
  projects: number;
  // Highest usage among the displayed cards for this category (the capped
  // selection), not among every technology in the project's category list.
  isHighProficiency: boolean;
  // This project's own year is this technology's stats.first_year_used.
  isFirstUsedHere: boolean;
  // Used within the active window (see ACTIVE_WINDOW_YEARS) of the
  // portfolio's most recent project.
  isActive: boolean;
  // "Using <trait> since <year>" when active (year is the earliest
  // first_year_used among every technology sharing that trait, portfolio-
  // wide - a more general "how long have you had this capability" claim
  // than this one tool's own start date), or a closed, past-tense form when
  // dormant so a stale tool never borrows an "active since" claim from more
  // current siblings: "<trait> used <first>-<last>" if it spans more than
  // one year, or "<trait> of choice in <year>" for a single year.
  statistic: string;
}

export interface TripletGraphItemView {
  type: "itemGraph";
  key: string;
  title: string;
  cards: TripletTechCardView[];
}

export type TripletItemView = TripletTechnologyItemView | TripletGraphItemView;

export interface TripletSectionView {
  title: string;
  content: string;
  items: TripletItemView[];
}

const TRIPLET_GRAPH_CATEGORIES: { key: keyof ProjectTechnology; flag: keyof TripletItemGraph; label: string }[] = [
  { key: "language", flag: "use_language", label: "Languages" },
  { key: "framework", flag: "use_framework", label: "Frameworks" },
  { key: "deployment", flag: "use_deployment", label: "Deployment" },
  { key: "software", flag: "use_software", label: "Software" },
];

const MAX_CARDS_PER_CATEGORY = 4;
const ACTIVE_WINDOW_YEARS = 2;

function projectYear(project: Project): number {
  return Number(project.general.date.split("-")[0]);
}

function getPortfolioMaxYear(): number {
  return Math.max(...getProjects().map(projectYear));
}

// A technology's last-used year isn't tracked directly on project-filters
// (only first_year_used is) - it's derived by scanning every project's own
// technology lists, since that's the only place usage-by-year exists.
function buildLastUsedYearBySlug(): Map<string, number> {
  const lastUsed = new Map<string, number>();
  for (const project of getProjects()) {
    const year = projectYear(project);
    for (const slug of Object.values(project.technology).flat()) {
      const existing = lastUsed.get(slug);
      if (existing === undefined || year > existing) {
        lastUsed.set(slug, year);
      }
    }
  }
  return lastUsed;
}

function primaryTraitSlug(technology: ProjectFilter): string | undefined {
  return technology.list_trait.find((slug): slug is string => Boolean(slug));
}

function traitEarliestYear(traitSlug: string, allFilters: ProjectFilter[]): number {
  return Math.min(
    ...allFilters.filter((filter) => filter.list_trait.includes(traitSlug)).map((filter) => filter.stats.first_year_used),
  );
}

function formatStatistic(
  traitTitle: string | undefined,
  isActive: boolean,
  earliestTraitYear: number | undefined,
  firstYearUsed: number,
  lastYearUsed: number,
): string {
  if (isActive && earliestTraitYear !== undefined) {
    return traitTitle ? `Using ${traitTitle} since ${earliestTraitYear}` : `Active since ${earliestTraitYear}`;
  }
  if (firstYearUsed === lastYearUsed) {
    return traitTitle ? `${traitTitle} of choice in ${firstYearUsed}` : `Used in ${firstYearUsed}`;
  }
  return traitTitle ? `${traitTitle} used ${firstYearUsed}–${lastYearUsed}` : `Used ${firstYearUsed}–${lastYearUsed}`;
}

// Ports pbTripletItemGraph.vue's category selection (which of the project's
// own technology lists to read) but replaces its Chart.js usage-comparison
// bars entirely with plain proficiency cards: a technology's own usage count
// and a "since"/date-range statistic, capped to the 4 most representative
// technologies per category ("first used here" ones are pinned into that
// cap even when a higher-usage peer would otherwise bump them out).
function buildTripletCards(
  technologySlugs: string[],
  project: Project,
  allFilters: ProjectFilter[],
  traitTitleBySlug: Map<string, string>,
  lastUsedYearBySlug: Map<string, number>,
  portfolioMaxYear: number,
): TripletTechCardView[] {
  const bySlug = new Map(allFilters.map((filter) => [filter.slug, filter]));
  const technologies = technologySlugs
    .map((slug) => bySlug.get(slug))
    .filter((filter): filter is ProjectFilter => filter !== undefined);

  if (technologies.length === 0) {
    return [];
  }

  const activeThreshold = portfolioMaxYear - (ACTIVE_WINDOW_YEARS - 1);
  const isActive = (technology: ProjectFilter) => (lastUsedYearBySlug.get(technology.slug) ?? 0) >= activeThreshold;
  const thisProjectYear = projectYear(project);
  const isFirstUsedHere = (technology: ProjectFilter) => technology.stats.first_year_used === thisProjectYear;

  const pinned = technologies
    .filter(isFirstUsedHere)
    .sort((a, b) => b.stats.usage - a.stats.usage)
    .slice(0, MAX_CARDS_PER_CATEGORY);
  const rest = technologies
    .filter((technology) => !isFirstUsedHere(technology))
    .sort((a, b) => b.stats.usage - a.stats.usage);
  const remainingSlots = Math.max(0, MAX_CARDS_PER_CATEGORY - pinned.length);
  const selected = [...pinned, ...rest.slice(0, remainingSlots)].sort((a, b) => b.stats.usage - a.stats.usage);
  const highProficiencySlug = selected[0]?.slug;

  return selected.map((technology) => {
    const traitSlug = primaryTraitSlug(technology);
    const traitTitle = traitSlug ? traitTitleBySlug.get(traitSlug) : undefined;
    const active = isActive(technology);
    const lastYearUsed = lastUsedYearBySlug.get(technology.slug) ?? technology.stats.first_year_used;
    const earliestTraitYear = active && traitSlug ? traitEarliestYear(traitSlug, allFilters) : undefined;

    return {
      key: technology.slug,
      technology,
      projects: technology.stats.usage,
      isHighProficiency: technology.slug === highProficiencySlug,
      isFirstUsedHere: isFirstUsedHere(technology),
      isActive: active,
      statistic: formatStatistic(traitTitle, active, earliestTraitYear, technology.stats.first_year_used, lastYearUsed),
    };
  });
}

function buildGraphItemView(
  item: TripletItemGraph,
  project: Project,
  allFilters: ProjectFilter[],
  traitTitleBySlug: Map<string, string>,
  lastUsedYearBySlug: Map<string, number>,
  portfolioMaxYear: number,
  index: number,
): TripletGraphItemView | undefined {
  const category = TRIPLET_GRAPH_CATEGORIES.find((entry) => item[entry.flag] === true);
  const slugs = category ? project.technology[category.key] : [];
  const cards = buildTripletCards(slugs, project, allFilters, traitTitleBySlug, lastUsedYearBySlug, portfolioMaxYear);

  if (cards.length === 0) {
    return undefined;
  }

  return {
    type: "itemGraph",
    key: `graph-${index}`,
    title: category ? category.label : item.title,
    cards,
  };
}

const CANNED_MESSAGE_PATTERN = /^\[canned msg="([^"]+)"\]$/;

// Ports useShortcodes/scCanned.vue for the one shortcode pbTriplet's section
// content actually uses ("Usage vs Similar"'s caption). Canned messages are
// trusted, build-time CMS copy (not user input), but every one used by a
// pbTriplet block today is a plain sentence, so this resolves to plain text
// rather than porting baseText's general HTML shortcode engine.
function resolveTripletContent(rawContentValue: string): string {
  const trimmed = rawContentValue.trim();
  const match = CANNED_MESSAGE_PATTERN.exec(trimmed);
  if (!match) {
    return trimmed;
  }

  const canned = content["theme-options/canned-msgs"].find((entry) => entry.title === match[1]);
  return canned?.content ?? "";
}

function isTripletItem(value: unknown): value is TripletItem {
  if (!isRecord(value)) {
    return false;
  }
  if (value.type === "itemTechnology") {
    return Array.isArray(value.technology);
  }
  return value.type === "itemGraph";
}

// Ports pbTriplet.vue + pbTripletItemTechnology.vue + pbTripletItemGraph.vue.
// Can appear more than once per project (e.g. "Technology" then "Usage vs
// Similar"); per PageBuilder's multi-instance contract this reads the
// dispatched section rather than find-first.
export function getTripletSectionView(section: PageBuilderSection, project: Project): TripletSectionView {
  const title = typeof section.title === "string" ? section.title : "";
  const rawContentValue = typeof section.content === "string" ? section.content : "";
  const listTriplet = Array.isArray(section.list_triplet) ? section.list_triplet.filter(isTripletItem) : [];

  const allFilters = getProjectFilters();
  const filterByValue = new Map(allFilters.map((filter) => [filter.value, filter]));
  const traitTitleBySlug = new Map(getTraits().map((trait) => [trait.slug, trait.title]));
  const lastUsedYearBySlug = buildLastUsedYearBySlug();
  const portfolioMaxYear = getPortfolioMaxYear();

  const items: TripletItemView[] = listTriplet.flatMap((item, index): TripletItemView[] => {
    if (item.type === "itemTechnology") {
      const ref = item.technology[0];
      const technology = ref ? filterByValue.get(ref.value) : undefined;
      return technology ? [{ type: "itemTechnology", key: `tech-${index}`, technology }] : [];
    }

    const graphItem = buildGraphItemView(
      item,
      project,
      allFilters,
      traitTitleBySlug,
      lastUsedYearBySlug,
      portfolioMaxYear,
      index,
    );
    return graphItem ? [graphItem] : [];
  });

  return {
    title,
    content: resolveTripletContent(rawContentValue),
    items,
  };
}

interface MobileMosaicBlock {
  type: "pbMobileMozaic";
  title: string;
}

export interface MobileMosaic {
  title: string;
  screenshots: string[];
}

function findMobileMosaicBlock(pagebuilder: string): MobileMosaicBlock | undefined {
  try {
    const blocks = JSON.parse(pagebuilder) as unknown;
    if (!Array.isArray(blocks)) {
      return undefined;
    }
    const block = blocks.find((candidate) => isRecord(candidate) && candidate.type === "pbMobileMozaic");
    return isRecord(block) && typeof block.title === "string" ? (block as unknown as MobileMosaicBlock) : undefined;
  } catch {
    return undefined;
  }
}

// Ports the Gridsome frontend's pbMobileMozaic block: an infinitely-scrolling
// collage of a project's own mobile screenshots. The block itself carries no
// screenshot list - project.screenshot.mobile is the actual source - so a
// project can have the block present but nothing to draw from (e.g.
// mserrano-dev), which MobileMosaic must treat as "render nothing".
export function getMobileMosaic(project: Project): MobileMosaic {
  const block = findMobileMosaicBlock(project.pagebuilder);
  if (!block) {
    return { title: "", screenshots: [] };
  }

  return { title: block.title, screenshots: project.screenshot.mobile };
}

export type ImageTextMediaFormat = "image" | "video" | "";

export interface ImageTextMedia {
  filename: string;
  format: ImageTextMediaFormat;
  isScreenshot: boolean;
  usePlayer: boolean;
}

export interface ImageTextTextSegment {
  type: "text";
  text: string;
}

export interface ImageTextLinkSegment {
  type: "link";
  text: string;
  href: string;
}

export type ImageTextContentSegment = ImageTextTextSegment | ImageTextLinkSegment;

export interface ImageTextItemView {
  key: string;
  title: string;
  content: ImageTextContentSegment[];
  useLeftside: boolean;
  media: ImageTextMedia;
}

export interface ImageTextSectionView {
  title: string;
  items: ImageTextItemView[];
}

interface ImageTextRawItem {
  title: string;
  front_image: string;
  content?: unknown;
  use_leftside?: unknown;
  front_is_screenshot?: unknown;
  front_use_player?: unknown;
}

function isImageTextRawItem(value: unknown): value is ImageTextRawItem {
  return isRecord(value) && typeof value.title === "string" && typeof value.front_image === "string";
}

// baseText.vue's v-html passthrough lets a pbImageText item's content embed
// raw markup, but every occurrence across content.json's actual data (the
// two press-release captions) is a single plain `<a href>...</a>` - so this
// parses just that one shortcode-like case into text/link segments instead of
// porting baseText's general shortcode engine.
const IMAGE_TEXT_LINK_PATTERN = /<a\s+[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;

function parseImageTextContent(raw: string): ImageTextContentSegment[] {
  const segments: ImageTextContentSegment[] = [];
  let lastIndex = 0;

  for (const match of raw.matchAll(IMAGE_TEXT_LINK_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ type: "text", text: raw.slice(lastIndex, index) });
    }
    segments.push({ type: "link", text: match[2], href: match[1] });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < raw.length) {
    segments.push({ type: "text", text: raw.slice(lastIndex) });
  }

  return segments;
}

// Ports snippetMedia.vue's detect_type: a front_image ending in "mp4" is a
// video, everything else (including an empty filename) falls back to image
// handling - "" specifically means "no media to render".
function getImageTextMediaFormat(filename: string): ImageTextMediaFormat {
  if (!filename) {
    return "";
  }
  return filename.toLowerCase().includes(".mp4") ? "video" : "image";
}

// Ports pbImageText.vue: a titled list of alternating image/text rows (an
// image-with-device-frame or a video, paired with a title/caption). Can
// appear more than once per project ("Initial Website", then "Highlights"
// on hospitalitypulse-inc); per PageBuilder's multi-instance contract this
// reads the dispatched section instead of find-first.
export function getImageTextSectionView(section: PageBuilderSection): ImageTextSectionView {
  const title = typeof section.title === "string" ? section.title : "";
  const rawItems = Array.isArray(section.list_image_text) ? section.list_image_text : [];

  const items: ImageTextItemView[] = rawItems.flatMap((raw, index): ImageTextItemView[] => {
    if (!isImageTextRawItem(raw)) {
      return [];
    }

    const filename = raw.front_image;
    return [
      {
        key: `image-text-${index}`,
        title: raw.title,
        content: parseImageTextContent(typeof raw.content === "string" ? raw.content : ""),
        useLeftside: raw.use_leftside === true,
        media: {
          filename,
          format: getImageTextMediaFormat(filename),
          isScreenshot: raw.front_is_screenshot === true,
          usePlayer: raw.front_use_player === true,
        },
      },
    ];
  });

  return { title, items };
}

export interface FeaturedSectionView {
  title: string;
  content: string;
  filename: string;
  usePlayer: boolean;
  autoplay: boolean;
}

// Ports pbFeatured.vue ("Archived Video"/"Archived Recording"): a titled
// centerpiece video of an old project demo recording. snippetMedia.vue (also
// pbImageText's media host) supports non-video images and an is_screenshot
// browser-chrome device frame too, but every pbFeatured block in real
// content.json data sets featured_content to an .mp4 and leaves
// is_screenshot false, so only the video path is ported here - reuses the
// same detect_type("mp4" -> video) rule as getImageTextMediaFormat rather
// than duplicating it. Can appear at most once per project in current data,
// but - like pbImageText/pbTriplet - reads the dispatched section rather
// than find-first, per PageBuilder's multi-instance contract.
export function getFeaturedSectionView(section: PageBuilderSection): FeaturedSectionView | undefined {
  const filename = typeof section.featured_content === "string" ? section.featured_content : "";
  if (getImageTextMediaFormat(filename) !== "video") {
    return undefined;
  }

  return {
    title: typeof section.title === "string" ? section.title : "",
    content: typeof section.content === "string" ? section.content.trim() : "",
    filename,
    usePlayer: section.use_player === true,
    autoplay: section.is_autoplay === true,
  };
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
