import { render, waitFor } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ImageTextMedia } from "@/lib/content";
import ImageTextVideo from "./ImageTextVideo";

// EnhancedVideoPlayer wraps the real @vidstack/react MediaPlayer; mocked here
// (loaded via VideoPlayer's next/dynamic import) with a plain <video> so
// assertions on rendered attributes stay identical to the pre-Vidstack
// native-video tests, while still proving VideoPlayer only mounts it when
// usePlayer is true.
const { EnhancedVideoPlayerMock } = vi.hoisted(() => ({
  EnhancedVideoPlayerMock: vi.fn(),
}));

vi.mock("./EnhancedVideoPlayer", () => ({
  default: function EnhancedVideoPlayerStub(props: {
    onPlayerChange?: (player: HTMLVideoElement | null) => void;
    src: string;
    poster?: string;
    muted?: boolean;
    loop?: boolean;
    autoPlay?: boolean;
    className?: string;
  }) {
    EnhancedVideoPlayerMock(props);
    const { onPlayerChange, src, poster, muted, loop, autoPlay, className } = props;
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
      onPlayerChange?.(videoRef.current);
      return () => onPlayerChange?.(null);
    }, [onPlayerChange]);

    return (
      <video ref={videoRef} className={className} muted={muted} loop={loop} autoPlay={autoPlay} poster={poster}>
        <source src={src} />
      </video>
    );
  },
}));

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
    // Same-stem .jpg poster shipped by the content export.
    expect(video.getAttribute("poster")).toMatch(
      /\/media\/animation-hospitalitypulse-oldFadeInEffect-\d+\.webp$/,
    );
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

  it("renders a plain native video with no controls library when usePlayer is false", () => {
    const { container } = render(<ImageTextVideo media={makeMedia({ usePlayer: false })} />);

    expect(EnhancedVideoPlayerMock).not.toHaveBeenCalled();
    expect(container.querySelector("video")).not.toBeNull();
  });

  it("mounts the enhanced player against the video when usePlayer is true", async () => {
    render(<ImageTextVideo media={makeMedia({ usePlayer: true })} />);

    await waitFor(() => expect(EnhancedVideoPlayerMock).toHaveBeenCalledTimes(1));
    expect(EnhancedVideoPlayerMock).toHaveBeenCalledWith(
      expect.objectContaining({ src: expect.stringContaining(KNOWN_FILENAME) }),
    );
  });

  it("plays the enhanced player once scrolled into view when usePlayer is true", async () => {
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    render(<ImageTextVideo media={makeMedia({ usePlayer: true })} />);

    await waitFor(() => expect(EnhancedVideoPlayerMock).toHaveBeenCalledTimes(1));

    fireIntersection(true);
    await waitFor(() => expect(playSpy).toHaveBeenCalledTimes(1));
  });
});
