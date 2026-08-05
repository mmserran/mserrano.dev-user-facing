import { expect, test } from "@playwright/test";

test.describe("Cross-Page Navigation & URL Preservation", () => {
  test.describe("Global Navigation Links", () => {
    test("header social links navigate to external sites with correct attributes",
      async ({ page }) => {
        await page.goto("/");

        const header = page.locator("header");
        const linkedInLink = header.getByRole("link", {
          name: "LinkedIn (opens in a new tab)",
        });

        await expect(linkedInLink).toBeVisible();
        await expect(linkedInLink).toHaveAttribute("target", "_blank");
        await expect(linkedInLink).toHaveAttribute(
          "rel",
          "noopener noreferrer",
        );

        const href = await linkedInLink.getAttribute("href");
        expect(href).toContain("linkedin");
      },
    );
  });

  test.describe("Portfolio Navigation", () => {
    test("portfolio tiles link to correct project detail pages", async ({
      page,
    }) => {
      await page.goto("/projects/");

      // Test a few key project links
      const myPortfolioLink = page.getByRole("link", {
        name: /My Portfolio Website/,
      });
      const href = await myPortfolioLink.getAttribute("href");
      expect(href).toContain("mserrano-dev");
    });

    test("project detail page returns 200 and renders heading", async ({
      page,
    }) => {
      const response = await page.goto("/projects/mserrano-dev/");
      expect(response?.ok()).toBe(true);

      const heading = page.getByRole("heading", {
        level: 1,
        name: "My Portfolio Website",
      });
      await expect(heading).toBeVisible();
    });

    test("project detail page preserves slug in URL", async ({ page }) => {
      const testSlugs = [
        "mserrano-dev",
        "swisher-sweets",
      ];

      for (const slug of testSlugs) {
        const response = await page.goto(`/projects/${slug}/`, {
          waitUntil: "domcontentloaded",
        });
        expect(response?.ok()).toBe(true);
        expect(page.url()).toContain(`/projects/${slug}/`);
      }
    });
  });

  test.describe("Resume Page Navigation", () => {
    test("resume page includes link back to portfolio", async ({ page }) => {
      await page.goto("/resume/");

      const portfolioLink = page.getByRole("link", {
        name: "View My Portfolio",
      });
      await expect(portfolioLink).toBeVisible();
      await expect(portfolioLink).toHaveAttribute("href", "/projects/");
    });
  });

  test.describe("Contact Page Navigation", () => {
    test("contact page is accessible from main navigation", async ({
      page,
    }) => {
      await page.goto("/");

      const menuButton = page.getByRole("button", { name: /navigation/i });
      if ((await menuButton.getAttribute("aria-expanded")) === "false") {
        await menuButton.click();
      }

      const drawer = page.getByRole("navigation", {
        name: "Primary",
        includeHidden: true,
      });
      await expect(drawer).toHaveAttribute("aria-hidden", "false");

      const contactLink = drawer.getByRole("link", {
        name: "Contact",
        exact: true,
      });
      await contactLink.click();

      await expect(page).toHaveURL("/contact/");
      await expect(page).toHaveTitle(/Contact/i);
    });
  });

  test.describe("404 Not Found Handling", () => {
    test("404 page provides link back to home", async ({ page }) => {
      await page.goto("/non-existent-page/");

      const homeLink = page.getByRole("link", { name: "Home" });
      await expect(homeLink).toBeVisible();
      await expect(homeLink).toHaveAttribute("href", "/");
    });

    test("invalid URLs return 404 status", async ({ page }) => {
      const response = await page.goto("/this-does-not-exist/");
      expect(response?.status()).toBe(404);
    });

    test("404 page title indicates error", async ({ page }) => {
      await page.goto("/404.html");
      await expect(page).toHaveTitle(/404/);
    });
  });

  test.describe("Landing Page CTAs", () => {
    test("landing page contact CTA navigates to contact page", async ({
      page,
    }) => {
      await page.goto("/");

      const contactLink = page.getByRole("link", { name: "Contact Me" });
      await expect(contactLink).toHaveAttribute("href", "/contact/");

      await contactLink.click();
      await expect(page).toHaveURL("/contact/");
    });

    test("landing page portfolio CTA navigates to portfolio", async ({
      page,
    }) => {
      await page.goto("/");

      const portfolioLink = page.getByRole("link", {
        name: "View Portfolio",
      });
      await expect(portfolioLink).toHaveAttribute("href", "/projects/");

      await portfolioLink.click();
      await expect(page).toHaveURL("/projects/");
    });
  });

  test.describe("Page Title Consistency", () => {
    test("each major page has unique and descriptive title", async ({
      page,
    }) => {
      const pages = [
        { path: "/", title: "Mark Anthony Serrano Portfolio Website" },
        { path: "/projects/", title: "Portfolio | Mark Serrano" },
        { path: "/resume/", title: "Resume | Mark Serrano" },
        { path: "/contact/", title: "Contact | Mark Serrano" },
      ];

      for (const page_info of pages) {
        await page.goto(page_info.path);
        await expect(page).toHaveTitle(page_info.title);
      }
    });

    test("project detail pages have dynamic titles", async ({ page }) => {
      await page.goto("/projects/mserrano-dev/");
      let title = await page.title();
      expect(title).toContain("My Portfolio Website");

      await page.goto("/projects/swisher-sweets/");
      title = await page.title();
      expect(title).toContain("Swisher Sweets");
    });
  });
});
