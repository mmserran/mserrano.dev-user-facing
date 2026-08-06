import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Carousel from "./Carousel";

// jsdom implements neither of these - real browsers do, but the component
// needs both to exist to avoid throwing during effects/handlers.
class FakeResizeObserver {
  observe() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  Element.prototype.scrollBy = vi.fn();
  Element.prototype.scrollTo = vi.fn();
});

function setScrollGeometry(track: HTMLElement, { scrollLeft = 0, clientWidth = 300, scrollWidth = 900 } = {}) {
  Object.defineProperty(track, "scrollLeft", { value: scrollLeft, configurable: true });
  Object.defineProperty(track, "clientWidth", { value: clientWidth, configurable: true });
  Object.defineProperty(track, "scrollWidth", { value: scrollWidth, configurable: true });
}

// jsdom never lays elements out (offsetLeft is always 0), which is exactly
// what makes item width unmeasurable there by default - the fallback path
// this test suite otherwise exercises throughout. These two tests instead
// stub offsetLeft on the first two children to simulate a real, laid-out
// carousel and exercise the item-width-aware path.
function setItemOffsets(track: HTMLElement, offsetsLeft: number[]) {
  const children = Array.from(track.children) as HTMLElement[];
  offsetsLeft.forEach((offsetLeft, index) => {
    Object.defineProperty(children[index], "offsetLeft", { value: offsetLeft, configurable: true });
  });
}

const items = ["a", "b", "c"];

function renderCarousel({ edgeFade = false }: { edgeFade?: boolean } = {}) {
  return render(
    <Carousel ariaLabel="Test items" edgeFade={edgeFade}>
      {items.map((item) => (
        <span key={item}>Card {item}</span>
      ))}
    </Carousel>,
  );
}

