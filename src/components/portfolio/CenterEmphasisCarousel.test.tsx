import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { type CenterEmphasisCarousel as CenterEmphasisCarouselResult, type Project } from "@/lib/content";
import CenterEmphasisCarousel from "./CenterEmphasisCarousel";

const { getCenterEmphasisCarousel } = vi.hoisted(() => ({ getCenterEmphasisCarousel: vi.fn() }));

vi.mock("@/lib/content", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/content")>()),
  getCenterEmphasisCarousel,
}));

// Real manifest.json entries (via the un-mocked getMediaVariants), matching
// MobileDeviceFrame.test.tsx's convention of exercising real media
// resolution against restored content rather than mocking it too.
const HOME = "screencapture-cygnusmgmt-desktop.jpg";
const SERVICES = "screencapture-cygnusmgmt-desktop-services.jpg";
const PRICING = "screencapture-cygnusmgmt-desktop-pricing.jpg";
const CONTACT = "screencapture-cygnusmgmt-desktop-contact.jpg";

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

function fourSlideCarousel(): CenterEmphasisCarouselResult {
  return {
    title: "A Complete Website",
    content: "",
    slides: [
      { title: "Home Page", filename: HOME, offset: "" },
      { title: "Services Page", filename: SERVICES, offset: "" },
      { title: "Pricing Page", filename: PRICING, offset: "" },
      { title: "Contact Page", filename: CONTACT, offset: "" },
    ],
  };
}

