import { describe, expect, it } from "vitest";
import {
  filterProjects,
  formatRoundedDate,
  getCenterEmphasisCarousel,
  getFeaturedSectionView,
  getHeaderLinks,
  getImageTextSectionView,
  getMediaUrl,
  getMediaVariants,
  getMobileMosaic,
  getPageBuilderSections,
  getProjectBySlug,
  getProjectFilters,
  getProjects,
  getRelatedProjects,
  getTechnologyBreakdown,
  getResumeUrl,
  getTechnologyCarousel,
  getTripletSectionView,
  truncate,
  type PageBuilderSection,
  type Project,
} from "./content";

function getTripletBlocks(project: Project): PageBuilderSection[] {
  return getPageBuilderSections(project).filter((section) => section.type === "pbTriplet");
}

function getImageTextBlocks(project: Project): PageBuilderSection[] {
  return getPageBuilderSections(project).filter((section) => section.type === "pbImageText");
}

function getFeaturedBlocks(project: Project): PageBuilderSection[] {
  return getPageBuilderSections(project).filter((section) => section.type === "pbFeatured");
}

describe("content lib", () => {
  it("getHeaderLinks returns header links sorted by sort order", () => {
    const links = getHeaderLinks();
    expect(Array.isArray(links)).toBe(true);
    expect(links.length).toBeGreaterThan(0);

    for (let i = 0; i < links.length - 1; i++) {
      expect(links[i].sort).toBeLessThanOrEqual(links[i + 1].sort);
    }
  });

  it("getMediaUrl trims and encodes each filename segment", () => {
    expect(getMediaUrl(" reports/2026 résumé final.pdf ")).toBe(
      "/media/reports/2026%20r%C3%A9sum%C3%A9%20final.pdf",
    );
  });

  it("getMediaUrl rejects an empty filename", () => {
    expect(() => getMediaUrl(" \n ")).toThrow(
      "content.json resume.filename must not be empty.",
    );
  });

  it("getProjects returns projects sorted by date descending (most recent first)", () => {
    const projects = getProjects();
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);

    for (let i = 0; i < projects.length - 1; i++) {
      expect(projects[i].general.date.localeCompare(projects[i + 1].general.date)).toBeGreaterThanOrEqual(0);
    }
  });

  it("getResumeUrl returns the configured media URL", () => {
    expect(getResumeUrl()).toMatch(/^\/media\/[^ ]+$/);
  });

  it("getProjectFilters returns filters sorted by priority ascending", () => {
    const filters = getProjectFilters();
    expect(Array.isArray(filters)).toBe(true);
    expect(filters.length).toBeGreaterThan(0);

    for (let i = 0; i < filters.length - 1; i++) {
      expect(filters[i].priority).toBeLessThanOrEqual(filters[i + 1].priority);
    }
  });

  it("getMediaVariants resolves a known filename to its width variants", () => {
    const variants = getMediaVariants("WordPress.png");
    expect(variants.length).toBeGreaterThan(0);
    for (const variant of variants) {
      expect(variant.url.startsWith("/media/")).toBe(true);
    }
  });

  it("getMediaVariants returns an empty array for a blank or unknown filename", () => {
    expect(getMediaVariants("")).toEqual([]);
    expect(getMediaVariants("   ")).toEqual([]);
    expect(getMediaVariants("does-not-exist.png")).toEqual([]);
  });

  it("formatRoundedDate buckets months into Early/Mid/Late", () => {
    expect(formatRoundedDate("2020-01")).toBe("Early 2020");
    expect(formatRoundedDate("2020-04")).toBe("Early 2020");
    expect(formatRoundedDate("2020-05")).toBe("Mid 2020");
    expect(formatRoundedDate("2020-08")).toBe("Mid 2020");
    expect(formatRoundedDate("2020-09")).toBe("Late 2020");
    expect(formatRoundedDate("2020-12")).toBe("Late 2020");
  });

  it("truncate leaves short strings untouched and ellipsizes long ones", () => {
    expect(truncate("short", 120)).toBe("short");
    expect(truncate("a".repeat(10), 5)).toBe("aa...");
  });

  describe("filterProjects", () => {
    const projects = getProjects();

    it("returns every project when no filters are selected", () => {
      expect(filterProjects(projects, [])).toEqual(projects);
    });

    it("matches the live site's confirmed counts for a single technology filter", () => {
      expect(filterProjects(projects, ["shopify"])).toHaveLength(5);
    });

    it("combines multiple selected filters with OR/union, not AND", () => {
      const shopifyOnly = filterProjects(projects, ["shopify"]);
      const union = filterProjects(projects, ["shopify", "wordpress"]);
      expect(union.length).toBeGreaterThan(shopifyOnly.length);
      expect(union).toHaveLength(9);
    });

    it("matches projects by year embedded in the date", () => {
      expect(filterProjects(projects, ["2020"])).toHaveLength(2);
    });
  });

  describe("getRelatedProjects", () => {
    it("orders must-include picks first, then shared-workplace projects, then the rest by recency", () => {
      const project = getProjectBySlug("hospitalitypulse-inc") as Project;
      const related = getRelatedProjects(project);

      expect(related.title).toBe("Related");
      expect(related.projects.slice(0, 5).map((p) => p.slug)).toEqual([
        "pulsemobile",
        "pulsebooker-consumer-version",
        "pulselink",
        "pulsebooker-cro-version",
        "internal-console-2",
      ]);
    });

    it("never includes the project itself", () => {
      const project = getProjectBySlug("hospitalitypulse-inc") as Project;
      const related = getRelatedProjects(project);

      expect(related.projects.some((p) => p.value === project.value)).toBe(false);
    });

    it("matches a shared workplace tag in any candidate position", () => {
      const project = getProjectBySlug("cygnus-management-llc") as Project;
      const candidate = getProjects().find(
        (p) => p.value !== project.value && !p.general.workplace.some((tag) => project.general.workplace.includes(tag)),
      ) as Project;
      const originalWorkplaces = candidate.general.workplace;

      try {
        candidate.general.workplace = [originalWorkplaces[0], project.general.workplace[0]];

        expect(getRelatedProjects(project).projects[0]).toBe(candidate);
      } finally {
        candidate.general.workplace = originalWorkplaces;
      }
    });

    it("includes every other project when there is no editorial override", () => {
      const project = getProjectBySlug("cygnus-management-llc") as Project;
      const related = getRelatedProjects(project);

      expect(related.projects).toHaveLength(getProjects().length - 1);
    });

    it("skips a must-include reference that has no matching project instead of crashing", () => {
      const project = getProjectBySlug("hospitalitypulse-inc") as Project;
      const withBadOverride: Project = {
        ...project,
        pagebuilder: JSON.stringify([
          { type: "pbCarouselRelatedPosts", title: "Related", list_must_include: [{ value: "post:project:9999" }] },
        ]),
      };

      const related = getRelatedProjects(withBadOverride);
      expect(related.projects.every((p) => p !== undefined)).toBe(true);
    });

    it("returns an empty result when the project has no related-posts block", () => {
      const project = getProjectBySlug("hospitalitypulse-inc") as Project;
      const withoutBlock: Project = { ...project, pagebuilder: "[]" };

      expect(getRelatedProjects(withoutBlock)).toEqual({ title: "", projects: [] });
    });

    it("returns an empty result when pagebuilder fails to parse", () => {
      const project = getProjectBySlug("hospitalitypulse-inc") as Project;
      const malformed: Project = { ...project, pagebuilder: "not json" };

      expect(getRelatedProjects(malformed)).toEqual({ title: "", projects: [] });
    });
  });

  describe("getTechnologyBreakdown", () => {
    it("builds the weighted graph and four legend sections from the page-builder block", () => {
      const project = getProjectBySlug("mserrano-dev") as Project;
      const breakdown = getTechnologyBreakdown(project);

      expect(breakdown?.title).toBe("---");
      expect(breakdown?.graph.map((slice) => [slice.technology.title, slice.weight])).toEqual([
        ["JavaScript", 0.33],
        ["CSS3", 0.2],
        ["HTML5", 0.14],
        ["PHP", 0.33],
      ]);
      expect(breakdown?.legend.map((section) => section.title)).toEqual([
        "Scripts",
        "Template / Styles",
        "Server",
        "Dev Environment",
      ]);
      expect(
        breakdown?.legend.flatMap((section) =>
          section.entries.flatMap((entry) => [entry.technology, ...entry.children]),
        ).filter(Boolean),
      ).toHaveLength(new Set(Object.values(project.technology).flat()).size);
    });

    it("returns no breakdown for missing or malformed page-builder data", () => {
      const project = getProjectBySlug("mserrano-dev") as Project;

      expect(getTechnologyBreakdown({ ...project, pagebuilder: "[]" })).toBeUndefined();
      expect(getTechnologyBreakdown({ ...project, pagebuilder: "not json" })).toBeUndefined();
    });

    it("skips invalid weights and unknown filter references without crashing", () => {
      const project = getProjectBySlug("mserrano-dev") as Project;
      const pagebuilder = JSON.stringify([
        {
          type: "pbGraphBreakdown",
          complex_language: [
            {
              language__weight: "invalid",
              language__selection: [{ value: "term:language:5" }],
              complex_technology: [],
            },
            {
              language__weight: "50",
              language__selection: [{ value: "term:language:9999" }],
              complex_technology: [],
            },
          ],
        },
      ]);

      expect(getTechnologyBreakdown({ ...project, pagebuilder })?.graph).toEqual([]);
    });
  });

  describe("getTechnologyCarousel", () => {
    it("resolves only the flagged categories, in language/framework/deployment/software order", () => {
      const project = getProjectBySlug("cygnus-management-llc") as Project;
      const carousel = getTechnologyCarousel(project);

      expect(carousel.title).toBe("Exposed To");
      expect(carousel.technologies.map((t) => t.title)).toEqual(["Git", "GitHub", "Heroku", "Bash", "Windows"]);
    });

    it("skips a slug that has no matching project-filter instead of crashing", () => {
      const project = getProjectBySlug("cygnus-management-llc") as Project;
      const withBadSlug: Project = {
        ...project,
        technology: { ...project.technology, software: [...project.technology.software, "not-a-real-slug"] },
      };

      const carousel = getTechnologyCarousel(withBadSlug);
      expect(carousel.technologies.every((t) => t !== undefined)).toBe(true);
    });

    it("returns an empty result when the project has no technology-carousel block", () => {
      const project = getProjectBySlug("cygnus-management-llc") as Project;
      const withoutBlock: Project = { ...project, pagebuilder: "[]" };

      expect(getTechnologyCarousel(withoutBlock)).toEqual({ title: "", technologies: [] });
    });

    it("returns an empty result when pagebuilder fails to parse", () => {
      const project = getProjectBySlug("cygnus-management-llc") as Project;
      const malformed: Project = { ...project, pagebuilder: "not json" };

      expect(getTechnologyCarousel(malformed)).toEqual({ title: "", technologies: [] });
    });

    it("returns no technologies when every flagged category is empty", () => {
      const project = getProjectBySlug("cygnus-management-llc") as Project;
      const emptied: Project = {
        ...project,
        technology: { language: [], framework: [], deployment: [], software: [] },
      };

      expect(getTechnologyCarousel(emptied).technologies).toEqual([]);
    });
  });

  describe("getMobileMosaic", () => {
    it("returns the block's title and the project's own mobile screenshots", () => {
      const project = getProjectBySlug("cygnus-management-llc") as Project;
      const mosaic = getMobileMosaic(project);

      expect(mosaic.title).toBe("Mobile");
      expect(mosaic.screenshots).toEqual(project.screenshot.mobile);
      expect(mosaic.screenshots.length).toBeGreaterThan(0);
    });

    it("returns an empty result when the project has no mobile-mosaic block", () => {
      const project = getProjectBySlug("cygnus-management-llc") as Project;
      const withoutBlock: Project = { ...project, pagebuilder: "[]" };

      expect(getMobileMosaic(withoutBlock)).toEqual({ title: "", screenshots: [] });
    });

    it("returns an empty result when pagebuilder fails to parse", () => {
      const project = getProjectBySlug("cygnus-management-llc") as Project;
      const malformed: Project = { ...project, pagebuilder: "not json" };

      expect(getMobileMosaic(malformed)).toEqual({ title: "", screenshots: [] });
    });

    it("returns an empty screenshot list when the block is present but the project has none (e.g. mserrano-dev)", () => {
      const project = getProjectBySlug("mserrano-dev") as Project;

      expect(getMobileMosaic(project)).toEqual({ title: "Mobile", screenshots: [] });
    });
  });

  describe("getCenterEmphasisCarousel", () => {
    it("returns the block's title and each slide's screenshot, falling back to slide_mobile when unset", () => {
      const project = getProjectBySlug("cygnus-management-llc") as Project;
      const carousel = getCenterEmphasisCarousel(project);

      expect(carousel.title).toBe("A Complete Website");
      expect(carousel.slides.map((slide) => slide.title)).toEqual([
        "Home Page",
        "Services Page",
        "Pricing Page",
        "Contact Page",
      ]);
      expect(carousel.slides.every((slide) => slide.filename !== "")).toBe(true);
    });

    it("carries the block's rich-text content through unchanged", () => {
      const project = getProjectBySlug("hospitalitypulse-inc") as Project;
      const carousel = getCenterEmphasisCarousel(project);

      expect(carousel.content).toContain("<a href=");
    });

    it("skips a slide with neither a desktop nor mobile screenshot instead of returning a blank filename", () => {
      const project = getProjectBySlug("cygnus-management-llc") as Project;
      const withEmptySlide: Project = {
        ...project,
        pagebuilder: JSON.stringify([
          {
            type: "pbCarouselCenterEmphasis",
            title: "A Complete Website",
            content: "",
            list_slide: [
              { type: "slideDesktop", title: "Empty", slide_desktop: "", offset: "" },
              { type: "slideDesktop", title: "Home Page", slide_desktop: "screencapture-cygnusmgmt-desktop.jpg", offset: "" },
            ],
          },
        ]),
      };

      expect(getCenterEmphasisCarousel(withEmptySlide).slides.map((slide) => slide.title)).toEqual(["Home Page"]);
    });

    it("returns an empty result when the project has no center-emphasis-carousel block", () => {
      const project = getProjectBySlug("cygnus-management-llc") as Project;
      const withoutBlock: Project = { ...project, pagebuilder: "[]" };

      expect(getCenterEmphasisCarousel(withoutBlock)).toEqual({ title: "", content: "", slides: [] });
    });

    it("returns an empty result when pagebuilder fails to parse", () => {
      const project = getProjectBySlug("cygnus-management-llc") as Project;
      const malformed: Project = { ...project, pagebuilder: "not json" };

      expect(getCenterEmphasisCarousel(malformed)).toEqual({ title: "", content: "", slides: [] });
    });
  });

  describe("getPageBuilderSections", () => {
    it("returns the ordered pagebuilder array with types and payloads preserved", () => {
      const project = getProjectBySlug("cygnus-management-llc") as Project;
      const withSections: Project = {
        ...project,
        pagebuilder: JSON.stringify([
          { type: "pbHeader", title: "Intro" },
          { type: "pbTriplet", title: "Technology" },
          { type: "pbTriplet", title: "Usage vs Similar" },
          { type: "pbGraphBreakdown" },
        ]),
      };

      expect(getPageBuilderSections(withSections)).toEqual([
        { type: "pbHeader", title: "Intro" },
        { type: "pbTriplet", title: "Technology" },
        { type: "pbTriplet", title: "Usage vs Similar" },
        { type: "pbGraphBreakdown" },
      ]);
    });

    it("returns an empty array when pagebuilder is empty or malformed", () => {
      const project = getProjectBySlug("cygnus-management-llc") as Project;

      expect(getPageBuilderSections({ ...project, pagebuilder: "[]" })).toEqual([]);
      expect(getPageBuilderSections({ ...project, pagebuilder: "not json" })).toEqual([]);
    });
  });

  describe("getTripletSectionView", () => {
    it("resolves each itemTechnology entry to its project-filter, in list order", () => {
      const project = getProjectBySlug("cygnus-management-llc") as Project;
      const [technologyBlock] = getTripletBlocks(project);

      const view = getTripletSectionView(technologyBlock, project);

      expect(view.title).toBe("Technology");
      expect(view.items.map((item) => (item.type === "itemTechnology" ? item.technology.title : undefined))).toEqual([
        "Bootstrap",
        "AngularJS",
        "Django",
      ]);
    });

    it("resolves a canned-message shortcode in the section content to its plain text", () => {
      const project = getProjectBySlug("cygnus-management-llc") as Project;
      const [, usageBlock] = getTripletBlocks(project);

      // Live CMS content may leave this field empty; exercise the shortcode
      // path with an explicit payload so export drift does not hide resolver bugs.
      const view = getTripletSectionView(
        { ...usageBlock, content: '[canned msg="vs-similar"]' },
        project,
      );

      expect(view.title).toBe("Notable Technologies");
      expect(view.content).toBe("Striped bars represent similar technology used by my other projects.");
    });

    it("builds a proficiency card per deployment technology, with an active/first-used-here-aware statistic", () => {
      const project = getProjectBySlug("cygnus-management-llc") as Project;
      const [, usageBlock] = getTripletBlocks(project);

      const view = getTripletSectionView(usageBlock, project);
      const deployment = view.items.find(
        (item) => item.type === "itemGraph" && item.title === "Deployment",
      );
      expect(deployment?.type).toBe("itemGraph");
      if (deployment?.type !== "itemGraph") {
        throw new Error("expected an itemGraph view");
      }

      // Ordered by usage, descending - cygnus's deployment category has only
      // 3 technologies, so nothing gets capped here.
      expect(deployment.cards.map((card) => card.technology.slug)).toEqual(["git", "github", "heroku"]);
      const [git, github, heroku] = deployment.cards;

      // Git: highest usage in the category, still used within 2 years of the
      // portfolio's most recent project (2020), and cygnus-management-llc
      // (2014) is also its own first_year_used.
      expect(git.projects).toBe(12);
      expect(git.isHighProficiency).toBe(true);
      expect(git.isFirstUsedHere).toBe(true);
      expect(git.isActive).toBe(true);
      // "Version Control"'s portfolio-wide earliest use (2014, tied with Git
      // itself) rather than Git's own start date specifically.
      expect(git.statistic).toBe("Using Version Control since 2014");

      // GitHub: last used 2018, outside the 2-year active window - falls
      // back to its own real range instead of the trait-wide framing.
      expect(github.isActive).toBe(false);
      expect(github.isHighProficiency).toBe(false);
      expect(github.statistic).toBe("Version Control used 2014–2018");

      // Heroku: only ever used in cygnus-management-llc's own year (2014) -
      // a single-year, not a range.
      expect(heroku.isActive).toBe(false);
      expect(heroku.statistic).toBe("Hosting of choice in 2014");
    });

    it("caps a category at 4 cards, pinning first-used-here technologies even over higher-usage peers", () => {
      const project = getProjectBySlug("black-friday-2019") as Project;
      const [, usageBlock] = getTripletBlocks(project);

      const view = getTripletSectionView(usageBlock, project);
      const software = view.items.find((item) => item.type === "itemGraph" && item.title === "Software");
      expect(software?.type).toBe("itemGraph");
      if (software?.type !== "itemGraph") {
        throw new Error("expected an itemGraph view");
      }

      // The real category has 10 technologies; Composer and Yarn (both
      // first used in this project's own year, 2019) are pinned in even
      // though Apache2 (16) and VirtualBox (17) rank higher by usage.
      expect(software.cards).toHaveLength(4);
      expect(software.cards.map((card) => card.technology.slug)).toEqual(["bash", "linux", "yarn", "composer"]);
      expect(software.cards.filter((card) => card.isFirstUsedHere).map((card) => card.technology.slug)).toEqual([
        "yarn",
        "composer",
      ]);
      expect(software.cards.find((card) => card.isHighProficiency)?.technology.slug).toBe("bash");
    });

    it("caps pinned first-used-here technologies themselves when they exceed 4, and badges high proficiency among the displayed set", () => {
      const project = getProjectBySlug("hospitalitypulse-inc") as Project;
      const [, usageBlock] = getTripletBlocks(project);

      const view = getTripletSectionView(usageBlock, project);
      const deployment = view.items.find((item) => item.type === "itemGraph" && item.title === "Deployment");
      const software = view.items.find((item) => item.type === "itemGraph" && item.title === "Software");
      expect(deployment?.type).toBe("itemGraph");
      expect(software?.type).toBe("itemGraph");
      if (deployment?.type !== "itemGraph" || software?.type !== "itemGraph") {
        throw new Error("expected itemGraph views");
      }

      expect(deployment.cards).toHaveLength(4);
      expect(software.cards).toHaveLength(4);
      expect(deployment.cards.every((card) => card.isFirstUsedHere)).toBe(true);
      expect(software.cards.every((card) => card.isFirstUsedHere)).toBe(true);
      expect(deployment.cards.some((card) => card.isHighProficiency)).toBe(true);
      expect(software.cards.some((card) => card.isHighProficiency)).toBe(true);
    });

    it("returns no items when every item resolves to nothing", () => {
      const project = getProjectBySlug("cygnus-management-llc") as Project;
      const section: PageBuilderSection = {
        type: "pbTriplet",
        title: "Technology",
        content: "",
        list_triplet: [{ type: "itemTechnology", title: "", technology: [{ value: "term:framework:9999" }] }],
      };

      expect(getTripletSectionView(section, project).items).toEqual([]);
    });

    it("returns no items for a malformed or empty section", () => {
      const project = getProjectBySlug("cygnus-management-llc") as Project;

      expect(getTripletSectionView({ type: "pbTriplet" }, project).items).toEqual([]);
      expect(getTripletSectionView({ type: "pbTriplet", list_triplet: "not an array" }, project).items).toEqual([]);
    });
  });

  describe("getImageTextSectionView", () => {
    it("resolves each item's title, media, and useLeftside from a project's first pbImageText block", () => {
      const project = getProjectBySlug("hospitalitypulse-inc") as Project;
      const [initialWebsiteBlock] = getImageTextBlocks(project);

      const view = getImageTextSectionView(initialWebsiteBlock);

      expect(view.title).toBe("Initial Website");
      expect(view.items.map((item) => item.title)).toEqual([
        "A good website",
        "I took project ownership",
        "When I first came onboard",
      ]);

      const [screenshot, video1, video2] = view.items;
      expect(screenshot.useLeftside).toBe(false);
      expect(screenshot.media).toEqual({
        filename: "screencapture-hospitalitypulse-desktop-before-redesign.jpg",
        format: "image",
        isScreenshot: true,
        usePlayer: false,
      });

      expect(video1.useLeftside).toBe(true);
      expect(video1.media).toEqual({
        filename: "animation-hospitalitypulse-oldFadeInEffect.mp4",
        format: "video",
        isScreenshot: false,
        usePlayer: true,
      });

      expect(video2.useLeftside).toBe(false);
      expect(video2.media.format).toBe("video");
    });

    it("parses each item's plain-text content into a single text segment", () => {
      const project = getProjectBySlug("hospitalitypulse-inc") as Project;
      const [initialWebsiteBlock] = getImageTextBlocks(project);

      const view = getImageTextSectionView(initialWebsiteBlock);

      expect(view.items[0].content).toEqual([
        { type: "text", text: "The initial website was a simple single-page application up until early 2015." },
      ]);
    });

    it("returns an empty content array for an item with no caption", () => {
      const project = getProjectBySlug("hospitalitypulse-inc") as Project;
      const [, highlightsBlock] = getImageTextBlocks(project);

      const view = getImageTextSectionView(highlightsBlock);

      expect(view.title).toBe("Highlights");
      expect(view.items.every((item) => item.content.length === 0)).toBe(true);
    });

    it("splits an item's content around an embedded <a href> into text/link segments", () => {
      const project = getProjectBySlug("pulsebooker-consumer-version") as Project;
      const [pressReleasesBlock] = getImageTextBlocks(project);

      const view = getImageTextSectionView(pressReleasesBlock);
      const [hotelOnline] = view.items;

      expect(hotelOnline.content).toEqual([
        { type: "text", text: "Featured on " },
        {
          type: "link",
          text: "hotel-online.com",
          href: "https://www.hotel-online.com/press_releases/release/hospitalitypulse-unveils-powerful-technology-for-selling-room-features/",
        },
        { type: "text", text: "." },
      ]);
    });

    it("returns no items for a malformed or empty section", () => {
      expect(getImageTextSectionView({ type: "pbImageText" }).items).toEqual([]);
      expect(getImageTextSectionView({ type: "pbImageText", list_image_text: "not an array" }).items).toEqual([]);
      expect(getImageTextSectionView({ type: "pbImageText", list_image_text: [{ front_image: "x.jpg" }] }).items).toEqual(
        [],
      );
    });
  });

  describe("getFeaturedSectionView", () => {
    it("resolves title, filename, and playback flags from a project's pbFeatured block", () => {
      const project = getProjectBySlug("pulsemobile") as Project;
      const [block] = getFeaturedBlocks(project);

      const view = getFeaturedSectionView(block);

      expect(view).toEqual({
        title: "Archived Video",
        content: "",
        filename: "pulsemobile_video.mp4",
        usePlayer: true,
        autoplay: false,
      });
    });

    it("trims a non-empty content caption", () => {
      const view = getFeaturedSectionView({
        type: "pbFeatured",
        title: "Archived Video",
        content: "  A demo recording.  ",
        featured_content: "demo.mp4",
        is_autoplay: false,
        use_player: true,
      });

      expect(view?.content).toBe("A demo recording.");
    });

    it("returns undefined when featured_content isn't a video", () => {
      expect(
        getFeaturedSectionView({ type: "pbFeatured", title: "Archived Video", featured_content: "screenshot.jpg" }),
      ).toBeUndefined();
      expect(getFeaturedSectionView({ type: "pbFeatured", title: "Archived Video" })).toBeUndefined();
      expect(getFeaturedSectionView({ type: "pbFeatured", featured_content: "" })).toBeUndefined();
    });
  });
});
