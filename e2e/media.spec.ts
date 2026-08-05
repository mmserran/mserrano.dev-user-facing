import { expect, test } from "@playwright/test";

test.describe("Media & Responsive Images", () => {
  test.describe("Image Loading", () => {
    test("project detail page images load without errors", async ({
      page,
    }) => {
      await page.goto("/projects/mserrano-dev/");

      const images = page.locator("img");
      const count = await images.count();

      expect(count).toBeGreaterThan(0);

      // Verify first image has src
      const firstImg = images.first();
      const src = await firstImg.getAttribute("src");
      expect(src).toBeTruthy();
    });

    test("portfolio catalog tile images load", async ({ page }) => {
      await page.goto("/projects/");

      const images = page.locator("img");
      const count = await images.count();

      expect(count).toBeGreaterThan(0);

      // First image should have src
      const src = await images.first().getAttribute("src");
      expect(src).toBeTruthy();
    });

    test("resume PDF loads from correct media path", async ({ page }) => {
      await page.goto("/resume/");

      const pdfObject = page.locator('object[type="application/pdf"]');
      const dataSrc = await pdfObject.getAttribute("data");

      expect(dataSrc).toMatch(/^\/media\/.*\.pdf$/i);
      expect(dataSrc).toBeTruthy();
    });
  });

  test.describe("Image Accessibility", () => {
    test("project detail images have alt text", async ({ page }) => {
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

    test("decorative images have alt attributes", async ({ page }) => {
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

  test.describe("Media Path Resolution", () => {
    test("all media assets resolve to /media/ path", async ({ page }) => {
      await page.goto("/projects/");

      // Check images have valid paths
      const images = page.locator("img");
      const count = Math.min(3, await images.count());

      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const src = await img.getAttribute("src");

        if (src && !src.startsWith("data:")) {
          expect(src).toMatch(/^\/?media\//i);
        }
      }
    });

    test("resume PDF path is valid and resolvable", async ({ page }) => {
      await page.goto("/resume/");

      const pdfObject = page.locator('object[type="application/pdf"]');
      const dataSrc = await pdfObject.getAttribute("data");

      expect(dataSrc).toMatch(/^\/media\/.*\.pdf$/i);

      // Verify path structure
      const fileName = dataSrc?.split("/").pop();
      expect(fileName).toMatch(/\.pdf$/i);
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

  test.describe("Image Formats", () => {
    test("images are present and accessible", async ({ page }) => {
      await page.goto("/projects/");

      const images = page.locator("img");
      const count = await images.count();

      let loadedImages = 0;
      for (let i = 0; i < Math.min(5, count); i++) {
        const src = await images.nth(i).getAttribute("src");
        if (src) {
          loadedImages++;
        }
      }

      // At least some images should load
      expect(loadedImages).toBeGreaterThan(0);
    });
  });
});
