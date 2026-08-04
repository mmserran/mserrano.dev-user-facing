import { expect, test } from "@playwright/test";
import path from "node:path";

const DESKTOP = { width: 1440, height: 900 };

test.describe("Desktop sidebar first-paint open (pure CSS)", () => {
  test.use({ viewport: DESKTOP });

  test("sidebar is open on load with no data-forced override, and manual toggle still works", async ({
    page,
  }, testInfo) => {
    await page.goto("/");

    const drawer = page.locator("#site-drawer");
    const menuButton = page.getByRole("button", { name: /navigation/i });

    // Pure CSS default: no forced override; cascade leaves open at min-width 1264px.
    await expect(drawer).not.toHaveAttribute("data-forced");
    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
    await expect(drawer).toHaveAttribute("aria-hidden", "false");
    await expect(drawer).not.toHaveAttribute("inert");

    // Tailwind v4 translate utilities set the CSS `translate` property (and
    // --tw-translate-x), not the legacy `transform` matrix.
    const firstPaint = await drawer.evaluate((el) => {
      const cs = getComputedStyle(el);
      const main = document.getElementById("main-content");
      return {
        translateProp: cs.translate,
        translateVar: cs.getPropertyValue("--tw-translate-x").trim(),
        left: el.getBoundingClientRect().left,
        visibility: cs.visibility,
        mainPaddingLeft: main ? getComputedStyle(main).paddingLeft : null,
        hasMinDesktopClass: el.className.includes("min-[1264px]:translate-x-0"),
        viewportWidth: window.innerWidth,
      };
    });

    expect(firstPaint.viewportWidth).toBeGreaterThanOrEqual(1264);
    expect(firstPaint.left).toBe(0);
    expect(firstPaint.visibility).toBe("visible");
    expect(firstPaint.mainPaddingLeft).toBe("256px");
    expect(firstPaint.hasMinDesktopClass).toBe(true);
    // Open desktop default: no off-screen translation.
    expect(["none", "0px", "0px 0px", ""]).toContain(firstPaint.translateProp);

    const screenshotsDir = path.join(
      testInfo.project.outputDir,
      "desktop-sidebar-first-paint",
    );
    const loadShot = path.join(screenshotsDir, "desktop-load-open.png");
    await page.screenshot({ path: loadShot, fullPage: false });
    await testInfo.attach("desktop-load-open", {
      path: loadShot,
      contentType: "image/png",
    });

    // Explicit user toggle must override the CSS default and close the drawer.
    await menuButton.click();
    await expect(drawer).toHaveAttribute("data-forced", "closed");
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await expect(drawer).toHaveAttribute("aria-hidden", "true");
    await expect(drawer).toHaveAttribute("inert");

    await expect
      .poll(async () =>
        drawer.evaluate((el) => {
          const cs = getComputedStyle(el);
          return {
            // -translate-x-full → --tw-translate-x: -100%
            translateVar: cs.getPropertyValue("--tw-translate-x").trim(),
            left: el.getBoundingClientRect().left,
            visibility: cs.visibility,
            mainPaddingLeft: getComputedStyle(
              document.getElementById("main-content")!,
            ).paddingLeft,
          };
        }),
      )
      .toMatchObject({
        translateVar: "-100%",
        left: -256,
        visibility: "hidden",
        mainPaddingLeft: "0px",
      });

    const closedShot = path.join(screenshotsDir, "desktop-forced-closed.png");
    await page.screenshot({ path: closedShot, fullPage: false });
    await testInfo.attach("desktop-forced-closed", {
      path: closedShot,
      contentType: "image/png",
    });

    // Reopen via toggle — forced open should win and animate back into view.
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(drawer).toHaveAttribute("data-forced", "open");
    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
    await expect(drawer).toHaveAttribute("aria-hidden", "false");

    await expect
      .poll(async () =>
        drawer.evaluate((el) => {
          const cs = getComputedStyle(el);
          return {
            translateVar: cs.getPropertyValue("--tw-translate-x").trim(),
            left: el.getBoundingClientRect().left,
            visibility: cs.visibility,
          };
        }),
      )
      .toMatchObject({ translateVar: "0px", left: 0, visibility: "visible" });

    const reopenedShot = path.join(screenshotsDir, "desktop-forced-reopen.png");
    await page.screenshot({ path: reopenedShot, fullPage: false });
    await testInfo.attach("desktop-forced-reopen", {
      path: reopenedShot,
      contentType: "image/png",
    });
  });
});
