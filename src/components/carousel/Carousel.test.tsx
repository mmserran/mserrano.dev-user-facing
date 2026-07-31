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

function renderCarousel() {
  return render(
    <Carousel ariaLabel="Test items">
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
});
