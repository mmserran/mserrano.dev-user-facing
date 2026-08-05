import { expect, test } from "@playwright/test";

test.describe("Portfolio Catalog & Project Details", () => {
  test("serves the portfolio catalog from the static export", async ({
    page,
  }) => {
    const response = await page.goto("/projects/");

    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle("Portfolio | Mark Serrano");
    await expect(
      page.getByRole("heading", { name: "Portfolio", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("18 / 18 Projects Visible")).toBeVisible();
  });

  test("links each tile to its project detail page", async ({ page }) => {
    await page.goto("/projects/");

    const link = page.getByRole("link", { name: /My Portfolio Website/ });
    await expect(link).toHaveAttribute("href", "/projects/mserrano-dev/");

    const swisherLink = page.getByRole("link", { name: /Swisher Sweets/ });
    await expect(swisherLink).toHaveAttribute("href", "/projects/swisher-sweets/");
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

  test("project detail page preserves original slug URLs", async ({ page }) => {
    // Four sequential detail navigations: default 30s is tight under parallel load.
    test.setTimeout(60_000);

    // Test a sample of original project slugs from content.json
    const projectSlugs = [
      "mserrano-dev",
      "swisher-sweets",
      "dr-delights",
      "pulsemobile",
    ];

    for (const slug of projectSlugs) {
      const response = await page.goto(`/projects/${slug}/`);
      expect(response?.ok()).toBe(true);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

  test("renders the project technology breakdown with an accessible graph and keyboard-operable legend",
    async ({ page }) => {
      await page.goto("/projects/mserrano-dev/");

      await expect(
        page.getByRole("img", {
          name: "Technology usage breakdown for My Portfolio Website",
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Scripts", level: 3 }),
      ).toBeVisible();

      const javascript = page.getByRole("link", { name: "JavaScript" });
      await javascript.focus();
      await expect(javascript).toBeFocused();
      await expect(javascript).toHaveAttribute("target", "_blank");
      await expect(javascript).toHaveAttribute("rel", "noopener noreferrer");
    },
  );

  test("filtering narrows the visible tiles, updates the count, and syncs the URL",
    async ({ page }) => {
      await page.goto("/projects/");

      await page.getByRole("combobox").click();
      await page.getByRole("combobox").fill("shopify");
      await page.getByRole("option", { name: "Shopify" }).click();

      await expect(page).toHaveURL(/\?q=shopify$/);
      await expect(page.getByText("5 / 18 Projects Visible")).toBeVisible();

      await page.getByRole("button", { name: "Remove Shopify filter" }).click();
      await expect(page.getByText("18 / 18 Projects Visible")).toBeVisible();
    },
  );

  test("project detail page includes back/return navigation", async ({
    page,
  }) => {
    await page.goto("/projects/mserrano-dev/");

    const backLink = page.getByRole("link", { name: "Back to Portfolio" });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/projects/");
  });

  test.describe("mobile viewport", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("stacks tiles in a single column and keeps the filter usable", async ({
      page,
    }) => {
      await page.goto("/projects/");

      await expect(
        page.getByRole("heading", { name: "Portfolio", level: 1 }),
      ).toBeVisible();
      await expect(page.getByRole("combobox")).toBeVisible();

      const firstTile = page.getByRole("link", { name: /My Portfolio Website/ });
      const secondTile = page.getByRole("link", { name: /Swisher Sweets/ });
      const firstBox = await firstTile.boundingBox();
      const secondBox = await secondTile.boundingBox();

      expect(firstBox).not.toBeNull();
      expect(secondBox).not.toBeNull();
      // Single column on mobile: tiles stack vertically, not side by side.
      expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height - 1);
    });

    test("keeps the technology graph and legend within the mobile viewport",
      async ({ page }) => {
        await page.goto("/projects/mserrano-dev/");

        await expect(
          page.getByRole("img", {
            name: "Technology usage breakdown for My Portfolio Website",
          }),
        ).toBeVisible();
        const breakdown = page.getByRole("region", {
          name: "Technology breakdown",
        });
        const hasHorizontalOverflow = await breakdown.evaluate(
          (element) => element.scrollWidth > element.clientWidth,
        );
        expect(hasHorizontalOverflow).toBe(false);
        await expect(
          page.getByRole("heading", { name: "Dev Environment", level: 3 }),
        ).toBeVisible();
      },
    );
  });
});
