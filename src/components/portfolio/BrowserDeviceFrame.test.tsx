import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BrowserDeviceFrame from "./BrowserDeviceFrame";

function loadWith(img: HTMLImageElement, naturalWidth: number, naturalHeight: number) {
  Object.defineProperty(img, "naturalWidth", { value: naturalWidth, configurable: true });
  Object.defineProperty(img, "naturalHeight", { value: naturalHeight, configurable: true });
  fireEvent.load(img);
}

describe("BrowserDeviceFrame", () => {
  it("renders nothing when the screenshot has no manifest variants", () => {
    const { container } = render(<BrowserDeviceFrame filename="unknown.jpg" browser="chrome" animate={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the frame chrome and screenshot for a known screenshot", () => {
    const { container } = render(
      <BrowserDeviceFrame filename="screencapture-cygnusmgmt-desktop.jpg" browser="chrome" animate={false} />,
    );

    const frame = container.querySelector('img[src*="browser-chrome.svg"]');
    const screenshot = container.querySelector('img[src*="screencapture-cygnusmgmt-desktop"]');
    expect(frame).not.toBeNull();
    expect(screenshot).not.toBeNull();
  });

  it("squares off the bottom corners for the ie8 frame but rounds every other frame", () => {
    const { container: ie8Container } = render(
      <BrowserDeviceFrame filename="screencapture-cygnusmgmt-desktop.jpg" browser="ie8" animate={false} />,
    );
    const { container: chromeContainer } = render(
      <BrowserDeviceFrame filename="screencapture-cygnusmgmt-desktop.jpg" browser="chrome" animate={false} />,
    );

    expect(ie8Container.querySelector(".rounded-b-\\[4px\\]")).toBeNull();
    expect(chromeContainer.querySelector(".rounded-b-\\[4px\\]")).not.toBeNull();
  });

  it("only applies the pan animation class when animate is true", () => {
    const { container, rerender } = render(
      <BrowserDeviceFrame filename="screencapture-cygnusmgmt-desktop.jpg" browser="chrome" animate={false} />,
    );

    const screenshot = () => container.querySelector('img[src*="screencapture-cygnusmgmt-desktop"]') as HTMLImageElement;
    expect(screenshot().className).not.toContain("animate-project-screenshot-pan");

    rerender(<BrowserDeviceFrame filename="screencapture-cygnusmgmt-desktop.jpg" browser="chrome" animate />);
    expect(screenshot().className).toContain("animate-project-screenshot-pan");
  });

  it("rests at the top crop by default and the bottom crop when restPosition is bottom", () => {
    const { container, rerender } = render(
      <BrowserDeviceFrame filename="screencapture-cygnusmgmt-desktop.jpg" browser="chrome" animate={false} />,
    );

    const screenshot = () => container.querySelector('img[src*="screencapture-cygnusmgmt-desktop"]') as HTMLImageElement;
    expect(screenshot().className).toContain("object-left-top");
    expect(screenshot().className).not.toContain("object-left-bottom");

    rerender(
      <BrowserDeviceFrame
        filename="screencapture-cygnusmgmt-desktop.jpg"
        browser="chrome"
        animate={false}
        restPosition="bottom"
      />,
    );
    expect(screenshot().className).toContain("object-left-bottom");
    expect(screenshot().className).not.toContain("object-left-top");
  });

  it("scales the pan duration with the loaded image's height, flooring short screenshots at 4s", () => {
    const { container } = render(
      <BrowserDeviceFrame filename="screencapture-cygnusmgmt-desktop.jpg" browser="chrome" animate />,
    );
    const screenshot = container.querySelector('img[src*="screencapture-cygnusmgmt-desktop"]') as HTMLImageElement;

    // naturalWidth 1600, naturalHeight 16000 -> duration = max(4, (16000/1000)*3.24) = 51.84s
    loadWith(screenshot, 1600, 16000);
    expect(screenshot.style.animationDuration).toBe("51.84s");
  });

  it("floors the computed duration at 4s for a short screenshot", () => {
    const { container } = render(
      <BrowserDeviceFrame filename="screencapture-cygnusmgmt-desktop.jpg" browser="chrome" animate />,
    );
    const screenshot = container.querySelector('img[src*="screencapture-cygnusmgmt-desktop"]') as HTMLImageElement;

    // naturalWidth 1600, naturalHeight 1100 -> duration = max(4, (1100/1000)*3.24) = max(4, 3.564) = 4s
    loadWith(screenshot, 1600, 1100);
    expect(screenshot.style.animationDuration).toBe("4s");
  });

  it("normalizes the computed duration by aspect ratio, independent of which responsive width loaded", () => {
    const { container } = render(
      <BrowserDeviceFrame filename="screencapture-cygnusmgmt-desktop.jpg" browser="chrome" animate />,
    );
    const screenshot = container.querySelector('img[src*="screencapture-cygnusmgmt-desktop"]') as HTMLImageElement;

    // Same aspect ratio as the 1600x16000 case above (1:10), but as if the
    // browser loaded the smaller 400w manifest variant instead - the
    // computed duration should still normalize back to 51.84s.
    loadWith(screenshot, 400, 4000);
    expect(screenshot.style.animationDuration).toBe("51.84s");
  });

  it("does not measure a duration or report it when not animating", () => {
    const onPanDuration = vi.fn();
    const { container } = render(
      <BrowserDeviceFrame
        filename="screencapture-cygnusmgmt-desktop.jpg"
        browser="chrome"
        animate={false}
        onPanDuration={onPanDuration}
      />,
    );
    const screenshot = container.querySelector('img[src*="screencapture-cygnusmgmt-desktop"]') as HTMLImageElement;

    loadWith(screenshot, 1600, 16000);
    expect(screenshot.style.animationDuration).toBe("");
    expect(onPanDuration).not.toHaveBeenCalled();
  });

  it("reports the computed duration to onPanDuration when animating", () => {
    const onPanDuration = vi.fn();
    const { container } = render(
      <BrowserDeviceFrame filename="screencapture-cygnusmgmt-desktop.jpg" browser="chrome" animate onPanDuration={onPanDuration} />,
    );
    const screenshot = container.querySelector('img[src*="screencapture-cygnusmgmt-desktop"]') as HTMLImageElement;

    loadWith(screenshot, 1600, 16000);
    expect(onPanDuration).toHaveBeenCalledWith(51.84);
  });

  it("does not pan a screenshot that's barely taller than the frame - it rests statically instead", () => {
    const onPanDuration = vi.fn();
    const { container } = render(
      <BrowserDeviceFrame
        filename="screencapture-cygnusmgmt-desktop.jpg"
        browser="chrome"
        animate
        onPanDuration={onPanDuration}
      />,
    );
    const screenshot = container.querySelector('img[src*="screencapture-cygnusmgmt-desktop"]') as HTMLImageElement;

    // aspect ratio 0.5 is well under the cutout's own ~0.56 aspect ratio,
    // meaning object-fit: cover has no vertical overflow to pan through.
    loadWith(screenshot, 1000, 500);

    expect(screenshot.className).not.toContain("animate-project-screenshot-pan");
    expect(screenshot.className).toContain("object-left-top");
    expect(screenshot.style.animationDuration).toBe("");
    // Still reports a duration (the floor) so the carousel paces itself
    // normally even though this slide doesn't animate.
    expect(onPanDuration).toHaveBeenCalledWith(4);
  });

  it("still pans a screenshot that clears the minimum overflow threshold", () => {
    const { container } = render(
      <BrowserDeviceFrame filename="screencapture-cygnusmgmt-desktop.jpg" browser="chrome" animate />,
    );
    const screenshot = container.querySelector('img[src*="screencapture-cygnusmgmt-desktop"]') as HTMLImageElement;

    // aspect ratio 1.0 overflows the cutout's ~0.56 aspect ratio by ~78%,
    // well clear of the 15% minimum.
    loadWith(screenshot, 1000, 1000);

    expect(screenshot.className).toContain("animate-project-screenshot-pan");
  });

  it("shows a neutral placeholder with a spinner until the screenshot loads, then hides it", () => {
    const { container } = render(
      <BrowserDeviceFrame filename="screencapture-cygnusmgmt-desktop.jpg" browser="chrome" animate={false} />,
    );
    const cutout = container.querySelector(".bg-white") as HTMLElement;
    const screenshot = container.querySelector('img[src*="screencapture-cygnusmgmt-desktop"]') as HTMLImageElement;

    expect(cutout.querySelector(".animate-spin")).not.toBeNull();

    loadWith(screenshot, 1600, 1000);
    expect(cutout.querySelector(".animate-spin")).toBeNull();
  });

  it("keeps the cutout invisible until the frame chrome loads, then reveals it", async () => {
    const { container } = render(
      <BrowserDeviceFrame filename="screencapture-cygnusmgmt-desktop.jpg" browser="chrome" animate={false} />,
    );
    const cutout = container.querySelector(".bg-white") as HTMLElement;
    const frame = container.querySelector('img[src*="browser-chrome.svg"]') as HTMLImageElement;

    // Loaded before the frame chrome has - the placeholder/screenshot must
    // still stay hidden so they never appear without the frame around them.
    const screenshot = container.querySelector('img[src*="screencapture-cygnusmgmt-desktop"]') as HTMLImageElement;
    loadWith(screenshot, 1600, 1000);
    expect(cutout.className).toContain("invisible");

    // next/image defers to img.decode() (a microtask) before calling its
    // onLoad prop, so the reveal doesn't land synchronously with the event.
    loadWith(frame, 644, 460);
    await waitFor(() => expect(cutout.className).not.toContain("invisible"));
  });

  it("re-shows the placeholder for the next screenshot when the filename changes", () => {
    const { container, rerender } = render(
      <BrowserDeviceFrame filename="screencapture-cygnusmgmt-desktop.jpg" browser="chrome" animate={false} />,
    );
    const cutout = container.querySelector(".bg-white") as HTMLElement;
    const firstScreenshot = container.querySelector('img[src*="screencapture-cygnusmgmt-desktop"]') as HTMLImageElement;
    loadWith(firstScreenshot, 1600, 1000);
    expect(cutout.querySelector(".animate-spin")).toBeNull();

    rerender(
      <BrowserDeviceFrame filename="screencapture-hospitalitypulse-desktop.jpg" browser="chrome" animate={false} />,
    );
    expect(cutout.querySelector(".animate-spin")).not.toBeNull();
  });

  it("skips the placeholder when the image is already complete by the time it mounts", () => {
    const completeSpy = vi
      .spyOn(window.HTMLImageElement.prototype, "complete", "get")
      .mockReturnValue(true);

    const { container } = render(
      <BrowserDeviceFrame filename="screencapture-cygnusmgmt-desktop.jpg" browser="chrome" animate={false} />,
    );
    const cutout = container.querySelector(".bg-white") as HTMLElement;

    expect(cutout.querySelector(".animate-spin")).toBeNull();

    completeSpy.mockRestore();
  });
});
