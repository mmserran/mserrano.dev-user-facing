import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type MobileMosaic as MobileMosaicResult, type Project } from "@/lib/content";
import MobileMosaic from "./MobileMosaic";

const { getMobileMosaic } = vi.hoisted(() => ({ getMobileMosaic: vi.fn() }));

vi.mock("@/lib/content", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/content")>()),
  getMobileMosaic,
}));

const SCREENSHOT = "screencapture-cygnusmgmt-mobile-services.jpg";

class FakeResizeObserver {
  observe() {}
  disconnect() {}
}

function makeProject(): Project {
  return {
    sort: 0,
    slug: "current-project",
    value: "post:project:current-project",
    general: {
      date: "2020-07",
      role: "Developer",
      title: "Current Project",
      content: "A project description.",
      url: "",
      url_wayback: "",
      repo: "",
      workplace: [],
      supported_browsers: [],
    },
    thumbnail: { static: "", on_hover: "" },
    technology: { language: [], framework: [], deployment: [], software: [] },
    screenshot: { desktop: [], desktop_cutoff: null, mobile: [] },
    pagebuilder: "[]",
  };
}

const project = makeProject();

describe("MobileMosaic", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);

    // Invokes only the *first* requestAnimationFrame call synchronously -
    // that's the one that builds the initial rows. Every later call (the
    // loop re-scheduling itself) is left uninvoked so the test doesn't spin
    // forever; that's enough to observe the mounted, laid-out mosaic without
    // needing to simulate an actual animation loop.
    let calls = 0;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      calls += 1;
      if (calls === 1) cb(0);
      return calls;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  it("renders nothing when the project has no mobile screenshots", () => {
    const mosaic: MobileMosaicResult = { title: "Mobile", screenshots: [] };
    getMobileMosaic.mockReturnValue(mosaic);

    const { container } = render(<MobileMosaic project={project} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the backend-provided heading", () => {
    const mosaic: MobileMosaicResult = { title: "Mobile", screenshots: [SCREENSHOT] };
    getMobileMosaic.mockReturnValue(mosaic);

    render(<MobileMosaic project={project} />);

    expect(screen.getByRole("heading", { level: 3, name: "Mobile" })).toBeInTheDocument();
  });

  it("renders device frames across the initial rows, tilted and animating", () => {
    const mosaic: MobileMosaicResult = { title: "Mobile", screenshots: [SCREENSHOT] };
    getMobileMosaic.mockReturnValue(mosaic);

    const { container } = render(<MobileMosaic project={project} />);

    // jsdom never lays elements out, so clientWidth is 0 and the column
    // count floors to its minimum of 3; 4 initial rows * 3 columns = 12.
    const frames = container.querySelectorAll('img[src*="/assets/mobile-"]');
    expect(frames.length).toBe(12);
    expect(container.querySelector(".animate-mosaic-roll")).not.toBeNull();
  });

  it("marks the whole mosaic as decorative", () => {
    const mosaic: MobileMosaicResult = { title: "Mobile", screenshots: [SCREENSHOT] };
    getMobileMosaic.mockReturnValue(mosaic);

    const { container } = render(<MobileMosaic project={project} />);

    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("under reduced motion, renders one static row with no roll animation", () => {
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
    const mosaic: MobileMosaicResult = { title: "Mobile", screenshots: [SCREENSHOT] };
    getMobileMosaic.mockReturnValue(mosaic);

    const { container } = render(<MobileMosaic project={project} />);

    const frames = container.querySelectorAll('img[src*="/assets/mobile-"]');
    expect(frames.length).toBe(3);
    expect(container.querySelector(".animate-mosaic-roll")).toBeNull();
  });

  it("unmounts cleanly", () => {
    const mosaic: MobileMosaicResult = { title: "Mobile", screenshots: [SCREENSHOT] };
    getMobileMosaic.mockReturnValue(mosaic);

    const { unmount } = render(<MobileMosaic project={project} />);

    expect(() => unmount()).not.toThrow();
  });
});
