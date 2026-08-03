import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ImageTextSectionView, PageBuilderSection } from "@/lib/content";
import ImageText from "./ImageText";

const { getImageTextSectionView, getMediaVariants } = vi.hoisted(() => ({
  getImageTextSectionView: vi.fn(),
  getMediaVariants: vi.fn(),
}));

vi.mock("@/lib/content", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/content")>()),
  getImageTextSectionView,
  getMediaVariants,
}));

vi.mock("./ImageTextDeviceFrame", () => ({
  default: ({ filename }: { filename: string }) => <div data-testid="device-frame">{filename}</div>,
}));
vi.mock("./ImageTextVideo", () => ({
  default: ({ media }: { media: { filename: string } }) => <div data-testid="video">{media.filename}</div>,
}));

const section: PageBuilderSection = { type: "pbImageText", title: "Initial Website", list_image_text: [] };

describe("ImageText", () => {
  it("renders the section title and dispatches each item's visual by media format", () => {
    getMediaVariants.mockReturnValue([{ width: 800, url: "/media/plain-800.webp" }]);
    const view: ImageTextSectionView = {
      title: "Initial Website",
      items: [
        {
          key: "screenshot",
          title: "A good website",
          content: [{ type: "text", text: "The initial website was simple." }],
          useLeftside: false,
          media: {
            filename: "screencapture-desktop.jpg",
            format: "image",
            isScreenshot: true,
            usePlayer: false,
          },
        },
        {
          key: "video",
          title: "I took project ownership",
          content: [],
          useLeftside: true,
          media: { filename: "animation.mp4", format: "video", isScreenshot: false, usePlayer: true },
        },
        {
          key: "plain-image",
          title: "hotel-online.com",
          content: [],
          useLeftside: false,
          media: { filename: "press-clip.jpg", format: "image", isScreenshot: false, usePlayer: false },
        },
      ],
    };
    getImageTextSectionView.mockReturnValue(view);

    render(<ImageText section={section} />);

    expect(screen.getByRole("heading", { level: 3, name: "Initial Website" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "A good website" })).toBeInTheDocument();

    expect(screen.getByTestId("device-frame")).toHaveTextContent("screencapture-desktop.jpg");
    expect(screen.getByTestId("video")).toHaveTextContent("animation.mp4");
    expect(screen.getByText("The initial website was simple.")).toBeInTheDocument();

    const plainImage = document.querySelector('img[src="/media/plain-800.webp"]');
    expect(plainImage).not.toBeNull();
    expect(plainImage?.className).toContain("object-contain");
  });

  it("omits the heading when the section has no title", () => {
    getImageTextSectionView.mockReturnValue({
      title: "",
      items: [
        {
          key: "a",
          title: "A good website",
          content: [],
          useLeftside: false,
          media: { filename: "a.jpg", format: "image", isScreenshot: false, usePlayer: false },
        },
      ],
    } satisfies ImageTextSectionView);
    getMediaVariants.mockReturnValue([]);

    render(<ImageText section={section} />);

    expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "A good website" })).toBeInTheDocument();
  });

  it("centers the title when the item has no content, left-aligns it when it does", () => {
    getImageTextSectionView.mockReturnValue({
      title: "Highlights",
      items: [
        {
          key: "no-content",
          title: "Page Transitions",
          content: [],
          useLeftside: true,
          media: { filename: "a.mp4", format: "video", isScreenshot: false, usePlayer: false },
        },
        {
          key: "with-content",
          title: "A good website",
          content: [{ type: "text", text: "Some caption." }],
          useLeftside: false,
          media: { filename: "b.jpg", format: "image", isScreenshot: true, usePlayer: false },
        },
      ],
    } satisfies ImageTextSectionView);

    render(<ImageText section={section} />);

    expect(screen.getByRole("heading", { level: 4, name: "Page Transitions" })).toHaveClass("text-center");
    expect(screen.getByRole("heading", { level: 4, name: "A good website" })).not.toHaveClass("text-center");
  });

  it("keeps image-first ordering at the lg breakpoint by default, flips it when useLeftside", () => {
    getImageTextSectionView.mockReturnValue({
      title: "",
      items: [
        {
          key: "default-order",
          title: "Default",
          content: [],
          useLeftside: false,
          media: { filename: "a.jpg", format: "image", isScreenshot: true, usePlayer: false },
        },
        {
          key: "leftside",
          title: "Leftside",
          content: [],
          useLeftside: true,
          media: { filename: "b.jpg", format: "image", isScreenshot: true, usePlayer: false },
        },
      ],
    } satisfies ImageTextSectionView);

    render(<ImageText section={section} />);

    const [defaultVisual, defaultTextual] = screen.getByText("Default").closest("div.grid")!.children;
    expect(defaultVisual.className).toContain("lg:order-1");
    expect(defaultTextual.className).toContain("lg:order-2");

    const [leftsideVisual, leftsideTextual] = screen.getByText("Leftside").closest("div.grid")!.children;
    expect(leftsideVisual.className).toContain("lg:order-2");
    expect(leftsideTextual.className).toContain("lg:order-1");
  });

  it("renders an embedded link segment as an accessible external link within the caption", () => {
    getImageTextSectionView.mockReturnValue({
      title: "Press Releases",
      items: [
        {
          key: "press",
          title: "hotel-online.com",
          content: [
            { type: "text", text: "Featured on " },
            { type: "link", text: "hotel-online.com", href: "https://www.hotel-online.com/article" },
            { type: "text", text: "." },
          ],
          useLeftside: false,
          media: { filename: "clip.jpg", format: "image", isScreenshot: false, usePlayer: false },
        },
      ],
    } satisfies ImageTextSectionView);
    getMediaVariants.mockReturnValue([]);

    render(<ImageText section={section} />);

    const link = screen.getByRole("link", { name: "hotel-online.com" });
    expect(link).toHaveAttribute("href", "https://www.hotel-online.com/article");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText(/Featured on/)).toBeInTheDocument();
  });

  it("renders nothing when the section has no resolvable items", () => {
    getImageTextSectionView.mockReturnValue({ title: "Initial Website", items: [] });

    const { container } = render(<ImageText section={section} />);

    expect(container).toBeEmptyDOMElement();
  });
});
