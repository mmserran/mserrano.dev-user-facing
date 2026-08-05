import { expect, test } from "@playwright/test";

test.describe("Cross-Page Navigation & URL Preservation", () => {
  test.describe("Global Navigation Links", () => {
    test("main navigation allows traversal through all major pages", async ({
      page,
    }) => {
      await page.goto("/");

      const drawer = page.getByRole("navigation", {
        name: "Primary",
        includeHidden: true,
      });

      // Navigate through each major page
      const portfolioLink = drawer.getByRole("link", { name: "Portfolio" });
      await portfolioLink.click();
      await expect(page).toHaveURL("/projects/");

      // Open drawer again and navigate to resume
      const menuButton = page.getByRole("button", { name: /navigation/i });
      await menuButton.click();

      const resumeLink = drawer.getByRole("link", { name: "Resume" });
      await resumeLink.click();
      await expect(page).toHaveURL("/resume/");

      // Navigate to contact
      await menuButton.click();
      const contactLink = drawer.getByRole("link", { name: "Contact" });
      await contactLink.click();
      await expect(page).toHaveURL("/contact/");

      // Navigate back to home
      await menuButton.click();
      const homeLink = drawer.getByRole("link", { name: "Home" });
      await homeLink.click();
      await expect(page).toHaveURL("/");
    });

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
    test("portfolio catalog lists all 18 projects", async ({ page }) => {
      await page.goto("/projects/");

      const projectCount = page
        .getByRole("link")
        .filter({ has: page.locator("article") });
      const count = await projectCount.count();

      expect(count).toBeGreaterThanOrEqual(18);
    });

    test("portfolio tiles link to correct project detail pages", async ({
      page,
    }) => {
      await page.goto("/projects/");

      // Test multiple project links
      const testProjects = [
        { name: /My Portfolio Website/, slug: "mserrano-dev" },
        { name: /Swisher Sweets/, slug: "swisher-sweets" },
        { name: /Dr\.? Delights/, slug: "dr-delights" },
      ];

      for (const project of testProjects) {
        const link = page.getByRole("link", { name: project.name });
        const href = await link.getAttribute("href");
        expect(href).toContain(project.slug);
      }
    });

    test("project detail page preserves slug in URL", async ({ page }) => {
      const testSlugs = [
        "mserrano-dev",
        "swisher-sweets",
        "dr-delights",
        "pulsemobile",
      ];

      for (const slug of testSlugs) {
        const response = await page.goto(`/projects/${slug}/`);
        expect(response?.ok()).toBe(true);
        expect(page.url()).toContain(`/projects/${slug}/`);
      }
    });

    test("project detail page has navigation back to portfolio", async ({
      page,
    }) => {
      await page.goto("/projects/mserrano-dev/");

      const backLink = page.getByRole("link", {
        name: /portfolio|back|view all/i,
      });
      await expect(backLink).toBeVisible();

      // Click and verify navigation
      await backLink.click();
      await expect(page).toHaveURL(/\/projects\/$/);
    });

    test("filter query parameter is preserved in URL", async ({ page }) => {
      await page.goto("/projects/");

      const combobox = page.getByRole("combobox");
      await combobox.click();
      await combobox.fill("shopify");
      await page.getByRole("option", { name: "Shopify" }).click();

      await expect(page).toHaveURL(/\?q=shopify$/);

      // Reload page
      await page.reload();

      // Filter should still be visible and URL preserved
      await expect(page).toHaveURL(/\?q=shopify$/);
      await expect(page.getByText("5 / 18 Projects Visible")).toBeVisible();
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

      await portfolioLink.click();
      await expect(page).toHaveURL("/projects/");
    });

    test("resume page social links are functional and external", async ({
      page,
    }) => {
      await page.goto("/resume/");

      const socialLinks = {
        linkedin: /linkedin\.com/i,
        github: /github\.com/i,
      };

      for (const [name, urlPattern] of Object.entries(socialLinks)) {
        const link = page.getByRole("link", {
          name: new RegExp(name, "i"),
        });
        await expect(link).toBeVisible();

        const href = await link.getAttribute("href");
        expect(href).toMatch(urlPattern);
        await expect(link).toHaveAttribute("target", "_blank");
        await expect(link).toHaveAttribute("rel", "noopener noreferrer");
      }
    });

    test("PDF link resolves to correct media path", async ({ page }) => {
      await page.goto("/resume/");

      const pdfLink = page.getByRole("link", {
        name: /resume.*opens in a new tab/i,
      });
      const href = await pdfLink.getAttribute("href");

      expect(href).toMatch(/^\/media\/.*\.pdf$/i);
    });
  });

  test.describe("Contact Page Navigation", () => {
    test("contact page is accessible from main navigation", async ({
      page,
    }) => {
      await page.goto("/");

      const menuButton = page.getByRole("button", { name: /navigation/i });
      await menuButton.click();

      const contactLink = page.getByRole("link", { name: "Contact" });
      await contactLink.click();

      await expect(page).toHaveURL("/contact/");
      await expect(page).toHaveTitle(/Contact/i);
    });

    test("contact page includes mailto: link", async ({ page }) => {
      await page.goto("/contact/");

      const submitButton = page.getByRole("button", {
        name: "Open email draft",
      });

      const href = await submitButton.getAttribute("href");
      expect(href).toMatch(/^mailto:/);
    });
  });

  test.describe("404 Not Found Handling", () => {
    test("404 page provides link back to home", async ({ page }) => {
      await page.goto("/non-existent-page/");

      const homeLink = page.getByRole("link", { name: "Home" });
      await expect(homeLink).toBeVisible();
      await expect(homeLink).toHaveAttribute("href", "/");

      await homeLink.click();
      await expect(page).toHaveURL("/");
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

  test.describe("Page Title & Meta Consistency", () => {
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
