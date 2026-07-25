import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Footer from "./Footer";

describe("Footer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the home link and the visitor's current year", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2035-06-15T12:00:00Z"));

    render(<Footer />);

    expect(screen.getByRole("link", { name: "mserrano.dev" })).toHaveAttribute("href", "/");
    expect(screen.getByText("© 2035")).toBeInTheDocument();
  });
});
