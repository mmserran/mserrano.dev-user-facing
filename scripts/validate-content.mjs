#!/usr/bin/env node
// Validates the restored content/content.json against the shape
// src/lib/content.ts expects, independently of the Next.js app itself.
// This runs as a standalone build-time check (not imported by any
// component) specifically so zod never ends up in the client bundle -
// several "use client" components import runtime helpers from
// src/lib/content.ts, so validating inline there would ship the
// validator to every visitor's browser for a check that only matters
// once, at build time.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { z } from "zod";

const HeaderLinkSchema = z.object({
  id: z.number(),
  sort: z.number(),
  title: z.string(),
  url: z.string(),
  parent: z.string(),
});

const ProjectGeneralSchema = z.object({
  date: z.string(),
  role: z.string(),
  title: z.string(),
  content: z.string(),
  url: z.string(),
  url_wayback: z.string(),
  repo: z.string(),
  workplace: z.array(z.string()),
  supported_browsers: z.array(z.string()),
});

const ProjectThumbnailSchema = z.object({
  static: z.string(),
  on_hover: z.string(),
});

const ProjectTechnologySchema = z.object({
  language: z.array(z.string()),
  framework: z.array(z.string()),
  deployment: z.array(z.string()),
  software: z.array(z.string()),
});

const ProjectScreenshotSchema = z.object({
  desktop: z.array(z.string()),
  desktop_cutoff: z.string().nullable().optional(),
  mobile: z.array(z.string()),
});

const ProjectSchema = z.object({
  sort: z.number(),
  slug: z.string(),
  value: z.string(),
  general: ProjectGeneralSchema,
  thumbnail: ProjectThumbnailSchema,
  technology: ProjectTechnologySchema,
  screenshot: ProjectScreenshotSchema,
  pagebuilder: z.string(),
});

const ProjectFilterStatsSchema = z.object({
  usage: z.number(),
  first_year_used: z.number(),
});

const ProjectFilterSchema = z.object({
  slug: z.string(),
  value: z.string(),
  title: z.string(),
  url: z.string(),
  affinity: z.string(),
  is_square: z.boolean(),
  is_full_color: z.boolean(),
  primary: z.string(),
  secondary: z.string(),
  image: z.string(),
  alias: z.array(z.string()),
  priority: z.number(),
  // content.ts's primaryTraitSlug() already guards each entry with
  // Boolean(slug), because real content.json data includes null here.
  list_trait: z.array(z.string().nullable()),
  stats: ProjectFilterStatsSchema,
});

const CannedMessageSchema = z.object({
  title: z.string(),
  content: z.string(),
});

const TraitSchema = z.object({
  slug: z.string(),
  value: z.string(),
  title: z.string(),
});

const ContentSchema = z.object({
  "nav-header": z.array(HeaderLinkSchema),
  projects: z.array(ProjectSchema),
  "project-filters": z.array(ProjectFilterSchema),
  traits: z.array(TraitSchema),
  resume: z.object({
    filename: z.string(),
    contact_email: z.string(),
  }),
  "theme-options/canned-msgs": z.array(CannedMessageSchema),
});

const contentPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "content",
  "content.json",
);

let data;
try {
  data = JSON.parse(readFileSync(contentPath, "utf-8"));
} catch (error) {
  console.error(`Could not read or parse ${contentPath}:`);
  console.error(error.message);
  process.exit(1);
}

const result = ContentSchema.safeParse(data);

if (!result.success) {
  console.error(
    "content.json does not match the shape src/lib/content.ts expects:\n",
  );
  console.error(z.prettifyError(result.error));
  process.exit(1);
}

console.log("content.json shape OK.");
