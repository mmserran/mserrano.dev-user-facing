import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProjectScreenshotCarousel from "./ProjectScreenshotCarousel";

const SCREENSHOTS = [
  "screencapture-cygnusmgmt-desktop.jpg",
  "screencapture-cygnusmgmt-desktop-services.jpg",
  "screencapture-cygnusmgmt-desktop-pricing.jpg",
];
const BROWSERS = ["firefox", "chrome", "safari"];

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

  it("advances to the next screenshot and browser skin, wrapping the browser list, after each slide's duration", () => {
    const { container } = render(
      <ProjectScreenshotCarousel screenshots={SCREENSHOTS} supportedBrowsers={BROWSERS} />,
    );

    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(container.querySelector('img[src*="browser-chrome.svg"]')).not.toBeNull();
    expect(container.querySelector('img[src*="screencapture-cygnusmgmt-desktop-services-1600"]')).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(container.querySelector('img[src*="browser-safari.svg"]')).not.toBeNull();
    expect(container.querySelector('img[src*="screencapture-cygnusmgmt-desktop-pricing-1600"]')).not.toBeNull();

    // Wraps back to the first screenshot; only 3 browsers were supplied for
    // 3 screenshots here, so the skin wraps back to firefox too.
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(container.querySelector('img[src*="browser-firefox.svg"]')).not.toBeNull();
    expect(container.querySelector('img[src*="screencapture-cygnusmgmt-desktop-1600"]')).not.toBeNull();
  });

  it("under reduced motion, stays on the first screenshot without animating or advancing", () => {
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
  });
});
