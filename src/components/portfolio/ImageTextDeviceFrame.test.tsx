import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ImageTextDeviceFrame from "./ImageTextDeviceFrame";

const KNOWN_FILENAME = "screencapture-hospitalitypulse-desktop-before-redesign.jpg";

describe("ImageTextDeviceFrame", () => {
  it("renders nothing when the screenshot has no manifest variants", () => {
    const { container } = render(<ImageTextDeviceFrame filename="unknown.jpg" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the chrome frame and screenshot for a known screenshot", () => {
    const { container } = render(<ImageTextDeviceFrame filename={KNOWN_FILENAME} />);

    expect(container.querySelector('img[src*="browser-chrome.svg"]')).not.toBeNull();
    expect(container.querySelector(`img[src*="${KNOWN_FILENAME.replace(".jpg", "")}"]`)).not.toBeNull();
  });

  it("rests at the top crop and pans to the bottom crop only on hover", () => {
    const { container } = render(<ImageTextDeviceFrame filename={KNOWN_FILENAME} />);
    const screenshot = container.querySelector(
      `img[src*="${KNOWN_FILENAME.replace(".jpg", "")}"]`,
    ) as HTMLImageElement;

    expect(screenshot.className).toContain("object-top");
    expect(screenshot.className).toContain("group-hover:object-bottom");
  });

  it("pans in slowly on hover but snaps back faster on release, like ProjectTileImage's catalog-tile pan", () => {
    const { container } = render(<ImageTextDeviceFrame filename={KNOWN_FILENAME} />);
    const screenshot = container.querySelector(
      `img[src*="${KNOWN_FILENAME.replace(".jpg", "")}"]`,
    ) as HTMLImageElement;

    // Resting/release duration (no variant prefix) is the snap-back; the
    // group-hover-prefixed duration is the slow pan-in.
    expect(screenshot.className).toContain("duration-[1200ms]");
    expect(screenshot.className).toContain("group-hover:duration-[4000ms]");
  });

  it("shows a neutral placeholder with a spinner until the screenshot loads, then hides it", () => {
    const { container } = render(<ImageTextDeviceFrame filename={KNOWN_FILENAME} />);
    const cutout = container.querySelector(".bg-white") as HTMLElement;
    const screenshot = container.querySelector(
      `img[src*="${KNOWN_FILENAME.replace(".jpg", "")}"]`,
    ) as HTMLImageElement;

    expect(cutout.querySelector(".animate-spin")).not.toBeNull();

    fireEvent.load(screenshot);
    expect(cutout.querySelector(".animate-spin")).toBeNull();
  });

  it("keeps the cutout invisible until the frame chrome loads, then reveals it", async () => {
    const { container } = render(<ImageTextDeviceFrame filename={KNOWN_FILENAME} />);
    const cutout = container.querySelector(".bg-white") as HTMLElement;
    const frame = container.querySelector('img[src*="browser-chrome.svg"]') as HTMLImageElement;

    expect(cutout.className).toContain("invisible");

    fireEvent.load(frame);
    await waitFor(() => expect(cutout.className).not.toContain("invisible"));
  });

  it("skips the placeholder and reveals the cutout immediately when both images are already complete by the time it mounts", () => {
    const completeSpy = vi
      .spyOn(window.HTMLImageElement.prototype, "complete", "get")
      .mockReturnValue(true);

    const { container } = render(<ImageTextDeviceFrame filename={KNOWN_FILENAME} />);
    const cutout = container.querySelector(".bg-white") as HTMLElement;

    expect(cutout.querySelector(".animate-spin")).toBeNull();
    expect(cutout.className).not.toContain("invisible");

    completeSpy.mockRestore();
  });
});
