import { expect, test } from "@playwright/test";

test("serves the landing page from the static export", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle("Mark Anthony Serrano Portfolio Website");
  await expect(
    page.getByRole("button", { name: /navigation/i }),
  ).toBeVisible();
});
