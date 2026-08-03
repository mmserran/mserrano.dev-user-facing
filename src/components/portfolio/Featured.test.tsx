import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FeaturedSectionView, PageBuilderSection } from "@/lib/content";
import Featured from "./Featured";

const { getFeaturedSectionView, getMediaVariants } = vi.hoisted(() => ({
  getFeaturedSectionView: vi.fn(),
  getMediaVariants: vi.fn(),
}));

vi.mock("@/lib/content", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/content")>()),
  getFeaturedSectionView,
  getMediaVariants,
}));

const { PlyrMock, destroyMock } = vi.hoisted(() => {
  const destroyMock = vi.fn();
  function PlyrMock() {
    return { destroy: destroyMock };
  }
  return { PlyrMock: vi.fn(PlyrMock), destroyMock };
});

vi.mock("plyr", () => ({ default: PlyrMock }));
vi.mock("plyr/dist/plyr.css", () => ({}));

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

  it("renders the section title, optional caption, and a muted, looping video sourced from the manifest URL", () => {
    getFeaturedSectionView.mockReturnValue(makeView({ content: "A demo recording." }));
    getMediaVariants.mockReturnValue([{ width: null, url: "/media/demo.mp4" }]);

    const { container } = render(<Featured section={section} />);

    expect(screen.getByRole("heading", { level: 3, name: "Archived Video" })).toBeInTheDocument();
    expect(screen.getByText("A demo recording.")).toBeInTheDocument();

    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video.autoplay).toBe(false);
    expect(container.querySelector('source[src="/media/demo.mp4"]')).not.toBeNull();
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

  it("sets the autoplay attribute from the section's is_autoplay flag", () => {
    getFeaturedSectionView.mockReturnValue(makeView({ autoplay: true }));
    getMediaVariants.mockReturnValue([{ width: null, url: "/media/demo.mp4" }]);

    const { container } = render(<Featured section={section} />);

    expect((container.querySelector("video") as HTMLVideoElement).autoplay).toBe(true);
  });

  it("does not initialize Plyr when use_player is false", async () => {
    getFeaturedSectionView.mockReturnValue(makeView({ usePlayer: false }));
    getMediaVariants.mockReturnValue([{ width: null, url: "/media/demo.mp4" }]);

    render(<Featured section={section} />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(PlyrMock).not.toHaveBeenCalled();
  });

  it("initializes Plyr against the video element when use_player is true, and destroys it on unmount", async () => {
    getFeaturedSectionView.mockReturnValue(makeView({ usePlayer: true }));
    getMediaVariants.mockReturnValue([{ width: null, url: "/media/demo.mp4" }]);

    const { container, unmount } = render(<Featured section={section} />);

    await waitFor(() => expect(PlyrMock).toHaveBeenCalledTimes(1));
    expect(PlyrMock).toHaveBeenCalledWith(container.querySelector("video"));

    unmount();
    expect(destroyMock).toHaveBeenCalledTimes(1);
  });
});
