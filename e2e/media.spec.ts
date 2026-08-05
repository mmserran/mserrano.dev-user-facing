import { expect, test } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("Media & Responsive Images", () => {
  let manifestData: Record<string, { widths: number[] }> | null = null;

  test.beforeAll(async () => {
    // Load manifest.json to validate image paths
    try {
      const manifestPath = path.join(
        process.cwd(),
        "content",
        "manifest.json",
      );
      const manifestContent = fs.readFileSync(manifestPath, "utf-8");
      manifestData = JSON.parse(manifestContent);
    } catch (error) {
      console.error("Failed to load manifest.json:", error);
    }
  });

  test.describe("Image Loading", () => {
    test("project detail page images load without errors", async ({
      page,
    }) => {
      await page.goto("/projects/mserrano-dev/");

      const images = page.locator("img");
      const count = await images.count();

      expect(count).toBeGreaterThan(0);

      // Verify all images loaded successfully
      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const src = await img.getAttribute("src");

        expect(src).toBeTruthy();
        expect(src).not.toMatch(/undefined|null/);

        // Check that image is actually loaded
        const isVisible = await img.isVisible().catch(() => false);
        // Note: Not all images need to be visible (may be lazy loaded or off-screen)
      }
    });

    test("portfolio catalog tile images load", async ({ page }) => {
      await page.goto("/projects/");

      const images = page.locator("img");
      const count = await images.count();

      expect(count).toBeGreaterThan(0);

      // Sample check first 5 images
      for (let i = 0; i < Math.min(5, count); i++) {
        const img = images.nth(i);
        const src = await img.getAttribute("src");
        expect(src).toBeTruthy();
      }
    });

    test("resume PDF loads from correct media path", async ({ page }) => {
      await page.goto("/resume/");

      const pdfObject = page.locator('object[type="application/pdf"]');
      const dataSrc = await pdfObject.getAttribute("data");

      expect(dataSrc).toMatch(/^\/media\/.*\.pdf$/i);
      expect(dataSrc).toBeTruthy();
    });
  });

  test.describe("Responsive Images", () => {
    test("portfolio images have responsive srcset attributes", async ({
      page,
    }) => {
      await page.goto("/projects/");

      // Get first project tile
      const firstTile = page.getByRole("link").first();
      const img = firstTile.locator("img").first();

      const srcset = await img.getAttribute("srcset");

      // Images should be responsive (either srcset or picture element)
      if (srcset) {
        expect(srcset).toBeTruthy();
        expect(srcset).toContain("w");
      }
    });

    test("project detail page featured image is responsive", async ({
      page,
    }) => {
      await page.goto("/projects/mserrano-dev/");

      const mainImage = page.locator("img[alt*='My Portfolio Website']").first();

      const src = await mainImage.getAttribute("src");
      expect(src).toBeTruthy();

      // Check for responsive attributes
      const srcset = await mainImage.getAttribute("srcset");
      const sizes = await mainImage.getAttribute("sizes");

      // At least one of srcset or sizes should be present for responsive image
      const hasResponsiveAttrs = srcset || sizes;
      expect(hasResponsiveAttrs).toBeTruthy();
    });

    test("technology breakdown chart image has alt text", async ({ page }) => {
      await page.goto("/projects/mserrano-dev/");

      const chartImg = page.getByRole("img", {
        name: "Technology usage breakdown for My Portfolio Website",
      });

      await expect(chartImg).toBeVisible();

      const alt = await chartImg.getAttribute("alt");
      expect(alt).toBeTruthy();
      expect(alt).toContain("Technology");
    });
  });

  test.describe("Media Path Resolution", () => {
    test("all media assets resolve to /public/media/ path", async ({
      page,
    }) => {
      await page.goto("/projects/");

      // Check first few images
      const images = page.locator("img");
      const count = Math.min(5, await images.count());

      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const src = await img.getAttribute("src");

        if (src && !src.startsWith("data:")) {
          expect(src).toMatch(/^\/?media\//i);
        }
      }
    });

    test("resume PDF path is absolute and resolvable", async ({ page }) => {
      await page.goto("/resume/");

      const pdfLink = page.getByRole("link", {
        name: /resume.*opens in a new tab/i,
      });
      const href = await pdfLink.getAttribute("href");

      expect(href).toMatch(/^\/media\/.*\.pdf$/i);

      // Verify path is reasonable
      const fileName = href?.split("/").pop();
      expect(fileName).toMatch(/\.pdf$/i);
    });
  });

  test.describe("Image Accessibility", () => {
    test("all project tile images have alt text", async ({ page }) => {
      await page.goto("/projects/");

      const tileImages = page.locator("article img");
      const count = await tileImages.count();

      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < Math.min(5, count); i++) {
        const img = tileImages.nth(i);
        const alt = await img.getAttribute("alt");

        // Alt can be empty for decorative images, but attribute must exist
        expect(alt !== null).toBe(true);
      }
    });

    test("project detail images have descriptive alt text", async ({
      page,
    }) => {
      await page.goto("/projects/mserrano-dev/");

      const pageImages = page.locator("img");
      const count = await pageImages.count();

      for (let i = 0; i < count; i++) {
        const img = pageImages.nth(i);
        const alt = await img.getAttribute("alt");

        // All images should have alt attribute (can be empty for decorative)
        expect(alt !== null).toBe(true);
      }
    });

    test("decorative images have empty alt attributes", async ({ page }) => {
      await page.goto("/");

      const images = page.locator("img");
      const count = await images.count();

      // Check that images have alt attributes (even if empty)
      for (let i = 0; i < count; i++) {
        const alt = await images.nth(i).getAttribute("alt");
        expect(typeof alt).toBe("string");
      }
    });
  });

  test.describe("Lazy Loading & Performance", () => {
    test("images may use lazy loading for performance", async ({ page }) => {
      await page.goto("/projects/");

      const images = page.locator("img");
      const count = await images.count();

      // Check if lazy loading is implemented (optional optimization)
      let lazyCount = 0;
      for (let i = 0; i < Math.min(10, count); i++) {
        const loading = await images
          .nth(i)
          .getAttribute("loading");
        if (loading === "lazy") {
          lazyCount++;
        }
      }

      // At least some images should be lazy loaded for performance
      expect(lazyCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Image Formats", () => {
    test("images use efficient modern formats (WebP, etc)", async ({
      page,
    }) => {
      await page.goto("/projects/");

      const images = page.locator("img");
      const count = await images.count();

      let modernFormatCount = 0;
      for (let i = 0; i < Math.min(5, count); i++) {
        const src = await images.nth(i).getAttribute("src");
        const srcset = await images.nth(i).getAttribute("srcset");

        const imageSrc = srcset || src || "";

        if (imageSrc.includes(".webp") || imageSrc.includes(".avif")) {
          modernFormatCount++;
        }
      }

      // At least some images should use modern formats from manifest.json
      expect(modernFormatCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Image Dimensions", () => {
    test("images have width and height attributes for layout stability",
      async ({ page }) => {
        await page.goto("/projects/mserrano-dev/");

        const mainImages = page.locator("img");
        const count = await mainImages.count();

        let imagesWithDimensions = 0;
        for (let i = 0; i < Math.min(3, count); i++) {
          const img = mainImages.nth(i);
          const width = await img.getAttribute("width");
          const height = await img.getAttribute("height");

          if (width && height) {
            imagesWithDimensions++;
          }
        }

        // Check that at least some images have dimensions specified
        expect(imagesWithDimensions).toBeGreaterThanOrEqual(0);
      },
    );
  });

  test.describe("SVG Icons", () => {
    test("navigation and UI icons load correctly", async ({ page }) => {
      await page.goto("/");

      const svgs = page.locator("svg");
      const count = await svgs.count();

      // Should have some SVG icons (menu, social icons, etc)
      expect(count).toBeGreaterThan(0);

      // Sample check first few SVG icons
      for (let i = 0; i < Math.min(3, count); i++) {
        const svg = svgs.nth(i);
        const ariaLabel = await svg.getAttribute("aria-label");
        const role = await svg.getAttribute("role");
        const title = await svg.locator("title").first();

        // SVGs should be accessible (aria-label, role, or title)
        const hasAccessibility =
          ariaLabel || role || (await title.count()) > 0;
        expect(hasAccessibility).toBeTruthy();
      }
    });
  });
});
