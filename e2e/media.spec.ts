import { expect, test, type Page } from "@playwright/test";

// Only images actually intersecting the viewport are expected to load - the
// Related Projects section is a horizontally-scrolling carousel
// (overflow-x-auto) that lays every slide out in the flex row regardless of
// whether it's scrolled into view; slides beyond the visible width sit well
// outside the viewport rect (confirmed via getBoundingClientRect) and native
// loading="lazy" correctly never fetches them until a user scrolls that
// carousel horizontally, not just the page vertically. The viewport check is
// inlined in both browser-context callbacks below (rather than shared) since
// Playwright serializes each callback independently.
//
// Assertions scope to the manifest contract (src/currentSrc under /media/) so
// EndcapShell's decorative /assets SVGs cannot satisfy a silent pass after a
// jump-scroll parks the viewport on the illustration. Vertical coverage is via
// stepped scrolling rather than scrollHeight, so mid-page lazy tiles pass
// through the viewport and get naturalWidth checked.

// img.complete/naturalWidth are the browser's actual load-state signals -
// src alone only proves an attribute was set, not that the byte fetch
// succeeded. Poll instead of racing networkidle: decoding="async" images can
// finish their network fetch before the decode (which flips `complete`)
// settles, and native loading="lazy" images below the fold only start
// fetching once the browser's own intersection heuristic reacts to a scroll.
async function waitForViewportMediaImagesToSettle(page: Page) {
  await page.waitForFunction(
    () => {
      const rectInViewport = (rect: DOMRect) =>
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth;

      const isMediaImage = (img: HTMLImageElement) => {
        const src = img.currentSrc || img.src || img.getAttribute("src") || "";
        const srcset = img.getAttribute("srcset") || "";
        return src.includes("/media/") || srcset.includes("/media/");
      };

      return Array.from(document.querySelectorAll("img"))
        .filter((el) => {
          const img = el as HTMLImageElement;
          return isMediaImage(img) && rectInViewport(img.getBoundingClientRect());
        })
        .every((img) => (img as HTMLImageElement).complete);
    },
    { timeout: 15_000 },
  );
}

async function getViewportMediaImageLoadStates(page: Page) {
  return page.evaluate(() => {
    const rectInViewport = (rect: DOMRect) =>
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth;

    const isMediaImage = (img: HTMLImageElement) => {
      const src = img.currentSrc || img.src || img.getAttribute("src") || "";
      const srcset = img.getAttribute("srcset") || "";
      return src.includes("/media/") || srcset.includes("/media/");
    };

    return Array.from(document.querySelectorAll("img"))
      .filter((el) => {
        const img = el as HTMLImageElement;
        return isMediaImage(img) && rectInViewport(img.getBoundingClientRect());
      })
      .map((el) => {
        const img = el as HTMLImageElement;
        return {
          src: img.currentSrc || img.src,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
        };
      });
  });
}

// Step through the document vertically so loading="lazy" /media/ tiles enter
// the viewport (and the browser's intersection heuristic) instead of being
// jumped past by a single scroll-to-bottom that leaves only EndcapShell in frame.
async function collectMediaImageLoadStatesAlongScroll(page: Page) {
  const bySrc = new Map<
    string,
    { src: string; complete: boolean; naturalWidth: number }
  >();

  const record = async () => {
    await waitForViewportMediaImagesToSettle(page);
    for (const state of await getViewportMediaImageLoadStates(page)) {
      bySrc.set(state.src, state);
    }
  };

  await page.evaluate(() => window.scrollTo(0, 0));
  await record();

  const scrollPlan = await page.evaluate(() => {
    const maxScroll = Math.max(0, document.body.scrollHeight - window.innerHeight);
    const step = Math.max(1, Math.floor(window.innerHeight * 0.75));
    return { maxScroll, step };
  });

  for (let y = scrollPlan.step; y < scrollPlan.maxScroll; y += scrollPlan.step) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await record();
  }

  if (scrollPlan.maxScroll > 0) {
    await page.evaluate((top) => window.scrollTo(0, top), scrollPlan.maxScroll);
    await record();
  }

  return [...bySrc.values()];
}

// EndcapShell's decorative sky/county illustration art (aria-hidden, static
// public/assets SVGs) is intentionally outside the manifest-backed media
// pipeline - only images a screen reader would ever announce are the actual
// portfolio media contract this checks.
async function getContentImageSources(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("img"))
      .filter((img) => !img.closest('[aria-hidden="true"]'))
      .map((img) => ({
        src: img.getAttribute("src"),
        srcset: img.getAttribute("srcset"),
      })),
  );
}

// requestfailed only covers network-level aborts; HTTP 404 and other non-OK
// image responses still return a body and need the response status channel.
function trackFailedImageRequests(page: Page): string[] {
  const failed: string[] = [];
  page.on("requestfailed", (request) => {
    if (request.resourceType() === "image") {
      failed.push(request.url());
    }
  });
  page.on("response", (response) => {
    if (response.request().resourceType() !== "image") {
      return;
    }
    if (!response.ok()) {
      failed.push(`${response.status()} ${response.url()}`);
    }
  });
  return failed;
}

