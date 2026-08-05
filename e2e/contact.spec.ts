import { expect, test } from "@playwright/test";

test.describe("Contact Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact/");
  });

  test("serves the contact page from the static export", async ({ page }) => {
    const response = await page.goto("/contact/");

    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle("Contact | Mark Serrano");
    await expect(
      page.getByRole("heading", { name: "Contact", level: 1 }),
    ).toBeVisible();
  });

  test("displays contact form with required submit button", async ({ page }) => {
    const submitButton = page.getByRole("button", {
      name: "Open email draft",
    });

    await expect(submitButton).toBeVisible();
  });

  test("form fields accept user input", async ({ page }) => {
    const nameInput = page.getByRole("textbox").first();

    await nameInput.fill("Test Name");
    await expect(nameInput).toHaveValue("Test Name");
  });

  test("clears form fields after interaction", async ({ page }) => {
    const nameInput = page.getByRole("textbox").first();

    await nameInput.fill("Test Name");
    await expect(nameInput).toHaveValue("Test Name");

    await nameInput.clear();
    await expect(nameInput).toHaveValue("");
  });

  test("renders contact form with secure mailto link", async ({ page }) => {
    const submitButton = page.getByRole("button", {
      name: "Open email draft",
    });
    await expect(submitButton).toBeVisible();

    const href = await submitButton.getAttribute("href");
    expect(href).toMatch(/^mailto:/);
  });
});
