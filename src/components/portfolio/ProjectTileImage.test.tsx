import { fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProjectTileImage from "./ProjectTileImage";

describe("ProjectTileImage", () => {
  // jsdom doesn't implement media playback; vitest's restoreMocks:true
  // resets spies before every test, so this has to run per-test rather than
  // once at module scope.
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
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
    // The static slot always autoplays (legacy `:play-on-condition="true"`),
    // independent of whether hover has faded it out of view.
    expect(playSpy).toHaveBeenCalled();
    expect(video?.className).toContain("opacity-100");

    const wrapper = container.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    expect(video?.className).toContain("opacity-0");
  });

  it("swaps between two videos on hover when both the static and hover slots are video (e.g. Swisher Sweets)", () => {
    const { container } = render(
      <ProjectTileImage staticFilename="devops_video.mp4" hoverFilename="pulsemobile_video.mp4" />,
    );

    const videos = container.querySelectorAll("video");
    expect(videos).toHaveLength(2);
    const [hoverVideo, staticVideo] = videos;
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
