import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ResumePage, { metadata } from "./page";

vi.mock("@/components/illustration/EndcapShell", () => ({
  default: ({ cta }: { cta?: { label: string; href: string } }) => (
    <div data-testid="endcap-shell">
      {cta && <a href={cta.href}>{cta.label}</a>}
    </div>
  ),
}));

describe("ResumePage", () => {
  it("exports resume metadata", () => {
    expect(metadata.title).toBe("Resume | Mark Anthony Serrano");
  });

  it("renders page title, fallback text, and portfolio link", () => {
    render(<ResumePage />);

    expect(screen.getByRole("heading", { level: 1, name: "Resume" })).toBeInTheDocument();
    expect(screen.getAllByText("Resume PDF").length).toBeGreaterThan(0);

    const portfolioCta = screen.getByRole("link", { name: "View My Portfolio" });
    expect(portfolioCta).toHaveAttribute("href", "/projects/");
    expect(screen.getByTestId("endcap-shell")).toBeInTheDocument();
  });
});
