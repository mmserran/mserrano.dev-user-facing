<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project

**Project:** mserrano.dev frontend refactor (Vue/Gridsome → Next.js/React)

## Primary Goal

Recreate the existing site so closely that returning visitors would not notice a difference. Preserve existing visual design, interactions, navigation, and information architecture unless explicitly instructed otherwise.

---

# Decision Hierarchy

When making implementation decisions, follow this order:

1. Explicit user instructions
2. This AGENTS.md
3. The live site (canonical behavior and UX)
4. The Gridsome frontend (implementation reference)
5. Framework and library best practices

When these conflict, follow the highest-priority source. If requirements are ambiguous, ask rather than guess.

**Tooling note:** live-site inspection tooling (browser access, screenshots) is not yet configured. Until it is, treat the Gridsome source (#4) as the practical primary reference, and flag anything where you can't confirm live-site behavior without it.

**Reference repo:** The Gridsome frontend is available at `../mserrano.net-user-facing` (a separate repo outside this one). Treat it as read-only. Consult it directly rather than working from memory or description.

---

# Hard Requirements

## Site Structure

The site consists of:

- Landing page
- Portfolio catalog
- Individual project pages
- Resume page
- Contact page

Implement only the requested scope.

## URLs

This is an SEO-sensitive migration.

- Preserve every existing URL and portfolio slug. Original slugs are confirmed present in `content.json`'s project entries — use them as-is, do not regenerate or reformat.
- Any unavoidable URL changes require redirects in `vercel.json` (not `next.config.ts`) because the site uses `output: "export"`.

## Data

- Build against `content.json`, which represents project data directly—not raw WordPress REST responses.
- `manifest.json` maps original media filenames to responsive WebP variants.
- Restored files land at: `public/media/` for processed images, `content/` for content.json + manifest.json.
- Render images using the width variants listed in `manifest.json` (via `srcset`/responsive `<img>`/`<Image>` usage), not a single fixed-size source. This is the whole point of the manifest — don't collapse it to one file per image.

Do not introduce live WordPress or other network dependencies into the build.

## Contact Page

- Use a `mailto:` link generated from the contact form fields, with subject/body prepopulated from the user's entered values.
- No serverless form handling, no API route, no third-party form service — this must work under a fully static export with zero backend dependency.

## Tech Stack

- TypeScript
- Next.js
- Tailwind CSS
- `output: "export"`

Avoid CSS Modules, CSS-in-JS, or other styling approaches unless explicitly requested. Prefer expressing reused styles (including animations from the Gridsome implementation) through Tailwind configuration — custom keyframes and animation utilities — rather than standalone CSS files. When reproducing existing functionality or styling, consult the Gridsome implementation first rather than designing a new solution from scratch.

Additional libraries are acceptable when they meaningfully simplify non-trivial functionality (for example, carousels).

---

# Build & Deployment

Restore build content locally:

```bash
make restore-media
```

Restores `content.json`, `manifest.json`, and processed media assets.

Deploy:

```bash
vercel deploy --prebuilt
```

Built outside Vercel's Git integration — restored assets exist only in the local build environment.

---

# Working Style

Work in small, reviewable increments.

Preferred task sizes include:

- navbar
- footer
- one page at a time
- one page-builder component at a time

Avoid speculative abstractions, unsolicited refactors, or scaffolding adjacent features. Stop after completing the requested scope.

---

# Definition of Done

A task is complete when:

- The requested scope is implemented.
- TypeScript and linting pass.
- Static export succeeds.
- No unrelated files were modified.
- The changes are ready for review.