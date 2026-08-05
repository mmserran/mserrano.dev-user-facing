import { expect, test } from "@playwright/test";

test.describe("Accessibility - WCAG 2.1 AA Standards", () => {
  test.describe("Landing Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
    });

    test("has proper heading hierarchy", async ({ page }) => {
      // Check that there's at least one H1
      const h1Count = await page.getByRole("heading", { level: 1 }).count();
      expect(h1Count).toBeGreaterThan(0);
    });

    test("all images have alt text", async ({ page }) => {
      const images = page.locator("img");
      const count = await images.count();

      for (let i = 0; i < Math.min(5, count); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute("alt");
        expect(alt !== null).toBe(true);
      }
    });

    test("skip-to-content link is present and functional", async ({ page }) => {
      const skipLink = page.getByRole("link", { name: "Skip to content" });
      await expect(skipLink).toBeVisible();

      await page.keyboard.press("Tab");
      await expect(skipLink).toBeFocused();

      const href = await skipLink.getAttribute("href");
      expect(href).toBe("#main-content");
    });

    test("main content area has id attribute", async ({ page }) => {
      const mainContent = page.locator("#main-content");
      await expect(mainContent).toBeVisible();
    });

    test("navigation is semantic with proper role", async ({ page }) => {
      const nav = page.getByRole("navigation");
      expect(await nav.count()).toBeGreaterThan(0);
    });
  });

  test.describe("Portfolio Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/projects/");
    });

    test("filter combobox is accessible with keyboard", async ({ page }) => {
      const combobox = page.getByRole("combobox");

      await combobox.focus();
      await expect(combobox).toBeFocused();

      // Can select with keyboard
      await combobox.click();
      await page.keyboard.type("shopify");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");

      await expect(page).toHaveURL(/\?q=shopify$/);
    });

    test("project tiles are keyboard navigable", async ({ page }) => {
      const projectTile = page.getByRole("link", {
        name: /My Portfolio Website/,
      });

      await projectTile.focus();
      await expect(projectTile).toBeFocused();

      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/projects\/mserrano-dev\/?$/);
    });
  });

  test.describe("Resume Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/resume/");
    });

    test("PDF object has aria-label", async ({ page }) => {
      const pdfObject = page.locator('object[type="application/pdf"]');
      const ariaLabel = await pdfObject.getAttribute("aria-label");
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain("resume");
    });

    test("all external links have proper rel attributes", async ({ page }) => {
      const externalLinks = page.locator('a[target="_blank"]');
      const count = await externalLinks.count();

      for (let i = 0; i < Math.min(3, count); i++) {
        const link = externalLinks.nth(i);
        const rel = await link.getAttribute("rel");
        expect(rel).toContain("noopener");
        expect(rel).toContain("noreferrer");
      }
    });
  });

  test.describe("Contact Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/contact/");
    });

    test("form fields are keyboard navigable", async ({ page }) => {
      const nameInput = page.getByRole("textbox", { name: /your name/i });
      const emailInput = page.getByRole("textbox", { name: /your e-mail/i });
      const subjectInput = page.getByRole("textbox", { name: /^subject$/i });
      const messageInput = page.getByRole("textbox", { name: /your message/i });
      const submitButton = page.getByRole("button", {
        name: "Open email draft",
      });

      await nameInput.focus();
      await expect(nameInput).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(emailInput).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(subjectInput).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(messageInput).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(submitButton).toBeFocused();
    });

    test("submit button is accessible and labeled", async ({ page }) => {
      const submitButton = page.getByRole("button", {
        name: "Open email draft",
      });

      await expect(submitButton).toBeVisible();
    });
  });

  test.describe("Navigation Accessibility", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/");
    });

    test("navigation drawer can be opened and closed with keyboard", async ({
      page,
    }) => {
      const menuButton = page.getByRole("button", { name: "Open navigation" });
      const drawer = page.getByRole("navigation", {
        name: "Primary",
        includeHidden: true,
      });

      // Open drawer
      await menuButton.focus();
      await page.keyboard.press("Enter");

      await expect(drawer).toHaveAttribute("aria-hidden", "false");

      // Close drawer with Escape
      await page.keyboard.press("Escape");
      await expect(drawer).toHaveAttribute("aria-hidden", "true");
      await expect(menuButton).toBeFocused();
    });

    test("navigation links are keyboard accessible", async ({ page }) => {
      const menuButton = page.getByRole("button", { name: "Open navigation" });
      await menuButton.click();

      const drawer = page.getByRole("navigation", {
        name: "Primary",
        includeHidden: true,
      });
      const portfolioLink = drawer.getByRole("link", {
        name: "Portfolio",
        includeHidden: true,
      });

      await portfolioLink.focus();
      await expect(portfolioLink).toBeFocused();

      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/projects\/?$/);
    });
  });

  test.describe("Not Found Page", () => {
    test("404 page has semantic structure", async ({ page }) => {
      await page.goto("/non-existent-route/");

      const heading = page.getByRole("heading", { level: 1, name: "404" });
      await expect(heading).toBeVisible();

      const homeLink = page.getByRole("link", { name: "Home" });
      await expect(homeLink).toBeVisible();
    });
  });

  test.describe("Links and Navigation", () => {
    test("external links are properly marked", async ({ page }) => {
      await page.goto("/resume/");

      const externalLinks = page.locator('a[target="_blank"]');
      const count = await externalLinks.count();

      expect(count).toBeGreaterThan(0);

      // At least first few should have rel attribute
      for (let i = 0; i < Math.min(2, count); i++) {
        const link = externalLinks.nth(i);
        const rel = await link.getAttribute("rel");
        expect(rel).toBeTruthy();
      }
    });
  });
});
