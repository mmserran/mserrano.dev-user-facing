import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NotFound, { metadata } from "./not-found";

vi.mock("@/components/illustration/EndcapShell", () => ({
  default: ({ cta }: { cta?: { label: string; href: string } }) => (
    <div data-testid="endcap-shell">
      {cta && <a href={cta.href}>{cta.label}</a>}
    </div>
  ),
}));

describe("NotFound page", () => {
  it("exports metadata with 404 title", () => {
    expect(metadata.title).toBe("404 | Mark Anthony Serrano");
  });

  it("renders 404 page title, Home link, and EndcapShell", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { level: 1, name: "404" })).toBeInTheDocument();
    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink).toHaveAttribute("href", "/");
    expect(screen.getByTestId("endcap-shell")).toBeInTheDocument();
  });
});
