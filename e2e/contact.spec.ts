import { expect, test } from "@playwright/test";

test("serves the contact page from the static export", async ({ page }) => {
  const response = await page.goto("/contact/");

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle("Contact | Mark Serrano");
  await expect(page.getByRole("heading", { name: "Contact", level: 1 })).toBeVisible();
  await expect(page.getByRole("textbox", { name: /your name/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open email draft" })).toBeVisible();
});
