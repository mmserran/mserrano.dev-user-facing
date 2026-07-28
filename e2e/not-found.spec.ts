import { expect, test } from "@playwright/test";

test.describe("404 Not Found Page", () => {
  test("renders 404 page for non-existent route", async ({ page }) => {
    const response = await page.goto("/non-existent-page/");

    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle("404 | Mark Serrano");

    const heading = page.getByRole("heading", { level: 1, name: "404" });
    await expect(heading).toBeVisible();
  });

  test("provides a functioning Home CTA link", async ({ page }) => {
    await page.goto("/404.html");

    const homeLink = page.getByRole("link", { name: "Home" });
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute("href", "/");

    await homeLink.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Mark Anthony Serrano" }),
    ).toBeVisible();
  });
});
