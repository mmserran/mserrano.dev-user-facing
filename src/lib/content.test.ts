import { describe, expect, it } from "vitest";
import { getHeaderLinks, getMediaUrl, getProjects, getResumeUrl } from "./content";

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
});
