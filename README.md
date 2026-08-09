# mserrano.dev-user-facing
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Install dependencies, link this directory to the Vercel project, and pull
environment variables into a local (gitignored) `.env.local`:

```bash
npm ci
vercel link
vercel env pull
```

Project env vars (for example `NEXT_PUBLIC_GA_MEASUREMENT_ID`) live on the
Vercel project—not committed to the repo. `vercel env pull` is the source of
truth for local setup; it rewrites `.env.local` and also writes a short-lived
`VERCEL_OIDC_TOKEN` for Vercel service auth. Re-run pull after ~12 hours if
that token expires, or whenever project env vars change.

Restore content and media, then run the development server:

```bash
make restore-media
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Run the co-located Vitest suite once with `npm test`, or start it in watch mode with
`npm run test:watch`.

## End-to-end tests

The Playwright suite runs against the production static export in `out/`. Playwright
builds the site, starts and stops the local static server, and runs the Chromium
project automatically.

Install Chromium once after installing dependencies:

```bash
npx playwright install chromium
```

Restore the ignored build content, then run the suite:

```bash
make restore-media
npm run test:e2e
```

The suite owns port `4173` and will not reuse an existing server. If that port is
already occupied, choose another one for the run:

```bash
E2E_PORT=4174 npm run test:e2e
```

Tests live in `e2e/`. Prefer user-facing roles, labels, and text over CSS selectors,
and keep feature-specific setup in the feature's spec until reuse is demonstrated.
Useful development commands are:

```bash
npm run test:e2e:ui
npm run test:e2e:debug
npm run test:e2e:report
```

Failed tests retain a trace, screenshot, and video under `test-results/`. The HTML
report is written to `playwright-report/`. Both directories are generated and
gitignored.

Use `./scripts/browser` for exploratory inspection and visual verification. Use the
Playwright Test suite for repeatable assertions that should run locally and in CI.

The suite runs in CI via `.github/workflows/e2e.yml` on every pull request.

The landing page composition lives in `src/app/page.tsx`. Its endcap illustration is in
`src/components/illustration/EndcapShell.tsx`, while the shared app shell renders the star-field
backdrop from `src/components/illustration/StarField.tsx`. The page auto-updates as you edit these
files.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load Montserrat site-wide.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

Deploys are not driven by Vercel's native Git integration. Content and media under
`content/` and `public/media/` are gitignored and restored only via
`make restore-media` (private release download), so GitHub Actions builds the site
and hands prebuilt output to Vercel. Every restore also runs `npm run
validate-content`, which fails the build loudly if `content.json`'s shape doesn't
match what `src/lib/content.ts` expects.

`.github/workflows/deploy.yml` deploys by branch (on push, or via `make sync` / `workflow_dispatch`):

| Branch        | Content source          | Result                                          |
| -------------- | ------------------------ | ------------------------------------------------ |
| `development` | `content-latest`         | preview build, aliased to `stage.mserrano.dev`    |
| `main`        | pinned `CONTENT_VERSION` | production build (`--prod`), aliased to `mserrano.dev` |

| Command                                | Action                                                                          |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| `make restore-media`                   | Restore content/media locally; validates shape and updates `CONTENT_VERSION`   |
| `make sync`                             | Trigger a `development` staging deploy, watch the Actions run until it finishes, and print failed-step logs on error |
| `make deploy-prod`                      | Open or refresh the development→main sync PR with an auto-generated summary of PRs merged into development since the last sync; does not merge (squash-merge into `main` stays manual) |
| `make promote-content "description"`   | Dispatch `promote-content.yml` to open a PR bumping `CONTENT_VERSION`, watch the Actions run until it finishes, print failed-step logs on error, and print the PR URL (or note that main already pinned the tag) |
