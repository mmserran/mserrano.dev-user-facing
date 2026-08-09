import { render, screen, waitFor } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import type { FeaturedSectionView, PageBuilderSection } from "@/lib/content";
import Featured from "./Featured";

const { getFeaturedSectionView, getMediaVariants, getVideoPosterUrl } = vi.hoisted(() => ({
  getFeaturedSectionView: vi.fn(),
  getMediaVariants: vi.fn(),
  getVideoPosterUrl: vi.fn(),
}));

vi.mock("@/lib/content", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/content")>()),
  getFeaturedSectionView,
  getMediaVariants,
  getVideoPosterUrl,
}));

// EnhancedVideoPlayer wraps the real @vidstack/react MediaPlayer; mocked here
// (loaded via VideoPlayer's next/dynamic import) with a plain <video> so
// assertions on rendered attributes stay identical to the pre-Vidstack
// native-video tests, while still proving VideoPlayer only mounts it when
// use_player is true.
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
    title?: string;
    className?: string;
  }) {
    EnhancedVideoPlayerMock(props);
    const { onPlayerChange, src, poster, muted, loop, autoPlay, title, className } = props;
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
      onPlayerChange?.(videoRef.current);
      return () => onPlayerChange?.(null);
    }, [onPlayerChange]);

    return (
      <video ref={videoRef} className={className} muted={muted} loop={loop} autoPlay={autoPlay} poster={poster} title={title}>
        <source src={src} />
      </video>
    );
  },
}));

const section: PageBuilderSection = { type: "pbFeatured", title: "Archived Video", featured_content: "demo.mp4" };

function makeView(overrides: Partial<FeaturedSectionView> = {}): FeaturedSectionView {
  return {
    title: "Archived Video",
    content: "",
    filename: "demo.mp4",
    usePlayer: true,
    autoplay: false,
    ...overrides,
  };
}

describe("Featured", () => {
  it("renders nothing when the section has no resolvable video", () => {
    getFeaturedSectionView.mockReturnValue(undefined);

    const { container } = render(<Featured section={section} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the video has no manifest variant", () => {
    getFeaturedSectionView.mockReturnValue(makeView());
    getMediaVariants.mockReturnValue([]);

    const { container } = render(<Featured section={section} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the section title, optional caption, and a muted, looping video sourced from the manifest URL", async () => {
    getFeaturedSectionView.mockReturnValue(makeView({ content: "A demo recording." }));
    getMediaVariants.mockReturnValue([{ width: null, url: "/media/demo.mp4" }]);
    getVideoPosterUrl.mockReturnValue("/media/demo-1600.webp");

    const { container } = render(<Featured section={section} />);

    expect(screen.getByRole("heading", { level: 3, name: "Archived Video" })).toBeInTheDocument();
    expect(screen.getByText("A demo recording.")).toBeInTheDocument();

    await waitFor(() => {
      const video = container.querySelector("video") as HTMLVideoElement;
      expect(video.muted).toBe(true);
      expect(video.loop).toBe(true);
      expect(video.autoplay).toBe(false);
      expect(video.getAttribute("poster")).toBe("/media/demo-1600.webp");
      expect(container.querySelector('source[src="/media/demo.mp4"]')).not.toBeNull();
    });
  });

  it("omits the poster attribute when no companion poster is available", async () => {
    getFeaturedSectionView.mockReturnValue(makeView());
    getMediaVariants.mockReturnValue([{ width: null, url: "/media/demo.mp4" }]);
    getVideoPosterUrl.mockReturnValue(undefined);

    const { container } = render(<Featured section={section} />);

    await waitFor(() => {
      expect((container.querySelector("video") as HTMLVideoElement).hasAttribute("poster")).toBe(false);
    });
  });

  it("omits the heading and caption when absent", () => {
    getFeaturedSectionView.mockReturnValue(makeView({ title: "", content: "" }));
    getMediaVariants.mockReturnValue([{ width: null, url: "/media/demo.mp4" }]);

    render(<Featured section={section} />);

    expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
  });

  it("renders a bare, unlabeled divider rule for the backend's '---' title", () => {
    getFeaturedSectionView.mockReturnValue(makeView({ title: "---", content: "" }));
    getMediaVariants.mockReturnValue([{ width: null, url: "/media/demo.mp4" }]);

    const { container } = render(<Featured section={section} />);

    expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"].flex.items-center')).toBeInTheDocument();
  });

  it("sets the autoplay attribute from the section's is_autoplay flag", async () => {
    getFeaturedSectionView.mockReturnValue(makeView({ autoplay: true }));
    getMediaVariants.mockReturnValue([{ width: null, url: "/media/demo.mp4" }]);

    const { container } = render(<Featured section={section} />);

    await waitFor(() => {
      expect((container.querySelector("video") as HTMLVideoElement).autoplay).toBe(true);
    });
  });

  it("renders a plain native video with no controls library when use_player is false", () => {
    getFeaturedSectionView.mockReturnValue(makeView({ usePlayer: false }));
    getMediaVariants.mockReturnValue([{ width: null, url: "/media/demo.mp4" }]);

    const { container } = render(<Featured section={section} />);

    expect(EnhancedVideoPlayerMock).not.toHaveBeenCalled();
    expect(container.querySelector("video")).not.toBeNull();
  });

  it("mounts the enhanced player against the video when use_player is true", async () => {
    getFeaturedSectionView.mockReturnValue(makeView({ usePlayer: true }));
    getMediaVariants.mockReturnValue([{ width: null, url: "/media/demo.mp4" }]);

    render(<Featured section={section} />);

    await waitFor(() => expect(EnhancedVideoPlayerMock).toHaveBeenCalledTimes(1));
    expect(EnhancedVideoPlayerMock).toHaveBeenCalledWith(expect.objectContaining({ src: "/media/demo.mp4" }));
  });
});
