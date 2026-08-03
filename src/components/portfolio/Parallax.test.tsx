import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PageBuilderSection } from "@/lib/content";
import Parallax from "./Parallax";

const section: PageBuilderSection = {
  type: "pbParallax",
  title: "---",
  content: "Then I redesigned it",
  is_quote: true,
  parallax_content:
    "screencapture-hospitalitypulse-desktop-company-careers.jpg",
};

let animationFrames: FrameRequestCallback[];

function flushAnimationFrame() {
  const callbacks = animationFrames.splice(0);
  callbacks.forEach((callback) => callback(0));
}

describe("Parallax", () => {
  beforeEach(() => {
    animationFrames = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      animationFrames.push(callback);
      return animationFrames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  it("renders responsive decorative imagery and the live heading treatment", () => {
    const { container } = render(<Parallax section={section} />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Then I redesigned it",
      }),
    ).toBeInTheDocument();
    const image = container.querySelector("img");
    expect(image).toHaveAttribute("alt", "");
    expect(image?.getAttribute("srcset")).toContain("400w");
    expect(image?.getAttribute("srcset")).toContain("1600w");
    expect(container.querySelector("blockquote")).not.toBeInTheDocument();
  });

  it("continues drifting toward its scroll position across animation frames", () => {
    const { container } = render(<Parallax section={section} />);
    const stage = container.querySelector("section > div") as HTMLDivElement;
    const image = container.querySelector("img") as HTMLImageElement;
    vi.spyOn(stage, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 200,
      top: 200,
      left: 0,
      right: 1000,
      bottom: 600,
      width: 1000,
      height: 400,
      toJSON: () => ({}),
    });

    fireEvent.scroll(window);
    flushAnimationFrame();
    const firstDriftFrame = image.style.transform;
    expect(animationFrames.length).toBeGreaterThan(0);
    flushAnimationFrame();

    expect(firstDriftFrame).toContain("translate3d");
    expect(image.style.transform).not.toBe(firstDriftFrame);
  });

  it("renders nothing for malformed or missing media", () => {
    const { container } = render(
      <Parallax
        section={{
          type: "pbParallax",
          content: "Unavailable",
          parallax_content: "missing.jpg",
        }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("does not schedule motion when reduced motion is requested", () => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    render(<Parallax section={section} />);

    expect(animationFrames).toHaveLength(0);
  });
});
