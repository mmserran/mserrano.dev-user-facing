import { describe, expect, it, vi } from "vitest";
import { getHeaderLinks, getResumeUrl } from "./content";

describe("content lib", () => {
  it("getHeaderLinks returns header links sorted by sort order", () => {
    const links = getHeaderLinks();
    expect(Array.isArray(links)).toBe(true);
    expect(links.length).toBeGreaterThan(0);

    for (let i = 0; i < links.length - 1; i++) {
      expect(links[i].sort).toBeLessThanOrEqual(links[i + 1].sort);
    }
  });

  it("getResumeUrl encodes filename segments and prefixes with /media/", () => {
    const url = getResumeUrl();
    expect(url).toMatch(/^\/media\//);
    expect(url).not.toContain(" ");
  });
});