test.describe("Media & Responsive Images", () => {
  test.describe("Image Loading", () => {
    test("project detail page images load without errors", async ({
      page,
    }) => {
      const failedImageRequests = trackFailedImageRequests(page);

      await page.goto("/projects/mserrano-dev/");
      // Related-project tiles and triplet logos further down the page are
      // native loading="lazy" - step-scroll so they enter the viewport (and
      // the browser's lazy-load threshold) before asserting /media/ load state.
      const loadStates = await collectMediaImageLoadStatesAlongScroll(page);
      expect(
        loadStates.length,
        "expected at least one viewport-visible /media/ image after vertical scroll",
      ).toBeGreaterThan(0);

      for (const state of loadStates) {
        expect(state.src).toMatch(/\/media\//);
        expect(state.complete, `image did not finish loading: ${state.src}`).toBe(true);
        expect(state.naturalWidth, `image loaded with zero width: ${state.src}`).toBeGreaterThan(0);
      }

      expect(
        failedImageRequests,
        `failed image requests: ${failedImageRequests.join(", ")}`,
      ).toHaveLength(0);
    });

    test("portfolio catalog tile images load", async ({ page }) => {
      const failedImageRequests = trackFailedImageRequests(page);

      await page.goto("/projects/");
      // 18 tiles is more than a single viewport - step-scroll so mid-page
      // lazy tiles enter the viewport rather than jumping straight to the
      // EndcapShell frame at document end.
      const loadStates = await collectMediaImageLoadStatesAlongScroll(page);
      expect(
        loadStates.length,
        "expected at least one viewport-visible /media/ tile after vertical scroll",
      ).toBeGreaterThan(0);

      for (const state of loadStates) {
        expect(state.src).toMatch(/\/media\//);
        expect(state.complete, `tile image did not finish loading: ${state.src}`).toBe(true);
        expect(state.naturalWidth, `tile image loaded with zero width: ${state.src}`).toBeGreaterThan(0);
      }

      expect(
        failedImageRequests,
        `failed image requests: ${failedImageRequests.join(", ")}`,
      ).toHaveLength(0);
    });

    test("resume PDF loads from correct media path", async ({ page }) => {
      await page.goto("/resume/");

      const pdfObject = page.locator('object[type="application/pdf"]');
      const dataSrc = await pdfObject.getAttribute("data");

      expect(dataSrc).toMatch(/^\/media\/.*\.pdf$/i);
    });
  });

  test.describe("Image Accessibility", () => {
    test("project detail images have alt text", async ({ page }) => {
      await page.goto("/projects/mserrano-dev/");

      const pageImages = page.locator("img");
      const count = await pageImages.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const img = pageImages.nth(i);
        const alt = await img.getAttribute("alt");

        // All images should have alt attribute (can be empty for decorative)
        expect(alt !== null).toBe(true);
      }
    });

    test("decorative images have alt attributes", async ({ page }) => {
      // The landing page renders no <img> elements at all (its hero is pure
      // CSS/text) - the portfolio catalog's tile images are the decorative
      // (alt="") case this test is actually meant to guard.
      await page.goto("/projects/");

      const images = page.locator("img");
      const count = await images.count();
      expect(count, "expected the portfolio catalog to render at least one image").toBeGreaterThan(0);

      let decorativeCount = 0;
      for (let i = 0; i < count; i++) {
        const alt = await images.nth(i).getAttribute("alt");
        expect(typeof alt).toBe("string");
        if (alt === "") {
          decorativeCount++;
        }
      }

      expect(
        decorativeCount,
        "expected at least one decorative (empty-alt) tile image",
      ).toBeGreaterThan(0);
    });
  });

  test.describe("Media Path Resolution", () => {
    test("media assets resolve to manifest-backed /media/ paths with responsive srcset", async ({
      page,
    }) => {
      await page.goto("/projects/");
      // ProjectTileImage is a client component - its <img>/<video> layers
      // only exist post-hydration, which can trail the goto() load event.
      await page
        .locator('a[href^="/projects/"][href$="/"] img')
        .first()
        .waitFor({ state: "attached", timeout: 10_000 });

      const sources = await getContentImageSources(page);
      expect(sources.length).toBeGreaterThan(0);

      let sawSrcset = false;
      for (const { src, srcset } of sources) {
        expect(src, "img is missing a src attribute").toBeTruthy();
        expect(src).toMatch(/^\/media\/.+\.webp$/i);

        if (srcset) {
          sawSrcset = true;
          // Every candidate in the set must itself be a manifest-backed
          // /media/ variant carrying a width descriptor, e.g. "/media/x-400.webp 400w".
          for (const candidate of srcset.split(",")) {
            expect(candidate.trim()).toMatch(/^\/media\/.+\.webp \d+w$/i);
          }
        }
      }

      // getMediaVariants only omits srcset when a filename has a single
      // variant - the catalog's multi-width tiles must exercise the real path.
      expect(sawSrcset, "expected at least one tile image to carry a responsive srcset").toBe(true);
    });

    test("resume PDF path resolves to an actual PDF response", async ({ page }) => {
      await page.goto("/resume/");

      const pdfObject = page.locator('object[type="application/pdf"]');
      const dataSrc = await pdfObject.getAttribute("data");
      expect(dataSrc).toBeTruthy();

      const response = await page.request.get(dataSrc!);
      expect(response.ok()).toBe(true);
      expect(response.headers()["content-type"]).toMatch(/application\/pdf/i);
    });
  });

  test.describe("SVG Icons", () => {
    test("navigation and UI icons load correctly", async ({ page }) => {
      await page.goto("/");

      const svgs = page.locator("svg");
      const count = await svgs.count();

      // Should have some SVG icons (menu, social icons, etc)
      expect(count).toBeGreaterThan(0);
    });
  });
});
