<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Project: mserrano.dev frontend refactor (Vue/Gridsome → Next.js/React)

Design direction: Match the live site at mserrano.dev closely enough that visitors wouldn't notice a difference. The Gridsome frontend repo is available as reference — check it out alongside this one (or reference it read-only) to work from the actual markup/styling, not guesswork. Where practical, preserve the original CSS for distinctive/unique effects (e.g. animations) rather than rewriting from scratch — not a hard requirement, but nice to keep for legacy reasons. Port this into Tailwind's config (custom keyframes/animation utilities) to stay consistent with the pure-Tailwind constraint, rather than dropping in raw CSS files.

Page structure: Landing page, portfolio catalog, project page (individual project detail), contact page, resume page. URL structure must match the existing site exactly (same paths/slugs for every page, including portfolio project URLs) — this is an SEO requirement, not just a design preference. Anything that can't map 1:1 needs a redirect — since this is a static export (no Next.js server), redirects can't go through next.config.js; use vercel.json instead, since deploys go through Vercel directly.

Tech stack: TypeScript, pure Tailwind CSS (no CSS Modules/styled-components), Next.js with output: 'export'. Additional libraries added as needed (carousels needed for at least the project pages).

Data layer:

content.json is structured as a representation of each project (not a raw dump of WordPress post types) — so the Next.js data layer should be written against that project-shaped structure directly, not against generic WP REST post objects
manifest.json maps original media filenames to arrays of { width, path } responsive .webp variants
Both files, plus processed media, are restored into the repo at build time via make restore-media (pulls from GitHub Releases in the mmserran/mserrano-dev-web-services repo) — no live WordPress or network dependency during the Next.js build itself
Deploy via vercel deploy --prebuilt, not Vercel's Git integration (build must happen where the restored content lives)

Working style: Small, scoped chunks with review checkpoints between each — navbar, footer, and each page individually, with the project description page broken further into one task per page-builder component. Not a one-shot scaffold; stick to what's asked rather than expanding into adjacent components or pages. This is also the person's first agentic-coding-workflow project, so pacing deliberately to build a feel for how it plans/executes before handing it larger unsupervised chunks.