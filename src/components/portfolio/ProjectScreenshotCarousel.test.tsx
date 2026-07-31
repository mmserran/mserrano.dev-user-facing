import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProjectScreenshotCarousel from "./ProjectScreenshotCarousel";

const SCREENSHOTS = [
  "screencapture-cygnusmgmt-desktop.jpg",
  "screencapture-cygnusmgmt-desktop-services.jpg",
  "screencapture-cygnusmgmt-desktop-pricing.jpg",
];
const BROWSERS = ["firefox", "chrome", "safari"];

// Simulates the active screenshot's image finishing its (mocked) load with
// the given natural dimensions, so BrowserDeviceFrame computes and reports
// a pan duration - jsdom never actually loads image bytes, so naturalWidth/
// naturalHeight default to 0 and the `load` event never fires on its own.
function loadActiveScreenshot(container: HTMLElement, naturalWidth: number, naturalHeight: number) {
  const img = container.querySelector('img[src*="screencapture-cygnusmgmt"]') as HTMLImageElement;
  Object.defineProperty(img, "naturalWidth", { value: naturalWidth, configurable: true });
  Object.defineProperty(img, "naturalHeight", { value: naturalHeight, configurable: true });
  fireEvent.load(img);
}

describe("ProjectScreenshotCarousel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when there are no desktop screenshots", () => {
    const { container } = render(<ProjectScreenshotCarousel screenshots={[]} supportedBrowsers={BROWSERS} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("starts on the first screenshot with the first browser skin, animating", () => {
    const { container } = render(
      <ProjectScreenshotCarousel screenshots={SCREENSHOTS} supportedBrowsers={BROWSERS} />,
    );

    expect(container.querySelector('img[src*="browser-firefox.svg"]')).not.toBeNull();
    expect(container.querySelector('img[src*="screencapture-cygnusmgmt-desktop-1600"]')).not.toBeNull();
    const screenshot = container.querySelector('img[src*="screencapture-cygnusmgmt-desktop-1600"]') as HTMLImageElement;
    expect(screenshot.className).toContain("animate-project-screenshot-pan");
  });

  it("advances only after the active screenshot's measured pan duration, not a fixed interval", () => {
    const { container } = render(
      <ProjectScreenshotCarousel screenshots={SCREENSHOTS} supportedBrowsers={BROWSERS} />,
    );

    // naturalWidth 1600, naturalHeight 16000 -> duration = max(4, (16000/1000)*1.5) = 24s
    act(() => {
      loadActiveScreenshot(container, 1600, 16000);
    });

    act(() => {
      vi.advanceTimersByTime(23999);
    });
    expect(
      container.querySelector('img[src*="screencapture-cygnusmgmt-desktop-1600"]')?.closest(".animate-carousel-fade-out"),
    ).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    // The measured 24s duration elapsed - the outgoing slide starts fading.
    const outgoing = container.querySelector('img[src*="screencapture-cygnusmgmt-desktop-1600"]') as HTMLImageElement;
    expect(outgoing.closest(".animate-carousel-fade-out")).not.toBeNull();
  });

  it("falls back to a 4s advance if the active screenshot never reports a measured duration", () => {
    const { container } = render(
      <ProjectScreenshotCarousel screenshots={SCREENSHOTS} supportedBrowsers={BROWSERS} />,
    );

    act(() => {
      vi.advanceTimersByTime(3999);
    });
    expect(container.querySelector('img[src*="screencapture-cygnusmgmt-desktop-1600"]')?.closest(".animate-carousel-fade-out")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(
      container.querySelector('img[src*="screencapture-cygnusmgmt-desktop-1600"]')?.closest(".animate-carousel-fade-out"),
    ).not.toBeNull();
  });

  it("keeps a low-overflow screenshot at the top crop while it fades out", () => {
    const { container } = render(
      <ProjectScreenshotCarousel screenshots={SCREENSHOTS} supportedBrowsers={BROWSERS} />,
    );

    act(() => {
      loadActiveScreenshot(container, 1600, 1000);
      vi.advanceTimersByTime(4000);
    });

    const outgoing = container.querySelector(
      'img[src*="screencapture-cygnusmgmt-desktop-1600"]',
    ) as HTMLImageElement;
    expect(outgoing.closest(".animate-carousel-fade-out")).not.toBeNull();
    expect(outgoing.className).toContain("object-left-top");
    expect(outgoing.className).not.toContain("object-left-bottom");
  });

  it("sequences a slide change as fade-out, a blank pause, then fade-in - never overlapping the two slides", () => {
    const { container } = render(
      <ProjectScreenshotCarousel screenshots={SCREENSHOTS} supportedBrowsers={BROWSERS} />,
    );

    // No load simulated, so this relies on the 4s fallback.
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    const outgoingFrame = container.querySelector('img[src*="browser-firefox.svg"]');
    const outgoingShot = container.querySelector('img[src*="screencapture-cygnusmgmt-desktop-1600"]') as HTMLImageElement;
    expect(outgoingFrame).not.toBeNull();
    expect(outgoingShot.className).toContain("object-left-bottom");
    expect(outgoingShot.className).not.toContain("animate-project-screenshot-pan");
    expect(outgoingShot.closest(".animate-carousel-fade-out")).not.toBeNull();
    expect(container.querySelectorAll("img")).toHaveLength(2); // frame + screenshot, nothing else

    // Once the fade-out finishes, there's a blank pause - nothing rendered.
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(container.querySelectorAll("img")).toHaveLength(0);

    // After the pause, the incoming slide (chrome/services) mounts and
    // fades in, panning from the top.
    act(() => {
      vi.advanceTimersByTime(200);
    });
    const incomingFrame = container.querySelector('img[src*="browser-chrome.svg"]');
    const incomingShot = container.querySelector(
      'img[src*="screencapture-cygnusmgmt-desktop-services-1600"]',
    ) as HTMLImageElement;
    expect(incomingFrame).not.toBeNull();
    expect(incomingShot.className).toContain("animate-project-screenshot-pan");
    expect(incomingShot.closest(".animate-carousel-fade-in")).not.toBeNull();
    expect(container.querySelectorAll("img")).toHaveLength(2);

    // Once the fade-in finishes, the incoming slide settles - no fade class.
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(incomingShot.closest(".animate-carousel-fade-in")).toBeNull();
    expect(container.querySelector('img[src*="browser-chrome.svg"]')).not.toBeNull();
  });

  it("wraps the browser list once it advances through every screenshot", () => {
    const { container } = render(
      <ProjectScreenshotCarousel screenshots={SCREENSHOTS} supportedBrowsers={BROWSERS} />,
    );
    const STEP_MS = 4000 + 300 + 200; // fallback duration + fade-out + pause, enough to reach fade-in

    act(() => {
      vi.advanceTimersByTime(STEP_MS);
    });
    expect(container.querySelector('img[src*="browser-chrome.svg"]')).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(300 + STEP_MS); // settle to idle, then run the next cycle
    });
    expect(container.querySelector('img[src*="browser-safari.svg"]')).not.toBeNull();
    expect(container.querySelector('img[src*="screencapture-cygnusmgmt-desktop-pricing-1600"]')).not.toBeNull();

    // Only 3 browsers were supplied for 3 screenshots here, so the skin
    // wraps back to firefox too.
    act(() => {
      vi.advanceTimersByTime(300 + STEP_MS);
    });
    expect(container.querySelector('img[src*="browser-firefox.svg"]')).not.toBeNull();
    expect(container.querySelector('img[src*="screencapture-cygnusmgmt-desktop-1600"]')).not.toBeNull();
  });

  it("under reduced motion, stays on the first screenshot without animating, fading, or advancing", () => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(
      <ProjectScreenshotCarousel screenshots={SCREENSHOTS} supportedBrowsers={BROWSERS} />,
    );

    const screenshot = container.querySelector('img[src*="screencapture-cygnusmgmt-desktop-1600"]') as HTMLImageElement;
    expect(screenshot.className).not.toContain("animate-project-screenshot-pan");

    act(() => {
      vi.advanceTimersByTime(12000);
    });
    expect(container.querySelector('img[src*="screencapture-cygnusmgmt-desktop-1600"]')).not.toBeNull();
    expect(container.querySelector('img[src*="screencapture-cygnusmgmt-desktop-services-1600"]')).toBeNull();
    expect(container.querySelector(".animate-carousel-fade-out")).toBeNull();
  });
});
