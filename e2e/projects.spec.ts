import { expect, test } from "@playwright/test";

test("serves the portfolio catalog from the static export", async ({ page }) => {
  const response = await page.goto("/projects/");

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle("Portfolio | Mark Serrano");
  await expect(page.getByRole("heading", { name: "Portfolio", level: 1 })).toBeVisible();
  await expect(page.getByText("18 / 18 Projects Visible")).toBeVisible();
});

test("links each tile to its project detail page", async ({ page }) => {
  await page.goto("/projects/");

  const link = page.getByRole("link", { name: /My Portfolio Website/ });
  await expect(link).toHaveAttribute("href", "/projects/mserrano-dev/");
});

test("filtering narrows the visible tiles, updates the count, and syncs the URL", async ({ page }) => {
  await page.goto("/projects/");

  await page.getByRole("combobox").click();
  await page.getByRole("combobox").fill("shopify");
  await page.getByRole("option", { name: "Shopify" }).click();

  await expect(page).toHaveURL(/\?q=shopify$/);
  await expect(page.getByText("5 / 18 Projects Visible")).toBeVisible();

  await page.getByRole("button", { name: "Remove Shopify filter" }).click();
  await expect(page.getByText("18 / 18 Projects Visible")).toBeVisible();
});

test.describe("mobile viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("stacks tiles in a single column and keeps the filter usable", async ({ page }) => {
    await page.goto("/projects/");

    await expect(page.getByRole("heading", { name: "Portfolio", level: 1 })).toBeVisible();
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
});
