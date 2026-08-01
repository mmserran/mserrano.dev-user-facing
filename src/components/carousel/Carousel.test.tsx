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

    it("applies no mask at rest when there's nothing to scroll", () => {
      renderCarousel({ edgeFade: true });

      const track = screen.getByRole("region", { name: "Test items" });
      setScrollGeometry(track, { scrollLeft: 0, clientWidth: 900, scrollWidth: 900 });
      fireEvent.scroll(track);

      expect(track.style.maskImage).toBe("");
    });

    it("fades only the trailing edge at the start, so the true first card stays fully visible", () => {
      renderCarousel({ edgeFade: true });

      const track = screen.getByRole("region", { name: "Test items" });
      setScrollGeometry(track, { scrollLeft: 0, clientWidth: 300, scrollWidth: 900 });
      fireEvent.scroll(track);

      expect(track.style.maskImage).toBe("linear-gradient(to right, transparent 0%, white 0%, white 60%, transparent 100%)");
    });

    it("fades only the leading edge at the end, so the true last card stays fully visible", () => {
      renderCarousel({ edgeFade: true });

      const track = screen.getByRole("region", { name: "Test items" });
      setScrollGeometry(track, { scrollLeft: 600, clientWidth: 300, scrollWidth: 900 });
      fireEvent.scroll(track);

      expect(track.style.maskImage).toBe("linear-gradient(to right, transparent 0%, white 40%, white 100%, transparent 100%)");
    });

    it("fades both edges mid-scroll", () => {
      renderCarousel({ edgeFade: true });

      const track = screen.getByRole("region", { name: "Test items" });
      setScrollGeometry(track, { scrollLeft: 300, clientWidth: 300, scrollWidth: 900 });
      fireEvent.scroll(track);

      expect(track.style.maskImage).toBe("linear-gradient(to right, transparent 0%, white 40%, white 60%, transparent 100%)");
    });

    it("shares the same 4-stop gradient shape across every fading state, so browsers can crossfade between them", () => {
      renderCarousel({ edgeFade: true });

      const track = screen.getByRole("region", { name: "Test items" });
      const stopPattern = /^linear-gradient\(to right, transparent 0%, white \d+%, white \d+%, transparent 100%\)$/;

      setScrollGeometry(track, { scrollLeft: 0, clientWidth: 300, scrollWidth: 900 });
      fireEvent.scroll(track);
      expect(track.style.maskImage).toMatch(stopPattern);

      setScrollGeometry(track, { scrollLeft: 300, clientWidth: 300, scrollWidth: 900 });
      fireEvent.scroll(track);
      expect(track.style.maskImage).toMatch(stopPattern);

      setScrollGeometry(track, { scrollLeft: 600, clientWidth: 300, scrollWidth: 900 });
      fireEvent.scroll(track);
      expect(track.style.maskImage).toMatch(stopPattern);
    });

    it("transitions the mask slowly by default", () => {
      renderCarousel({ edgeFade: true });

      const track = screen.getByRole("region", { name: "Test items" });
      setScrollGeometry(track, { scrollLeft: 300, clientWidth: 300, scrollWidth: 900 });
      fireEvent.scroll(track);

      expect(track.style.transitionDuration).toBe("900ms");
      expect(track.style.transitionTimingFunction).toBe("ease-in-out");
    });

    it("skips the mask transition when the user prefers reduced motion", () => {
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
