import { act, render } from "@testing-library/react";
import lottie from "lottie-web/build/player/lottie_light";
import { afterEach, describe, expect, it, vi } from "vitest";
import AquariumTank1Penguins from "./AquariumTank1Penguins";
import AquariumTank2PelagicConveyor from "./AquariumTank2PelagicConveyor";
import AquariumTank3RotatingExhibit from "./AquariumTank3RotatingExhibit";
import EndcapShell from "./EndcapShell";
import Helicopter from "./Helicopter";
import LighthouseBeams from "./LighthouseBeams";
import SmokeEffects from "./SmokeEffects";
import StarField from "./StarField";

const { cyclingIndex } = vi.hoisted(() => ({ cyclingIndex: { value: 0 } }));

vi.mock("./useCyclingIndex", () => ({
  useCyclingIndex: vi.fn(() => cyclingIndex.value),
}));

describe("Illustration Components", () => {
  afterEach(() => {
    vi.useRealTimers();
    cyclingIndex.value = 0;
    vi.clearAllMocks();
  });

  it("uses intrinsic sizing for EndcapShell by default", () => {
    const { container } = render(<EndcapShell />);
    expect(container.firstChild).toHaveClass(
      "relative",
      "h-[calc(33vw+33vh)]",
    );
    expect(container.querySelectorAll("img")).toHaveLength(31);
  });

  it("fills its positioned ancestor when requested", () => {
    const { container } = render(<EndcapShell fill />);
    expect(container.firstChild).toHaveClass("absolute", "inset-0");
    expect(container.firstChild).not.toHaveClass("h-[calc(33vw+33vh)]");
  });

  it("renders deterministic star layers with reduced-motion fallbacks", () => {
    const { container } = render(<StarField />);
    const layers = Array.from(container.firstElementChild!.children) as HTMLElement[];

    expect(layers).toHaveLength(3);
    expect(layers.map((layer) => layer.style.width)).toEqual(["2px", "4px", "7px"]);
    expect(layers[0]).toHaveClass("animate-star-drift-slow", "motion-reduce:animate-none");
    expect(layers[0].style.boxShadow.split(", ")).toHaveLength(300);
    expect(layers[1].style.boxShadow.split(", ")).toHaveLength(60);
    expect(layers[2].style.boxShadow.split(", ")).toHaveLength(15);

    const { container: secondRender } = render(<StarField />);
    expect(
      (secondRender.firstElementChild!.firstElementChild as HTMLElement).style
        .boxShadow,
    ).toBe(layers[0].style.boxShadow);
  });

  it("cycles smoke twice on the far-left pipe before switching pipes", () => {
    vi.useFakeTimers();
    const { container, unmount } = render(<SmokeEffects />);
    const pipes = () => Array.from(container.children);

    expect(pipes()[0].querySelector("svg")).toBeInTheDocument();
    expect(pipes()[1].querySelector("svg")).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(10_000));
    expect(container.querySelector("svg")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(670));
    expect(pipes()[0].querySelector("svg")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(10_000));
    act(() => vi.advanceTimersByTime(420));
    expect(pipes()[1].querySelector("svg")).toBeInTheDocument();
    expect(pipes()[0].querySelector("svg")).not.toBeInTheDocument();

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("renders lighthouse beams with animation and static reduced-motion states", () => {
    const { container } = render(<LighthouseBeams />);
    const beams = Array.from(container.querySelectorAll("rect"));

    expect(beams).toHaveLength(4);
    expect(beams.map((beam) => beam.getAttribute("class"))).toEqual([
      expect.stringContaining("animate-light-sw"),
      expect.stringContaining("animate-light-nw"),
      expect.stringContaining("animate-light-ne"),
      expect.stringContaining("animate-light-se"),
    ]);
    expect(beams[0]).toHaveClass("motion-reduce:opacity-100");
    expect(beams[2]).toHaveClass("motion-reduce:opacity-70");
  });

  it.each([
    [false, true],
    [true, false],
  ])("configures and cleans up helicopter animation (reduced motion: %s)", (reducedMotion, shouldPlay) => {
    const destroy = vi.fn();
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: reducedMotion,
    } as MediaQueryList);
    vi.mocked(lottie.loadAnimation).mockReturnValue({ destroy } as never);

    const { container, unmount } = render(<Helicopter />);

    expect(lottie.loadAnimation).toHaveBeenCalledWith({
      container: container.firstChild,
      renderer: "svg",
      loop: shouldPlay,
      autoplay: shouldPlay,
      path: "/assets/helicopter-scw.json",
    });
    unmount();
    expect(destroy).toHaveBeenCalledOnce();
  });

  it("renders three independently animated penguins", () => {
    const { container } = render(<AquariumTank1Penguins />);
    const penguins = Array.from(container.querySelectorAll("img"));

    expect(penguins).toHaveLength(3);
    expect(penguins.map((penguin) => penguin.className)).toEqual([
      expect.stringContaining("animate-penguin-slow-descent"),
      expect.stringContaining("animate-penguin-fun"),
      expect.stringContaining("animate-penguin-slow-poke"),
    ]);
  });

  it("renders the complete pelagic formation on one animated track", () => {
    const { container } = render(<AquariumTank2PelagicConveyor />);
    const track = container.firstElementChild!.firstElementChild!;

    expect(track).toHaveClass("animate-tank2-speed-ramp", "motion-reduce:animate-none");
    expect(track.querySelectorAll("img")).toHaveLength(8);
    expect(
      Array.from(track.querySelectorAll("img")).filter((image) =>
        image.getAttribute("src")?.includes("school-of-sardines"),
      ),
    ).toHaveLength(4);
  });

  it.each([
    [0, "cuttlefish-static.svg", "0.75"],
    [1, "giant-pacific-octopus.svg", "0.75"],
    [2, "cephalopod.svg", "1"],
    [3, "black-sea-nettle1.svg", "0.75"],
    [4, "cephalopod.svg", "1"],
  ])("shows rotating exhibit %i and hides the others", (index, asset, opacity) => {
    cyclingIndex.value = index;
    const { container } = render(<AquariumTank3RotatingExhibit />);
    const exhibitImages = Array.from(container.querySelectorAll("img")).slice(1, -1);
    const visible = exhibitImages.filter(
      (image) => image.parentElement?.style.opacity === opacity || image.style.opacity === opacity,
    );

    expect(visible.some((image) => image.getAttribute("src")?.includes(asset))).toBe(true);
    expect(
      Array.from(container.querySelectorAll<HTMLElement>("[style*='opacity']")).filter(
        (element) => element.style.opacity === "0",
      ),
    ).toHaveLength(4);
  });
});
