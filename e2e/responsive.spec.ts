import { expect, test } from "@playwright/test";

test.describe("Responsive Viewports", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("closes mobile drawer when clicking dark backdrop overlay", async ({
    page,
  }) => {
    await page.goto("/");

    const menuButton = page.getByRole("button", { name: "Open navigation" });
    await menuButton.click();

    const closeButton = page.getByRole("button", { name: "Close navigation" });
    await expect(closeButton).toBeVisible();

    // Click outside the drawer on the backdrop (e.g. right side of screen)
    await page.mouse.click(320, 200);

    const openMenuButton = page.getByRole("button", {
      name: "Open navigation",
    });
    await expect(openMenuButton).toBeVisible();
  });

  test("renders mobile PDF fallback container on small screens", async ({
    page,
  }) => {
    await page.goto("/resume/");

    const fallbackHeading = page.getByRole("heading", {
      level: 3,
      name: "Resume PDF",
    });
    await expect(fallbackHeading).toBeVisible();

    const openPdfBtn = page.getByRole("link", {
      name: "Open resume PDF (opens in a new tab)",
    });
    await expect(openPdfBtn).toBeVisible();
    await expect(openPdfBtn).toHaveAttribute("target", "_blank");
  });
});