describe("Carousel", () => {
  it("renders every child", () => {
    renderCarousel();

    for (const item of items) {
      expect(screen.getByText(`Card ${item}`)).toBeInTheDocument();
    }
  });

  it("exposes the scroll track as a labeled region", () => {
    renderCarousel();

    expect(screen.getByRole("region", { name: "Test items" })).toBeInTheDocument();
  });

  it("disables Previous at the start and enables it once scrolled away", () => {
    renderCarousel();

    const track = screen.getByRole("region", { name: "Test items" });
    setScrollGeometry(track, { scrollLeft: 0, clientWidth: 300, scrollWidth: 900 });
    fireEvent.scroll(track);

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();

    setScrollGeometry(track, { scrollLeft: 300, clientWidth: 300, scrollWidth: 900 });
    fireEvent.scroll(track);

    expect(screen.getByRole("button", { name: "Previous" })).not.toBeDisabled();
  });

  it("disables Next once scrolled to the end", () => {
    renderCarousel();

    const track = screen.getByRole("region", { name: "Test items" });
    setScrollGeometry(track, { scrollLeft: 600, clientWidth: 300, scrollWidth: 900 });
    fireEvent.scroll(track);

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("scrolls the track forward by one page when Next is clicked", () => {
    renderCarousel();

    const track = screen.getByRole("region", { name: "Test items" });
    setScrollGeometry(track, { scrollLeft: 0, clientWidth: 300, scrollWidth: 900 });
    fireEvent.scroll(track);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(track.scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 300 }));
  });

  it("renders no page dots when everything fits in one page", () => {
    renderCarousel();

    const track = screen.getByRole("region", { name: "Test items" });
    setScrollGeometry(track, { scrollLeft: 0, clientWidth: 900, scrollWidth: 900 });
    fireEvent.scroll(track);

    expect(screen.queryByRole("button", { name: /Go to page/ })).not.toBeInTheDocument();
  });

  it("renders one dot per page and marks the current one", () => {
    renderCarousel();

    const track = screen.getByRole("region", { name: "Test items" });
    setScrollGeometry(track, { scrollLeft: 300, clientWidth: 300, scrollWidth: 900 });
    fireEvent.scroll(track);

    const dots = screen.getAllByRole("button", { name: /Go to page/ });
    expect(dots).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Go to page 2 of 3" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Go to page 1 of 3" })).toHaveAttribute("aria-current", "false");
  });

  it("scrolls the track to the clicked dot's page", () => {
    renderCarousel();

    const track = screen.getByRole("region", { name: "Test items" });
    setScrollGeometry(track, { scrollLeft: 0, clientWidth: 300, scrollWidth: 900 });
    fireEvent.scroll(track);

    fireEvent.click(screen.getByRole("button", { name: "Go to page 3 of 3" }));

    expect(track.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ left: 600 }));
  });

  it("marks the last dot current at the true scroll end even when the last page is partial", () => {
    renderCarousel();

    const track = screen.getByRole("region", { name: "Test items" });
    // scrollWidth isn't an even multiple of clientWidth here (1030 / 300 ->
    // 4 pages), so the true max scroll position (730) rounds down to page 2
    // of 300px pages - the bug this test guards against.
    setScrollGeometry(track, { scrollLeft: 730, clientWidth: 300, scrollWidth: 1030 });
    fireEvent.scroll(track);

    expect(screen.getByRole("button", { name: "Go to page 4 of 4" })).toHaveAttribute("aria-current", "true");
  });

  describe("edgeFade", () => {
    it("applies no mask when edgeFade is off, even mid-scroll", () => {
      renderCarousel({ edgeFade: false });

      const track = screen.getByRole("region", { name: "Test items" });
      setScrollGeometry(track, { scrollLeft: 300, clientWidth: 300, scrollWidth: 900 });
      fireEvent.scroll(track);

      expect(track.style.maskImage).toBe("");
    });

    it("applies a fully-opaque mask at rest when there's nothing to scroll", () => {
      renderCarousel({ edgeFade: true });

      const track = screen.getByRole("region", { name: "Test items" });
      setScrollGeometry(track, { scrollLeft: 0, clientWidth: 900, scrollWidth: 900 });
      fireEvent.scroll(track);

      expect(track.style.getPropertyValue("--carousel-edge-fade-left-opacity")).toBe("1");
      expect(track.style.getPropertyValue("--carousel-edge-fade-right-opacity")).toBe("1");
    });

    it("fades only the trailing edge at the start, so the true first card stays fully visible", () => {
      renderCarousel({ edgeFade: true });

      const track = screen.getByRole("region", { name: "Test items" });
      setScrollGeometry(track, { scrollLeft: 0, clientWidth: 300, scrollWidth: 900 });
      fireEvent.scroll(track);

      expect(track.style.getPropertyValue("--carousel-edge-fade-left-opacity")).toBe("1");
      expect(track.style.getPropertyValue("--carousel-edge-fade-right-opacity")).toBe("0");
    });

    it("fades only the leading edge at the end, so the true last card stays fully visible", () => {
      renderCarousel({ edgeFade: true });

      const track = screen.getByRole("region", { name: "Test items" });
      setScrollGeometry(track, { scrollLeft: 600, clientWidth: 300, scrollWidth: 900 });
      fireEvent.scroll(track);

      expect(track.style.getPropertyValue("--carousel-edge-fade-left-opacity")).toBe("0");
      expect(track.style.getPropertyValue("--carousel-edge-fade-right-opacity")).toBe("1");
    });

    it("fades both edges mid-scroll", () => {
      renderCarousel({ edgeFade: true });

      const track = screen.getByRole("region", { name: "Test items" });
      setScrollGeometry(track, { scrollLeft: 300, clientWidth: 300, scrollWidth: 900 });
      fireEvent.scroll(track);

      expect(track.style.getPropertyValue("--carousel-edge-fade-left-opacity")).toBe("0");
      expect(track.style.getPropertyValue("--carousel-edge-fade-right-opacity")).toBe("0");
    });

    it("keeps the mask gradient's shape constant across every fading state - only the two custom-property opacities move", () => {
      renderCarousel({ edgeFade: true });

      const track = screen.getByRole("region", { name: "Test items" });
      const expectedMask =
        "linear-gradient(to right, rgba(255, 255, 255, var(--carousel-edge-fade-left-opacity)) 0%, white 40%, white 60%, rgba(255, 255, 255, var(--carousel-edge-fade-right-opacity)) 100%)";

      setScrollGeometry(track, { scrollLeft: 0, clientWidth: 300, scrollWidth: 900 });
      fireEvent.scroll(track);
      expect(track.style.maskImage).toBe(expectedMask);

      setScrollGeometry(track, { scrollLeft: 300, clientWidth: 300, scrollWidth: 900 });
      fireEvent.scroll(track);
      expect(track.style.maskImage).toBe(expectedMask);

      setScrollGeometry(track, { scrollLeft: 600, clientWidth: 300, scrollWidth: 900 });
      fireEvent.scroll(track);
      expect(track.style.maskImage).toBe(expectedMask);
    });

    it("transitions the edge-fade opacities - not the mask image itself - by default", () => {
      renderCarousel({ edgeFade: true });

      const track = screen.getByRole("region", { name: "Test items" });
      setScrollGeometry(track, { scrollLeft: 300, clientWidth: 300, scrollWidth: 900 });
      fireEvent.scroll(track);

      expect(track.style.transitionProperty).toBe(
        "--carousel-edge-fade-left-opacity, --carousel-edge-fade-right-opacity",
      );
      expect(track.style.transitionDuration).toBe("400ms");
      expect(track.style.transitionTimingFunction).toBe("ease-in-out");
    });

    it("narrows the edge-fade zone to roughly one item's width once item width is measurable", () => {
      renderCarousel({ edgeFade: true });

      const track = screen.getByRole("region", { name: "Test items" });
      setItemOffsets(track, [0, 100]);
      setScrollGeometry(track, { scrollLeft: 300, clientWidth: 500, scrollWidth: 1000 });
      fireEvent.scroll(track);

      expect(track.style.maskImage).toBe(
        "linear-gradient(to right, rgba(255, 255, 255, var(--carousel-edge-fade-left-opacity)) 0%, white 20%, white 80%, rgba(255, 255, 255, var(--carousel-edge-fade-right-opacity)) 100%)",
      );
    });

    it("pages by less than a full viewport once item width is measurable, so a dimmed trailing item clears the next page's own fade zone", () => {
      renderCarousel({ edgeFade: true });

      const track = screen.getByRole("region", { name: "Test items" });
      setItemOffsets(track, [0, 100]);
      setScrollGeometry(track, { scrollLeft: 0, clientWidth: 500, scrollWidth: 1000 });
      fireEvent.scroll(track);

      fireEvent.click(screen.getByRole("button", { name: "Next" }));

      // edge fade width = min(itemStride 100, clientWidth*0.45 225) = 100
      // page advance = max(itemStride 100, clientWidth 500 - 2*100) = 300,
      // not a full 500 - the two item-widths held back are what let the
      // item dimmed at this page's trailing edge land clear of the next
      // page's own left-edge fade instead of disappearing into it.
      expect(track.scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 300 }));
    });

    it("skips the edge-fade transition when the user prefers reduced motion", () => {
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

      renderCarousel({ edgeFade: true });

      const track = screen.getByRole("region", { name: "Test items" });
      setScrollGeometry(track, { scrollLeft: 300, clientWidth: 300, scrollWidth: 900 });
      fireEvent.scroll(track);

      expect(track.style.transitionDuration).toBe("0ms");
    });
  });
});
