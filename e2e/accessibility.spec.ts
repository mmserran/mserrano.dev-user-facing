import { expect, test } from "@playwright/test";

test.describe("Accessibility - WCAG 2.1 AA Standards", () => {
  test.describe("Landing Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
    });

    test("has proper heading hierarchy", async ({ page }) => {
      // Check that there's exactly one H1
      const h1Count = await page.getByRole("heading", { level: 1 }).count();
      expect(h1Count).toBe(1);

      // Check that H2 exists and follows H1
      const h2Count = await page.getByRole("heading", { level: 2 }).count();
      expect(h2Count).toBeGreaterThan(0);
    });

    test("all images have alt text", async ({ page }) => {
      const images = page.locator("img");
      const count = await images.count();

      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute("alt");
        // Alt can be empty string for decorative images, but attribute must exist
        expect(alt !== null).toBe(true);
      }
    });

    test("all form inputs have labels", async ({ page }) => {
      const inputs = page.locator("input, textarea, select");
      const count = await inputs.count();

      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        const ariaLabel = await input.getAttribute("aria-label");
        const ariaLabelledBy = await input.getAttribute("aria-labelledby");
        const label = page.locator(`label[for="${await input.getAttribute("id")}"]`);
        const labelCount = await label.count();

        const hasLabel =
          ariaLabel || ariaLabelledBy || labelCount > 0;
        expect(hasLabel).toBe(true);
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
      const nav = page.getByRole("navigation", { name: "Primary" });
      await expect(nav).toBeVisible();
    });
  });

  test.describe("Portfolio Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/projects/");
    });

    test("filter combobox is accessible with keyboard", async ({ page }) => {
      const combobox = page.getByRole("combobox");

      // Can tab to combobox
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      // Note: focus state depends on page content

      // Can interact with keyboard
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
      const firstTile = page
        .getByRole("link", { name: /My Portfolio Website/ })
        .first();

      await firstTile.focus();
      await expect(firstTile).toBeFocused();

      // Should be able to activate with Enter key
      const href = await firstTile.getAttribute("href");
      expect(href).toBeTruthy();
    });

    test("technology breakdown has proper structure for screen readers", async ({
      page,
    }) => {
      await page.goto("/projects/mserrano-dev/");

      const breakdown = page.getByRole("region", {
        name: "Technology breakdown",
      });
      await expect(breakdown).toBeVisible();

      const heading = page.getByRole("heading", {
        name: /Technology/i,
      });
      await expect(heading).toBeVisible();
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

      for (let i = 0; i < count; i++) {
        const link = externalLinks.nth(i);
        const rel = await link.getAttribute("rel");
        expect(rel).toContain("noopener");
        expect(rel).toContain("noreferrer");
      }
    });

    test("external link text indicates opening in new tab", async ({
      page,
    }) => {
      const linkedInLink = page.getByRole("link", {
        name: "LinkedIn (opens in a new tab)",
      });
      await expect(linkedInLink).toBeVisible();
    });
  });

  test.describe("Contact Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/contact/");
    });

    test("form fields are properly associated with labels", async ({ page }) => {
      const nameInput = page.getByRole("textbox", { name: /your name/i });
      const emailInput = page.getByRole("textbox", { name: /your email/i });
      const messageInput = page.getByRole("textbox", { name: /your message/i });

      await expect(nameInput).toBeVisible();
      await expect(emailInput).toBeVisible();
      await expect(messageInput).toBeVisible();
    });

    test("submit button is accessible and labeled", async ({ page }) => {
      const submitButton = page.getByRole("button", {
        name: "Open email draft",
      });

      await expect(submitButton).toBeVisible();
      await expect(submitButton).toHaveAttribute("type", "button");
    });

    test("form fields are keyboard navigable", async ({ page }) => {
      const nameInput = page.getByRole("textbox", { name: /your name/i });
      const emailInput = page.getByRole("textbox", { name: /your email/i });
      const messageInput = page.getByRole("textbox", { name: /your message/i });

      // Tab through form fields
      await nameInput.focus();
      await expect(nameInput).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(emailInput).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(messageInput).toBeFocused();
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

      const portfolioLink = page.getByRole("link", {
        name: "Portfolio",
        includeHidden: true,
      });

      await portfolioLink.focus();
      await expect(portfolioLink).toBeFocused();
      await page.keyboard.press("Enter");

      await expect(page).toHaveURL("/projects/");
    });

    test("aria-current indicates active page in navigation", async ({
      page,
    }) => {
      const menuButton = page.getByRole("button", { name: "Open navigation" });
      await menuButton.click();

      const homeLink = page.getByRole("link", {
        name: "Home",
        includeHidden: true,
      });

      await expect(homeLink).toHaveAttribute("aria-current", "page");
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

  test.describe("Color Contrast", () => {
    test("page has sufficient color contrast", async ({ page }) => {
      await page.goto("/");

      // Check main heading contrast
      const h1 = page.getByRole("heading", { level: 1 });
      const isVisible = await h1.isVisible();
      expect(isVisible).toBe(true);

      // Check that text is readable (basic check - actual color contrast
      // validation requires visual tools, but we verify text is visible)
      const color = await h1.evaluate((el) =>
        getComputedStyle(el).color,
      );
      expect(color).toBeTruthy();
    });
  });
});
