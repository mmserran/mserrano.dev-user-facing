#!/usr/bin/env node
// Assembles a Vercel Build Output API v3 deployment directly from the
// Next.js static export (out/), bypassing `vercel build`'s own Next.js
// integration entirely.
//
// That integration currently detects this project's framework/version fine
// but doesn't handle this Next.js version's static-export file format (the
// __next.*.txt metadata files) - it silently copies none of the actual
// exported pages into .vercel/output/static, only the untouched public/
// assets pass through unmodified, so every route 404s once deployed. Since
// `output: "export"` already produces a complete, self-contained static
// site, hand-assembling the Build Output API directly sidesteps that gap
// and keeps working regardless of which Next.js version is in use.
//
// `vercel deploy --prebuilt` serves only `.vercel/output`, so platform
// config in vercel.json is not applied automatically. This script maps
// vercel.json redirects into Build Output API routes (before the 404
// handler) so SEO redirects (for example bare path → trailing slash)
// ship with every prebuilt deploy.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "out");
const outputDir = path.join(root, ".vercel", "output");
const staticDir = path.join(outputDir, "static");

function toBuildOutputRoute({ source, destination, statusCode }) {
  let captureIndex = 0;
  const parameterIndexes = new Map();
  const src = source.replace(/:([A-Za-z][A-Za-z0-9_]*)/g, (_match, name) => {
    captureIndex += 1;
    parameterIndexes.set(name, captureIndex);
    return "([^/]+)";
  });
  const location = destination.replace(
    /:([A-Za-z][A-Za-z0-9_]*)/g,
    (_match, name) => `$${parameterIndexes.get(name)}`,
  );

  return {
    src: `^${src}$`,
    status: statusCode,
    headers: { Location: location },
  };
}

if (!existsSync(outDir)) {
  console.error(`${outDir} does not exist - run \`npm run build\` first.`);
  process.exit(1);
}

const { dependencies } = JSON.parse(readFileSync(path.join(root, "package.json"), "utf-8"));
const { redirects = [] } = JSON.parse(readFileSync(path.join(root, "vercel.json"), "utf-8"));

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(staticDir, { recursive: true });
cpSync(outDir, staticDir, { recursive: true });

writeFileSync(
  path.join(outputDir, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [
        ...redirects.map(toBuildOutputRoute),
        { handle: "error" },
        { src: "^(?!/api).*$", status: 404, dest: "/404.html" },
      ],
      framework: { slug: "nextjs", version: dependencies.next },
    },
    null,
    2,
  ),
);

console.log(`Assembled .vercel/output/static from ${path.relative(root, outDir)}`);