describe("CenterEmphasisCarousel", () => {
  it("renders nothing when there are no slides", () => {
    getCenterEmphasisCarousel.mockReturnValue({ title: "", content: "", slides: [] });

    const { container } = render(<CenterEmphasisCarousel project={project} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the backend-provided heading and starts on the first slide", () => {
    getCenterEmphasisCarousel.mockReturnValue(fourSlideCarousel());

    render(<CenterEmphasisCarousel project={project} />);

    expect(screen.getByRole("heading", { level: 3, name: "A Complete Website" })).toBeInTheDocument();
    expect(screen.getByText("Slide 1 of 4: Home Page")).toBeInTheDocument();
  });

  it("renders the block's rich-text content, trusting content.json markup", () => {
    getCenterEmphasisCarousel.mockReturnValue({
      ...fourSlideCarousel(),
      content: 'See <a href="https://example.com">the conference</a>.',
    });

    render(<CenterEmphasisCarousel project={project} />);

    const link = screen.getByRole("link", { name: "the conference" });
    expect(link).toHaveAttribute("href", "https://example.com");
  });

  it("renders no content paragraph when the block's content is empty", () => {
    getCenterEmphasisCarousel.mockReturnValue(fourSlideCarousel());

    const { container } = render(<CenterEmphasisCarousel project={project} />);

    expect(container.querySelector("[class*='leading-normal']")).not.toBeInTheDocument();
  });

  it("advances the live-region announcement and active dot when Next is clicked", () => {
    getCenterEmphasisCarousel.mockReturnValue(fourSlideCarousel());

    render(<CenterEmphasisCarousel project={project} />);

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));

    expect(screen.getByText("Slide 2 of 4: Services Page")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to slide 2 of 4: Services Page" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("wraps from the last slide back to the first when Next is clicked (the live carousel loops)", () => {
    getCenterEmphasisCarousel.mockReturnValue(fourSlideCarousel());
    vi.useFakeTimers();

    render(<CenterEmphasisCarousel project={project} />);

    fireEvent.click(screen.getByRole("button", { name: "Go to slide 4 of 4: Contact Page" }));
    // A second move is ignored while the first is still transitioning (see
    // the "ignores a second navigation" test below) - advancing past the
    // 500ms transition first is what makes this a realistic two-move
    // sequence rather than one that gets silently dropped.
    vi.advanceTimersByTime(500);
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));

    expect(screen.getByText("Slide 1 of 4: Home Page")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("wraps from the first slide back to the last when Previous is clicked", () => {
    getCenterEmphasisCarousel.mockReturnValue(fourSlideCarousel());

    render(<CenterEmphasisCarousel project={project} />);

    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));

    expect(screen.getByText("Slide 4 of 4: Contact Page")).toBeInTheDocument();
  });

  it("moves to the clicked dot's slide directly", () => {
    getCenterEmphasisCarousel.mockReturnValue(fourSlideCarousel());

    render(<CenterEmphasisCarousel project={project} />);

    fireEvent.click(screen.getByRole("button", { name: "Go to slide 3 of 4: Pricing Page" }));

    expect(screen.getByText("Slide 3 of 4: Pricing Page")).toBeInTheDocument();
  });

  it("moves forward on ArrowRight and back on ArrowLeft while focus is inside the carousel", () => {
    getCenterEmphasisCarousel.mockReturnValue(fourSlideCarousel());
    vi.useFakeTimers();

    render(<CenterEmphasisCarousel project={project} />);
    const region = screen.getByText("Slide 1 of 4: Home Page").parentElement as HTMLElement;

    fireEvent.keyDown(region, { key: "ArrowRight" });
    expect(screen.getByText("Slide 2 of 4: Services Page")).toBeInTheDocument();

    vi.advanceTimersByTime(500);
    fireEvent.keyDown(region, { key: "ArrowLeft" });
    expect(screen.getByText("Slide 1 of 4: Home Page")).toBeInTheDocument();
    vi.useRealTimers();
  });

  // Arrow keys change which slide is active without React moving DOM focus
  // as a side effect of that alone - left alone, the visible focus ring
  // would stay on whatever was already focused (e.g. Home Page, if that's
  // what got tabbed to), which the fan then visually rotates away to a
  // no-longer-relevant position instead of following the slide that's
  // actually now centered. handleKeyDown moves focus explicitly to fix
  // this; Tab itself was never affected (it always lands exactly on the
  // slide the user tabs to).
  it("moves DOM focus to the newly active slide on ArrowRight/ArrowLeft, not just which slide is active", () => {
    getCenterEmphasisCarousel.mockReturnValue(fourSlideCarousel());
    vi.useFakeTimers();

    render(<CenterEmphasisCarousel project={project} />);
    const region = screen.getByText("Slide 1 of 4: Home Page").parentElement as HTMLElement;
    const home = screen.getByRole("button", { name: "Show slide: Home Page" });
    home.focus();

    fireEvent.keyDown(region, { key: "ArrowRight" });

    expect(screen.getByRole("button", { name: "Show slide: Services Page" })).toHaveFocus();
    vi.useRealTimers();
  });

  it("ignores a second navigation while the first is still mid-transition, instead of queueing or interrupting it", () => {
    // Two overlapping transitions is exactly what broke true 3D depth
    // sorting in practice: with transform-style: preserve-3d, a slide
    // re-targeted mid-flight while another was also still moving could
    // render in front of the slide it should be behind, clipping across
    // the middle of what should be the frontmost card (confirmed live via
    // rapid clicking - and confirmed absent when input is ignored like
    // this instead, matching the reference site's own apparent behavior
    // under the same rapid clicking).
    getCenterEmphasisCarousel.mockReturnValue(fourSlideCarousel());
    vi.useFakeTimers();

    render(<CenterEmphasisCarousel project={project} />);

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));

    expect(screen.getByText("Slide 2 of 4: Services Page")).toBeInTheDocument();

    vi.advanceTimersByTime(500);
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(screen.getByText("Slide 3 of 4: Pricing Page")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("exposes only the active slide's caption and image to assistive tech", () => {
    getCenterEmphasisCarousel.mockReturnValue(fourSlideCarousel());

    render(<CenterEmphasisCarousel project={project} />);

    expect(screen.getByRole("heading", { level: 6, name: "Home Page" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 6, name: "Services Page" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show slide: Services Page" })).toHaveAttribute(
      "aria-hidden",
      "false",
    );
  });

  // Roving tabindex: only the active slide's button is a Tab stop, so Tab
  // from outside the carousel lands directly on whichever slide is
  // centered rather than always the first slide in fixed DOM order
  // regardless of selection. Arrow keys (see the focus test above) are
  // what actually move between the rest, via direct .focus() calls that
  // work on a tabIndex={-1} element same as any other - only Tab itself
  // skips them.
  it("gives only the active slide's button a Tab stop, moving it as the active slide changes", () => {
    getCenterEmphasisCarousel.mockReturnValue(fourSlideCarousel());

    render(<CenterEmphasisCarousel project={project} />);

    expect(screen.getByRole("button", { name: "Show slide: Home Page" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("button", { name: "Show slide: Services Page" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("button", { name: "Show slide: Pricing Page" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("button", { name: "Show slide: Contact Page" })).toHaveAttribute("tabindex", "-1");

    fireEvent.click(screen.getByRole("button", { name: "Show slide: Services Page" }));

    expect(screen.getByRole("button", { name: "Show slide: Home Page" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("button", { name: "Show slide: Services Page" })).toHaveAttribute("tabindex", "0");
  });

  it("keeps each slide as the same DOM node across a navigation, so its transform can transition from a real previous frame", () => {
    getCenterEmphasisCarousel.mockReturnValue(fourSlideCarousel());

    render(<CenterEmphasisCarousel project={project} />);
    const homeSlide = screen.getByRole("button", { name: "Show slide: Home Page" });

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));

    // A slide that switched between a <div> (active) and a <button>
    // (inactive) representation would force React to unmount and recreate
    // the DOM node here instead of reusing it, which leaves the CSS
    // transition with no previous frame to animate from - it would jump
    // straight to the new transform instead of gliding to it.
    expect(screen.getByRole("button", { name: "Show slide: Home Page" })).toBe(homeSlide);
  });

  it("marks the active slide's button with aria-current", () => {
    getCenterEmphasisCarousel.mockReturnValue(fourSlideCarousel());

    render(<CenterEmphasisCarousel project={project} />);

    expect(screen.getByRole("button", { name: "Show slide: Home Page" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Show slide: Services Page" })).toHaveAttribute(
      "aria-current",
      "false",
    );
  });

  it("hides Previous/Next/dots when there's only one slide", () => {
    getCenterEmphasisCarousel.mockReturnValue({
      title: "A Complete Website",
      content: "",
      slides: [{ title: "Home Page", filename: HOME, offset: "" }],
    });

    render(<CenterEmphasisCarousel project={project} />);

    expect(screen.queryByRole("button", { name: "Previous slide" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next slide" })).not.toBeInTheDocument();
  });

  it("applies a static object-position crop from a slide's offset", () => {
    getCenterEmphasisCarousel.mockReturnValue({
      title: "HiTEC 2015 Ready",
      content: "",
      slides: [
        { title: "Products Page", filename: HOME, offset: "bottom" },
        { title: "Home Page", filename: SERVICES, offset: "" },
      ],
    });

    const { container } = render(<CenterEmphasisCarousel project={project} />);
    const activeImage = container.querySelector('img:not([aria-hidden="true"])') as HTMLImageElement;

    expect(activeImage.style.objectPosition).toBe("0 bottom");
  });

  it("skips a slide whose filename has no manifest variants", () => {
    getCenterEmphasisCarousel.mockReturnValue({
      title: "A Complete Website",
      content: "",
      slides: [
        { title: "Home Page", filename: HOME, offset: "" },
        { title: "Unresolvable", filename: "does-not-exist.jpg", offset: "" },
      ],
    });

    const { container } = render(<CenterEmphasisCarousel project={project} />);

    expect(container.querySelectorAll("img").length).toBe(1);
  });

  // No z-index anywhere, on any slide, at any point - the stage's own
  // transform-style: preserve-3d (see its className in the component) puts
  // every slide in a shared 3D space and lets the browser stack them by
  // their actual rendered depth every frame, which is what makes the
  // incoming and outgoing slide during a move correctly pass in front of
  // and behind each other continuously, matching the live site - rather
  // than approximating that with a z-index that can only ever flip at one
  // single, discrete moment. (An earlier version drove exactly such a
  // flip, timed via JS to the transition's midpoint - CSS's own transition
  // timing for a discrete property proved too unreliable to place it there
  // consistently, and any single flip point is visible somewhere anyway
  // given the two slides still overlap by ~114px at rest, unlike true
  // per-frame depth sorting.)
  it("stacks every slide via 3D depth alone - no z-index style anywhere", () => {
    getCenterEmphasisCarousel.mockReturnValue(fourSlideCarousel());
    const { container } = render(<CenterEmphasisCarousel project={project} />);

    fireEvent.click(screen.getByRole("button", { name: "Show slide: Services Page" }));

    for (const button of container.querySelectorAll('button[aria-label^="Show slide"]')) {
      expect((button as HTMLElement).style.zIndex).toBe("");
    }
  });

  describe("click-catcher layer", () => {
    // Real (non-flattened) transform-style: preserve-3d turned out to make
    // mouse hit-testing for a rotated, overlapping sibling fundamentally
    // unreliable in real browsers - not just imprecise at a rotated
    // rectangle's true edges, but resolving to something else across the
    // *entire* sampled area (verified via Playwright: dense 64- and
    // 312-point grids across a fanned slide's own bounding box never once
    // landed on it). Each visual slide (see CarouselSlide) is
    // pointer-events-none as a result; a second, flat, unrotated,
    // invisible button per visible slide - this layer - is what mouse/
    // touch clicks actually hit, since ordinary 2D hit-testing has none of
    // that unreliability. jsdom has no real hit-testing/compositor, so
    // these tests can only exercise the wiring (the right click targets
    // exist, are marked non-interactive to assistive tech, and navigate
    // correctly) and assert the CSS class that blocks pointer hit-testing
    // is present on the visual layer - not that a real click actually
    // lands where it should, which is what the Playwright verification
    // above covers instead.
    function getCatcherButtons(container: HTMLElement): HTMLElement[] {
      const layer = Array.from(container.querySelectorAll('div[aria-hidden="true"]')).find(
        (div) => div.className === "absolute inset-0 h-full w-full",
      );
      return Array.from(layer?.querySelectorAll("button") ?? []);
    }

    it("gives every visible slide's own accessible button pointer-events-none, so a real click can't land on it", () => {
      getCenterEmphasisCarousel.mockReturnValue(fourSlideCarousel());
      render(<CenterEmphasisCarousel project={project} />);

      for (const button of screen.getAllByRole("button", { name: /^Show slide:/ })) {
        expect(button.className).toContain("pointer-events-none");
      }
    });

    it("renders one hidden, unfocusable catcher button per visible slide, and clicking one navigates to it", () => {
      getCenterEmphasisCarousel.mockReturnValue(fourSlideCarousel());
      const { container } = render(<CenterEmphasisCarousel project={project} />);

      const catchers = getCatcherButtons(container);
      expect(catchers).toHaveLength(4);
      for (const catcher of catchers) {
        expect(catcher).toHaveAttribute("aria-hidden", "true");
        expect(catcher).toHaveAttribute("tabindex", "-1");
      }

      fireEvent.click(catchers[2]);

      expect(screen.getByText("Slide 3 of 4: Pricing Page")).toBeInTheDocument();
    });
  });
});
