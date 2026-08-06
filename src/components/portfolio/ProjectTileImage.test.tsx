import { act, fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProjectTileImage from "./ProjectTileImage";

let intersectionCallbacks: IntersectionObserverCallback[] = [];

class FakeIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    intersectionCallbacks.push(callback);
  }

  observe = vi.fn();
  disconnect = vi.fn();
}

function setAllVideosVisible(isIntersecting: boolean) {
  act(() => {
    intersectionCallbacks.forEach((callback) =>
      callback(
        [{ isIntersecting } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
  });
}

describe("ProjectTileImage", () => {
  // jsdom doesn't implement media playback; vitest's restoreMocks:true
  // resets spies before every test, so this has to run per-test rather than
  // once at module scope.
  beforeEach(() => {
    intersectionCallbacks = [];
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  });

  it("renders only the static image when there is no hover media", () => {
    const { container } = render(<ProjectTileImage staticFilename="WordPress.png" hoverFilename="" />);

    expect(container.querySelectorAll("img")).toHaveLength(1);
    expect(container.querySelectorAll("video")).toHaveLength(0);
  });

  it("a static video keeps autoplaying, but still crossfades away on hover to reveal the hover layer underneath", () => {
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
    const { container } = render(<ProjectTileImage staticFilename="devops_video.mp4" hoverFilename="WordPress.png" />);

    const video = container.querySelector("video");
    const img = container.querySelector("img");
    expect(video).not.toBeNull();
    expect(img).not.toBeNull();
    expect(video).not.toHaveAttribute("src");
    expect(playSpy).not.toHaveBeenCalled();

    setAllVideosVisible(true);

    // The static slot always autoplays (legacy `:play-on-condition="true"`),
    // independent of whether hover has faded it out of view.
    expect(playSpy).toHaveBeenCalled();
    expect(video?.getAttribute("src")).toContain("devops_video");
    expect(video?.className).toContain("opacity-100");

    const wrapper = container.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    expect(video?.className).toContain("opacity-0");
  });

  it("pauses a playing video when reduced motion becomes enabled", () => {
    let reducedMotion = false;
    let notifyChange = () => {};
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: reducedMotion,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_type, listener) => {
        notifyChange = () => {
          if (typeof listener === "function") listener(new Event("change"));
        };
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const pauseSpy = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});

    render(<ProjectTileImage staticFilename="devops_video.mp4" hoverFilename="" />);
    setAllVideosVisible(true);

    act(() => {
      reducedMotion = true;
      notifyChange();
    });

    expect(pauseSpy).toHaveBeenCalled();
  });

  it("swaps between two videos on hover when both the static and hover slots are video (e.g. Swisher Sweets)", () => {
    const { container } = render(
      <ProjectTileImage staticFilename="devops_video.mp4" hoverFilename="pulsemobile_video.mp4" />,
    );

    const videos = container.querySelectorAll("video");
    expect(videos).toHaveLength(2);
    const [hoverVideo, staticVideo] = videos;
    expect(staticVideo).not.toHaveAttribute("src");
    expect(hoverVideo).not.toHaveAttribute("src");

    setAllVideosVisible(true);

    expect(staticVideo.getAttribute("src")).toContain("devops_video");
    expect(hoverVideo.getAttribute("src")).toContain("pulsemobile_video");
    expect(staticVideo.className).toContain("opacity-100");

    const wrapper = container.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    expect(staticVideo.className).toContain("opacity-0");
  });

  it("a hover video with no static acts as its own resting poster", () => {
    const { container } = render(<ProjectTileImage staticFilename="" hoverFilename="devops_video.mp4" />);

    expect(container.querySelectorAll("video")).toHaveLength(1);
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("pauses and unloads a video when it leaves the visible carousel area", () => {
    const pauseSpy = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    const loadSpy = vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
    const { container } = render(<ProjectTileImage staticFilename="devops_video.mp4" hoverFilename="" />);
    const video = container.querySelector("video");

    setAllVideosVisible(true);
    expect(video?.getAttribute("src")).toContain("devops_video");

    pauseSpy.mockClear();
    loadSpy.mockClear();
    setAllVideosVisible(false);

    expect(video).not.toHaveAttribute("src");
    expect(pauseSpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
  });

  it("renders nothing (an empty placeholder) when both slots are blank", () => {
    const { container } = render(<ProjectTileImage staticFilename="" hoverFilename="" />);

    expect(container.querySelectorAll("img")).toHaveLength(0);
    expect(container.querySelectorAll("video")).toHaveLength(0);
  });

  it("pans the hover image on activation and reverts on release when there is no static layer", () => {
    const { container } = render(<ProjectTileImage staticFilename="" hoverFilename="WordPress.png" />);

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.className).toContain("duration-[750ms]");
    expect(img?.className).not.toContain("duration-[3000ms]");

    const wrapper = container.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    expect(img?.className).toContain("duration-[3000ms]");

    fireEvent.mouseLeave(wrapper);
    expect(img?.className).toContain("duration-[750ms]");
  });

  it("crossfades the static layer away on hover when both a static image and hover media exist", () => {
    const { container } = render(<ProjectTileImage staticFilename="WordPress.png" hoverFilename="Vue.png" />);

    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(2);
    const staticImg = images[1];
    expect(staticImg.className).toContain("opacity-100");

    const wrapper = container.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    expect(staticImg.className).toContain("opacity-0");
  });
});
