import {
  getContactEmail,
  getHeaderLinks,
  getMediaVariants,
  type Project,
} from "@/lib/content";

export const SITE_ORIGIN = "https://mserrano.dev";

export type JsonLdObject = Record<string, unknown>;

// Serialize for a JSON-LD <script> tag. Escapes `<` so project copy or titles
// can't break out of the script context (Next.js JSON-LD guide).
export function serializeJsonLd(data: JsonLdObject): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function getSiteJsonLd(): JsonLdObject {
  // Mirrors the Gridsome frontend's site-wide WebSite + SearchAction block in
  // src/main.js. Portfolio filters already live at /projects/?q=…
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Mark Anthony Serrano Portfolio Website",
    url: `${SITE_ORIGIN}/`,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_ORIGIN}/projects/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

function getSameAsUrls(): string[] {
  return getHeaderLinks()
    .map((link) => link.url.trim())
    .filter((url) => /^https?:\/\//i.test(url));
}

export function getPersonJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Mark Anthony Serrano",
    url: `${SITE_ORIGIN}/`,
    jobTitle: "Software Engineer",
    description:
      "Software engineer specializing in WordPress and Shopify development.",
    email: `mailto:${getContactEmail()}`,
    sameAs: getSameAsUrls(),
  };
}

function getProjectImageUrl(project: Project): string | undefined {
  const variants = getMediaVariants(project.thumbnail.static);
  if (variants.length === 0) {
    return undefined;
  }

  const largest = variants.reduce((best, variant) =>
    (variant.width ?? 0) > (best.width ?? 0) ? variant : best,
  );

  return `${SITE_ORIGIN}${largest.url}`;
}

export function getCreativeWorkJsonLd(project: Project): JsonLdObject {
  const description =
    project.general.content.trim() ||
    `View details for ${project.general.title}.`;
  const image = getProjectImageUrl(project);
  const datePublished = project.general.date.trim() || undefined;

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.general.title,
    description,
    url: `${SITE_ORIGIN}/projects/${project.slug}/`,
    ...(datePublished ? { datePublished } : {}),
    ...(image ? { image } : {}),
    author: {
      "@type": "Person",
      name: "Mark Anthony Serrano",
      url: `${SITE_ORIGIN}/`,
    },
  };
}
