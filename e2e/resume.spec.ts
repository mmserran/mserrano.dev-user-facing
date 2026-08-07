import { expect, test } from "@playwright/test";

test.describe("Resume Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/resume/");
  });

  test("has correct page title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("Resume | Mark Anthony Serrano");

    const pageHeading = page.getByRole("heading", {
      level: 1,
      name: "Resume",
    });
    await expect(pageHeading).toBeVisible();
  });

  test("embeds PDF document with correct media source", async ({ page }) => {
    const pdfObject = page.locator('object[type="application/pdf"]');
    await expect(pdfObject).toHaveAttribute(
      "aria-label",
      "Mark Anthony Serrano resume",
    );

    const pdfDataUrl = await pdfObject.getAttribute("data");
    expect(pdfDataUrl).toMatch(/^\/media\/.*\.pdf$/i);
  });

  test("renders social and document quick links with secure external targets", async ({
    page,
  }) => {
    const resumeNav = page.getByRole("navigation", { name: "Resume links" });

    const resumeLink = resumeNav.getByRole("link", {
      name: "Resume (opens in a new tab)",
    });
    await expect(resumeLink).toBeVisible();
    await expect(resumeLink).toHaveAttribute("target", "_blank");
    await expect(resumeLink).toHaveAttribute("rel", "noopener noreferrer");

    const linkedInLink = resumeNav.getByRole("link", {
      name: "LinkedIn (opens in a new tab)",
    });
    await expect(linkedInLink).toBeVisible();
    await expect(linkedInLink).toHaveAttribute("target", "_blank");
    await expect(linkedInLink).toHaveAttribute("rel", "noopener noreferrer");
    const linkedInHref = await linkedInLink.getAttribute("href");
    expect(linkedInHref).toMatch(/linkedin\.com/i);

    const gitHubLink = resumeNav.getByRole("link", {
      name: "GitHub (opens in a new tab)",
    });
    await expect(gitHubLink).toBeVisible();
    await expect(gitHubLink).toHaveAttribute("target", "_blank");
    await expect(gitHubLink).toHaveAttribute("rel", "noopener noreferrer");
    const gitHubHref = await gitHubLink.getAttribute("href");
    expect(gitHubHref).toMatch(/github\.com/i);
  });

  test("renders CTA button linking to portfolio catalog", async ({ page }) => {
    const portfolioBtn = page.getByRole("link", {
      name: "View My Portfolio",
    });
    await expect(portfolioBtn).toBeVisible();
    await expect(portfolioBtn).toHaveAttribute("href", "/projects/");
  });
});
