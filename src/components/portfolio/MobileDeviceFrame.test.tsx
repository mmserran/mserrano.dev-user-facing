import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MobileDeviceFrame from "./MobileDeviceFrame";

const SCREENSHOT = "screencapture-cygnusmgmt-mobile-services.jpg";

function loadWith(img: HTMLImageElement, naturalWidth: number, naturalHeight: number) {
  Object.defineProperty(img, "naturalWidth", { value: naturalWidth, configurable: true });
  Object.defineProperty(img, "naturalHeight", { value: naturalHeight, configurable: true });
  fireEvent.load(img);
}

describe("MobileDeviceFrame", () => {
  it("renders nothing when the screenshot has no manifest variants", () => {
    const { container } = render(
      <MobileDeviceFrame filename="unknown.jpg" device="mobile-iphone4" offset="0%" reducedMotion={false} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the device frame and the screenshot for a known screenshot", () => {
    const { container } = render(
      <MobileDeviceFrame filename={SCREENSHOT} device="mobile-iphoneXs" offset="0%" reducedMotion={false} />,
    );

    expect(container.querySelector('img[src*="mobile-iphoneXs.svg"]')).not.toBeNull();
    expect(container.querySelector(`img[src*="${SCREENSHOT.replace(".jpg", "")}"]`)).not.toBeNull();
  });

  it("applies a static crop directly from a percentage offset, with no pan animation class", () => {
    const { container } = render(
      <MobileDeviceFrame filename={SCREENSHOT} device="mobile-iphone4" offset="66%" reducedMotion={false} />,
    );
    const screenshot = container.querySelector(`img[src*="${SCREENSHOT.replace(".jpg", "")}"]`) as HTMLImageElement;

    expect(screenshot.style.objectPosition).toBe("0 66%");
    expect(screenshot.className).not.toMatch(/animate-mosaic-/);
  });

  it("applies the matching pan animation class for each named offset", () => {
    const cases: [string, string][] = [
      ["slowScrollFromTop", "animate-mosaic-slow-scroll-from-top"],
      ["footerScrollUp", "animate-mosaic-footer-scroll-up"],
      ["midScroll", "animate-mosaic-mid-scroll"],
    ];

    for (const [offset, animationClass] of cases) {
      const { container } = render(
        <MobileDeviceFrame filename={SCREENSHOT} device="mobile-iphone4" offset={offset} reducedMotion={false} />,
      );
      const screenshot = container.querySelector(`img[src*="${SCREENSHOT.replace(".jpg", "")}"]`) as HTMLImageElement;
      expect(screenshot.className).toContain(animationClass);
      expect(screenshot.style.objectPosition).toBe("");
    }
  });

  it("freezes a named offset to its resting crop under reduced motion instead of animating", () => {
    const { container } = render(
      <MobileDeviceFrame filename={SCREENSHOT} device="mobile-iphone4" offset="footerScrollUp" reducedMotion />,
    );
    const screenshot = container.querySelector(`img[src*="${SCREENSHOT.replace(".jpg", "")}"]`) as HTMLImageElement;

    expect(screenshot.className).not.toMatch(/animate-mosaic-/);
    expect(screenshot.style.objectPosition).toBe("0 70%");
  });

  it("scales the pan duration with the loaded image's height for a named offset", () => {
    const { container } = render(
      <MobileDeviceFrame filename={SCREENSHOT} device="mobile-iphone4" offset="midScroll" reducedMotion={false} />,
    );
    const screenshot = container.querySelector(`img[src*="${SCREENSHOT.replace(".jpg", "")}"]`) as HTMLImageElement;

    // naturalWidth 400, naturalHeight 4000 -> aspect 10, reference width 400 (this screenshot's
    // only manifest variant) -> effective height 4000 -> duration = max(4, (4000/1000)*1.5) = 6s
    loadWith(screenshot, 400, 4000);
    expect(screenshot.style.animationDuration).toBe("6s");
  });

  it("does not measure or apply a duration for a static percentage offset", () => {
    const { container } = render(
      <MobileDeviceFrame filename={SCREENSHOT} device="mobile-iphone4" offset="33%" reducedMotion={false} />,
    );
    const screenshot = container.querySelector(`img[src*="${SCREENSHOT.replace(".jpg", "")}"]`) as HTMLImageElement;

    loadWith(screenshot, 400, 4000);
    expect(screenshot.style.animationDuration).toBe("");
  });
});
