import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ImageTextMedia } from "@/lib/content";
import ImageTextVideo from "./ImageTextVideo";

const { PlyrMock, destroyMock } = vi.hoisted(() => {
  const destroyMock = vi.fn();
  function PlyrMock() {
    return { destroy: destroyMock };
  }
  return { PlyrMock: vi.fn(PlyrMock), destroyMock };
});

vi.mock("plyr", () => ({ default: PlyrMock }));
vi.mock("plyr/dist/plyr.css", () => ({}));

// jsdom doesn't implement IntersectionObserver - this fake captures the
// callback the component registers so tests can fire it manually, mirroring
// Carousel.test.tsx/MobileMosaic.test.tsx's own FakeResizeObserver pattern.
let intersectionCallback: IntersectionObserverCallback | undefined;
const observeSpy = vi.fn();
const disconnectSpy = vi.fn();

class FakeIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    intersectionCallback = callback;
  }
  observe = observeSpy;
  disconnect() {
    disconnectSpy();
    intersectionCallback = undefined;
  }
}

function fireIntersection(isIntersecting: boolean) {
  intersectionCallback?.(
    [{ isIntersecting } as IntersectionObserverEntry],
    {} as IntersectionObserver,
  );
}

beforeEach(() => {
  intersectionCallback = undefined;
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});

const KNOWN_FILENAME = "animation-hospitalitypulse-oldFadeInEffect.mp4";

function makeMedia(overrides: Partial<ImageTextMedia> = {}): ImageTextMedia {
  return {
    filename: KNOWN_FILENAME,
    format: "video",
    isScreenshot: false,
    usePlayer: false,
    ...overrides,
  };
}

describe("ImageTextVideo", () => {
  it("renders nothing when the video has no manifest variant", () => {
    const { container } = render(<ImageTextVideo media={makeMedia({ filename: "unknown.mp4" })} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders a muted, non-looping, non-autoplaying video sourced from the manifest URL", () => {
    const { container } = render(<ImageTextVideo media={makeMedia()} />);

    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video).not.toBeNull();
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(false);
    expect(video.autoplay).toBe(false);
    expect(container.querySelector(`source[src*="${KNOWN_FILENAME}"]`)).not.toBeNull();
  });

  it("plays once as soon as it scrolls into the viewport, then stops observing", () => {
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    render(<ImageTextVideo media={makeMedia()} />);

    expect(observeSpy).toHaveBeenCalledTimes(1);
    expect(playSpy).not.toHaveBeenCalled();

    fireIntersection(false);
    expect(playSpy).not.toHaveBeenCalled();

    fireIntersection(true);
    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(disconnectSpy).toHaveBeenCalledTimes(1);

    // A later re-entry into the viewport must not play it again.
    fireIntersection(true);
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it("does not initialize Plyr when usePlayer is false", async () => {
    render(<ImageTextVideo media={makeMedia({ usePlayer: false })} />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(PlyrMock).not.toHaveBeenCalled();
  });

  it("initializes Plyr against the video element when usePlayer is true, and destroys it on unmount", async () => {
    const { container, unmount } = render(<ImageTextVideo media={makeMedia({ usePlayer: true })} />);

    await waitFor(() => expect(PlyrMock).toHaveBeenCalledTimes(1));
    const video = container.querySelector("video");
    expect(PlyrMock).toHaveBeenCalledWith(video);

    unmount();
    expect(destroyMock).toHaveBeenCalledTimes(1);
  });
});
