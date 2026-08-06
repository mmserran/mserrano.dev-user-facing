import { expect, test } from "@playwright/test";

test.describe("Global Navigation & AppShell", () => {
  test("toggles side navigation drawer via menu button", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const menuButton = page.getByRole("button", { name: "Open navigation" });
    const drawer = page.getByRole("navigation", {
      name: "Primary",
      includeHidden: true,
    });

    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await expect(drawer).toHaveAttribute("aria-hidden", "true");

    await menuButton.click();

    const closeButton = page.getByRole("button", { name: "Close navigation" });
    await expect(closeButton).toBeVisible();
    await expect(closeButton).toHaveAttribute("aria-expanded", "true");
    await expect(drawer).toHaveAttribute("aria-hidden", "false");
  });

  test("closes navigation drawer when Escape key is pressed and focuses menu button", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const menuButton = page.getByRole("button", { name: "Open navigation" });
    await menuButton.click();

    await expect(
      page.getByRole("button", { name: "Close navigation" }),
    ).toBeVisible();

    await page.keyboard.press("Escape");

    const closedMenuButton = page.getByRole("button", {
      name: "Open navigation",
    });
    await expect(closedMenuButton).toBeVisible();
    await expect(closedMenuButton).toBeFocused();
  });

  test("indicates current active route with aria-current in navigation drawer", async ({
    page,
  }) => {
    await page.goto("/resume/");

    const drawer = page.getByRole("navigation", {
      name: "Primary",
      includeHidden: true,
    });
    const activeResumeLink = drawer.getByRole("link", {
      name: "Resume",
      includeHidden: true,
    });

    await expect(activeResumeLink).toHaveAttribute("aria-current", "page");

    const inactivePortfolioLink = drawer.getByRole("link", {
      name: "Portfolio",
      includeHidden: true,
    });
    await expect(inactivePortfolioLink).not.toHaveAttribute("aria-current");
  });

  test("renders skip-to-content accessibility link", async ({ page }) => {
    await page.goto("/");

    const skipLink = page.getByRole("link", { name: "Skip to content" });
    await expect(skipLink).toHaveAttribute("href", "#main-content");

    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
  });

  test("renders top header icon links with appropriate attributes", async ({
    page,
  }) => {
    await page.goto("/");

    const header = page.locator("header");
    const linkedInHeaderLink = header.getByRole("link", {
      name: "LinkedIn (opens in a new tab)",
    });
    await expect(linkedInHeaderLink).toBeVisible();
    await expect(linkedInHeaderLink).toHaveAttribute("target", "_blank");
    await expect(linkedInHeaderLink).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  });
});
