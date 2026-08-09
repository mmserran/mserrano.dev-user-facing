<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

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

## Reference Implementation

The Gridsome frontend is available at:

```text
../mserrano.net-user-facing
```

Treat it as read-only. Consult it directly rather than relying on memory or previous implementations.

---

# Implementation Requirements

## Tech Stack

* TypeScript
* Next.js
* Tailwind CSS
* `output: "export"`

Avoid CSS Modules, CSS-in-JS, or other styling approaches unless explicitly requested.

Prefer expressing reused styles (including animations from the Gridsome implementation) through Tailwind configuration—custom keyframes and animation utilities—rather than standalone CSS files.

When reproducing existing functionality or styling, consult the Gridsome implementation first rather than designing a new solution from scratch.

Additional libraries are acceptable when they meaningfully simplify non-trivial functionality (for example, carousels).

## Site Structure

The site consists of:

* Landing page
* Portfolio catalog
* Individual project pages
* Resume page
* Contact page

Implement only the requested scope.

## URLs

This is an SEO-sensitive migration.

* Preserve every existing URL and portfolio slug. Original slugs are confirmed present in `content.json`'s project entries—use them as-is; do not regenerate or reformat.
* Canonical public URLs use a trailing slash (`next.config.ts` `trailingSlash: true`), matching the prior Gridsome site. Keep new routes, links, and `metadata.alternates.canonical` values on that form.
* Redirects belong in `vercel.json` (not `next.config.ts`) because the site uses `output: "export"`. That includes bare-path → trailing-slash 301s. `scripts/assemble-vercel-output.mjs` embeds those redirects into the prebuilt Build Output routes (see the script header)—`vercel.json` alone is not applied when deploying with `--prebuilt`.

## Data

* Build against `content.json`, which represents project data directly—not raw WordPress REST responses.
* `manifest.json` maps original media filenames to responsive WebP variants.
* Restored files land at:

  * `public/media/` for processed images
  * `content/` for `content.json` and `manifest.json`
* Render images using the width variants listed in `manifest.json` (`srcset`, responsive `<img>`, or `<Image>`), not a single fixed-size source.

Do not introduce live WordPress or other network dependencies into the build.

## Contact Page

* Use a `mailto:` link generated from the contact form fields, with subject and body prepopulated from the user's entered values.
* No serverless form handling, API routes, or third-party form services. The site must function under a fully static export with zero backend dependency.

## Cross-Browser, Responsive & Accessibility

All UI changes must render correctly in current Chrome, Firefox, Safari, and Edge; adapt responsively across mobile, tablet, and desktop viewports; and meet WCAG 2.1 AA accessibility standards (semantic HTML, keyboard operability, sufficient contrast, labeled form fields).

---

# Working Style

Work in small, reviewable increments.

Preferred task sizes include:

* Navbar
* Footer
* One page at a time
* One page-builder component at a time

Avoid speculative abstractions, unsolicited refactors, or scaffolding adjacent features.

Stop after completing the requested scope.

---

# Git Commit Trailers

Add authorship with `git commit --trailer "Co-Authored-By: [ToolName] [Model] <[identifier]>"`.

Substitute `<[identifier]>` with your AI tool's official service email address (e.g., `noreply@openai.com` for Codex or `gemini-code-assist@google.com` for Gemini models).

---

# Browser Tooling

Use the repository browser wrapper for all browser automation:

```bash
./scripts/browser <command>
```

## Standard Workflow

1. Ensure the application is running.
2. Open the target page.
3. Inspect the page using accessibility snapshots.
4. Interact using element references from the latest snapshot.
5. Capture screenshots only when visual verification is required.
6. Check browser console messages and failed network requests when debugging.
7. Save browser artifacts under `artifacts/browser/`.
8. Close the browser session when finished.

## Browser Guidelines

