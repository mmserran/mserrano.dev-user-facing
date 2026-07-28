import { expect, test } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has correct title and meta description", async ({ page }) => {
    await expect(page).toHaveTitle("Mark Anthony Serrano Portfolio Website");

    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute(
      "content",
      "Portfolio of Mark Anthony Serrano — software engineer specializing in WordPress and Shopify development.",
    );
  });

  test("displays hero heading and subtitle", async ({ page }) => {
    const h1 = page.getByRole("heading", {
      level: 1,
      name: "Mark Anthony Serrano",
    });
    await expect(h1).toBeVisible();

    const h2 = page.getByRole("heading", {
      level: 2,
      name: "Developer | WordPress | Shopify",
    });
    await expect(h2).toBeVisible();
  });

  test("displays call to action links with correct attributes", async ({
    page,
  }) => {
    const contactLink = page.getByRole("link", { name: "Contact Me" });
    await expect(contactLink).toBeVisible();
    await expect(contactLink).toHaveAttribute("href", "/contact/");

    const portfolioLink = page.getByRole("link", { name: "View Portfolio" });
    await expect(portfolioLink).toBeVisible();
    await expect(portfolioLink).toHaveAttribute("href", "/projects/");
  });

  test("includes primary header and navigation controls", async ({ page }) => {
    const menuButton = page.getByRole("button", {
      name: /navigation/i,
    });
    await expect(menuButton).toBeVisible();
  });
});
