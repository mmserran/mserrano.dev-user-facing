import { describe, expect, it } from "vitest";
import {
  filterProjects,
  formatRoundedDate,
  getHeaderLinks,
  getMediaUrl,
  getMediaVariants,
  getProjectBySlug,
  getProjectFilters,
  getProjects,
  getRelatedProjects,
  getResumeUrl,
  truncate,
  type Project,
} from "./content";

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
});
