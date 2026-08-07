import { expect, test } from "@playwright/test";

test.describe("Contact Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact/");
  });

  test("serves the contact page from the static export", async ({ page }) => {
    const response = await page.goto("/contact/");

    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle("Contact | Mark Anthony Serrano");
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
    const nameInput = page.getByRole("textbox", { name: /your name/i });

    await nameInput.fill("Test Name");
    await expect(nameInput).toHaveValue("Test Name");
  });

  test("clears form fields after interaction", async ({ page }) => {
    const nameInput = page.getByRole("textbox", { name: /your name/i });

    await nameInput.fill("Test Name");
    await expect(nameInput).toHaveValue("Test Name");

    await nameInput.clear();
    await expect(nameInput).toHaveValue("");
  });

  test("renders contact form with secure mailto link", async ({ page }) => {
    const name = "Test User";
    const email = "test@example.com";
    const message = "Hello there";

    await page.getByRole("textbox", { name: /your name/i }).fill(name);
    await page.getByRole("textbox", { name: /your e-mail/i }).fill(email);
    await page.getByRole("textbox", { name: /your message/i }).fill(message);

    await page.evaluate(() => {
      type OpenedCall = { url: string; target: string; features: string };
      (window as unknown as { __mailtoOpens: OpenedCall[] }).__mailtoOpens = [];
      window.open = ((url?: string | URL, target?: string, features?: string) => {
        (window as unknown as { __mailtoOpens: OpenedCall[] }).__mailtoOpens.push({
          url: String(url ?? ""),
          target: String(target ?? ""),
          features: String(features ?? ""),
        });
        return null;
      }) as typeof window.open;
    });

    await page.getByRole("button", { name: "Open email draft" }).click();

    const opens = await page.evaluate(
      () =>
        (window as unknown as {
          __mailtoOpens: { url: string; target: string; features: string }[];
        }).__mailtoOpens,
    );

    expect(opens).toHaveLength(1);
    expect(opens[0].target).toBe("_blank");
    expect(opens[0].features).toBe("noopener,noreferrer");
    expect(opens[0].url).toMatch(/^mailto:[^?]+\?subject=.+&body=.+/);
    expect(opens[0].url).toContain(
      `subject=${encodeURIComponent(`Message from ${name}`)}`,
    );
    expect(opens[0].url).toContain(
      encodeURIComponent(`${message}\r\n\r\n—\r\nFrom: ${name} <${email}>`),
    );
  });
});
