import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import rawContent from "../../content/content.json";

describe("sitemap.xml", () => {
  it("exists in public directory", () => {
    const sitemapPath = path.resolve(process.cwd(), "public", "sitemap.xml");
    expect(existsSync(sitemapPath)).toBe(true);
  });

  it("contains all static pages and project URLs", () => {
    const sitemapPath = path.resolve(process.cwd(), "public", "sitemap.xml");
    const xml = readFileSync(sitemapPath, "utf-8");

    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');

    const expectedStaticUrls = [
      "https://mserrano.dev/",
      "https://mserrano.dev/projects/",
      "https://mserrano.dev/resume/",
      "https://mserrano.dev/contact/",
    ];

    for (const url of expectedStaticUrls) {
      expect(xml).toContain(`<loc>${url}</loc>`);
    }

    const projects = (rawContent as { projects: Array<{ slug: string }> }).projects;
    for (const project of projects) {
      expect(xml).toContain(`<loc>https://mserrano.dev/projects/${project.slug}/</loc>`);
    }
  });
});
