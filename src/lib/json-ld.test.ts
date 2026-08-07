import { describe, expect, it } from "vitest";
import {
  getCreativeWorkJsonLd,
  getPersonJsonLd,
  getSiteJsonLd,
  serializeJsonLd,
  SITE_ORIGIN,
} from "./json-ld";
import { getProjectBySlug } from "./content";

describe("json-ld", () => {
  it("escapes angle brackets when serializing", () => {
    expect(serializeJsonLd({ name: "a <b> tag" })).toBe(
      '{"name":"a \\u003cb> tag"}',
    );
  });

  it("builds a WebSite SearchAction graph matching live behavior", () => {
    const jsonLd = getSiteJsonLd();
    expect(jsonLd["@type"]).toBe("WebSite");
    expect(jsonLd.url).toBe(`${SITE_ORIGIN}/`);
    expect(jsonLd.potentialAction).toEqual({
      "@type": "SearchAction",
      target: `${SITE_ORIGIN}/projects/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    });
  });

  it("builds a Person graph with social profiles from header links", () => {
    const jsonLd = getPersonJsonLd();
    expect(jsonLd["@type"]).toBe("Person");
    expect(jsonLd.name).toBe("Mark Anthony Serrano");
    expect(jsonLd.url).toBe(`${SITE_ORIGIN}/`);
    expect(jsonLd.email).toMatch(/^mailto:/);
    expect(jsonLd.sameAs).toEqual(
      expect.arrayContaining([
        "https://www.linkedin.com/in/serrano2",
        "https://github.com/mmserran",
      ]),
    );
  });

  it("builds a CreativeWork graph for a project", () => {
    const project = getProjectBySlug("cygnus-management-llc");
    expect(project).toBeDefined();
    if (!project) return;

    const jsonLd = getCreativeWorkJsonLd(project);
    expect(jsonLd["@type"]).toBe("CreativeWork");
    expect(jsonLd.name).toBe("Cygnus Management, LLC");
    expect(jsonLd.url).toBe(`${SITE_ORIGIN}/projects/cygnus-management-llc/`);
    expect(jsonLd.datePublished).toBe(project.general.date);
    expect(jsonLd.description).toContain("My uncle needed a website");
    expect(jsonLd.author).toEqual({
      "@type": "Person",
      name: "Mark Anthony Serrano",
      url: `${SITE_ORIGIN}/`,
    });
    if (typeof jsonLd.image === "string") {
      expect(jsonLd.image.startsWith(`${SITE_ORIGIN}/media/`)).toBe(true);
    }
  });
});