* Prefer accessibility snapshots for navigation, interaction, and reading page content.
* Capture screenshots only when visual confirmation is required.
* Use screenshots for visual verification, responsive layouts, rendering issues, and documenting defects.
* Do not claim a UI change is visually correct unless it has been inspected in the browser.
* Keep browser interactions deterministic and reproducible.
* Use the repository browser wrapper instead of invoking browser tools directly.
* Only `screenshot` gets automatic artifact path handling. Other save-as commands (`pdf`, `video-start`, `state-save`, `tracing-start`/`tracing-stop`) fall back to Playwright CLI's own defaults under the gitignored `.playwright-cli/`, not `artifacts/browser/` — pass an explicit filename under `artifacts/browser/<type>/` if the artifact needs to be kept.
* Browser sessions are backed by a persistent background process and are not cleaned up automatically. A session left open by a prior task (or one that ended abruptly without step 8) keeps running and can be picked up unintentionally by a later task. If a session appears to have unexpected state, run `./scripts/browser list` to check what's open and `./scripts/browser kill-all` to clear stale/zombie sessions.

@~/.config/shipyard/AGENTS.md

---

# Validation

Before considering a task complete:

* Run TypeScript checks.
* Run linting.
* Verify affected pages in the browser.
* Capture screenshots when visual changes were made.
* Confirm the static export succeeds.

---

# Build & Deployment

Restore build content before any production build (locally or in CI):

```bash
make restore-media
```

Restores `content.json`, `manifest.json`, and processed media assets into
gitignored `content/` and `public/media/`, then runs `npm run validate-content`
and fails loudly if the restored `content.json`'s shape doesn't match what
`src/lib/content.ts` expects. That restore needs a GitHub token that can
download the private content-export release—Vercel's own build environment
does not have it. Restoring the default `content-latest` tag also records the
resolved dated tag into `CONTENT_VERSION`.

Do not enable or rely on Vercel Git integration for this project. Deploys run in
GitHub Actions after restore via `vercel env pull` (static export bakes
`NEXT_PUBLIC_*` at `npm run build` time; plain builds do not see Vercel project
env otherwise) + `next build` + `scripts/assemble-vercel-output.mjs` +
`vercel deploy --prebuilt` (see `.github/workflows/deploy.yml` and the README
"Deploy on Vercel" section for branch and domain mapping). Do not use
`vercel build`; hand-assemble from `out/` instead (see the script header for
why). Project env vars live only on the Vercel project—never commit them;
local onboarding is `vercel link` + `vercel env pull` (README Getting Started).
`e2e.yml` runs the same content validation on every pull request.

Production restores whatever tag is pinned in `CONTENT_VERSION`, independent of
`development`'s always-latest content; promote a content-only change with
`make promote-content "description"`. If a change depends on a new
`content.json` shape, don't use `make promote-content`—commit the
`CONTENT_VERSION` pin written by `make restore-media` (or set it manually)
inside the same code PR so the matching code and content tag land in `main`
together. `make sync` manually triggers a staging deploy when a new content
release should reach `stage.mserrano.dev` without a code push.

All PRs into `main` are squash-merged. Squashing never records `development`'s
tip as a parent of `main`, so `main` and `development` keep sharing only their
original common ancestor—every later `development`→`main` PR would otherwise
re-list the same already-merged commits and files, growing without bound.
`.github/workflows/sync-main-to-development.yml` prevents that: on every push
to `main` it merges `main` back into `development` (a real merge commit, not a
rewrite) and pushes. That merge is expected to be a no-op diff—it exists only
to reset the shared ancestor—so future sync PRs start clean. Open or refresh
the development→main sync PR with `make deploy-prod` (local
`scripts/open-sync-pr.sh`, not a GitHub Actions workflow); the squash-merge
into `main` stays manual. Only this merge-back step is automated by workflow.

---

# Definition of Done

A task is complete when:

* The requested scope is implemented.
* Validation passes.
* No unrelated files were modified.
* The changes are ready for review.
