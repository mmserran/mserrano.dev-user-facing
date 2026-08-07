import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vercelJson = JSON.parse(
  readFileSync(path.join(root, "vercel.json"), "utf-8"),
) as {
  redirects: Array<{
    source: string;
    destination: string;
    statusCode: number;
  }>;
};

const fixtureRoots: string[] = [];

afterEach(() => {
  for (const dir of fixtureRoots.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("trailing-slash redirects (vercel.json)", () => {
  it("declares 301 redirects from bare paths to trailing-slash URLs", () => {
    expect(vercelJson.redirects).toEqual([
      { source: "/contact", destination: "/contact/", statusCode: 301 },
      { source: "/projects", destination: "/projects/", statusCode: 301 },
      {
        source: "/projects/:slug",
        destination: "/projects/:slug/",
        statusCode: 301,
      },
      { source: "/resume", destination: "/resume/", statusCode: 301 },
    ]);
  });
});

describe("assemble-vercel-output.mjs redirect routes", () => {
  it("maps vercel.json redirects into Build Output API routes ahead of the 404 handler", () => {
    const fixture = mkdtempSync(path.join(tmpdir(), "assemble-vercel-"));
    fixtureRoots.push(fixture);

    const outDir = path.join(fixture, "out");
    const outputDir = path.join(fixture, ".vercel", "output");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(path.join(outDir, "index.html"), "<html></html>\n");

    const scriptSource = readFileSync(
      path.join(root, "scripts", "assemble-vercel-output.mjs"),
      "utf-8",
    ).replace(
      'const root = path.resolve(import.meta.dirname, "..");',
      `const root = ${JSON.stringify(fixture)};`,
    );

    // Copy package.json + vercel.json so the script can read real project data.
    writeFileSync(
      path.join(fixture, "package.json"),
      readFileSync(path.join(root, "package.json"), "utf-8"),
    );
    writeFileSync(
      path.join(fixture, "vercel.json"),
      readFileSync(path.join(root, "vercel.json"), "utf-8"),
    );

    const scriptPath = path.join(fixture, "assemble-vercel-output.mjs");
    writeFileSync(scriptPath, scriptSource);
    execFileSync(process.execPath, [scriptPath], { cwd: fixture });

    expect(existsSync(path.join(outputDir, "static", "index.html"))).toBe(true);

    const config = JSON.parse(
      readFileSync(path.join(outputDir, "config.json"), "utf-8"),
    ) as {
      routes: Array<Record<string, unknown>>;
    };

    expect(config.routes.slice(0, 4)).toEqual([
      {
        src: "^/contact$",
        status: 301,
        headers: { Location: "/contact/" },
      },
      {
        src: "^/projects$",
        status: 301,
        headers: { Location: "/projects/" },
      },
      {
        src: "^/projects/([^/]+)$",
        status: 301,
        headers: { Location: "/projects/$1/" },
      },
      {
        src: "^/resume$",
        status: 301,
        headers: { Location: "/resume/" },
      },
    ]);
    expect(config.routes.at(-1)).toMatchObject({
      src: "^(?!/api).*$",
      status: 404,
      dest: "/404.html",
    });
  });
});
