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

  test("displays contact form with all required fields", async ({ page }) => {
    const nameInput = page.getByRole("textbox", { name: /your name/i });
    const emailInput = page.getByRole("textbox", { name: /your email/i });
    const messageInput = page.getByRole("textbox", { name: /your message/i });

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(messageInput).toBeVisible();
  });

  test("generates mailto: link with form values", async ({ page }) => {
    const nameInput = page.getByRole("textbox", { name: /your name/i });
    const emailInput = page.getByRole("textbox", { name: /your email/i });
    const messageInput = page.getByRole("textbox", { name: /your message/i });
    const submitButton = page.getByRole("button", {
      name: "Open email draft",
    });

    await nameInput.fill("John Doe");
    await emailInput.fill("john@example.com");
    await messageInput.fill("Hello, I'm interested in your services.");

    // Verify the mailto link is constructed correctly
    const hrefValue = await submitButton.getAttribute("href");
    expect(hrefValue).toContain("mailto:");
    expect(hrefValue).toContain("john@example.com");
    expect(hrefValue).toContain("Hello, I'm interested in your services.");
  });

  test("clears form fields after interaction", async ({ page }) => {
    const nameInput = page.getByRole("textbox", { name: /your name/i });

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
