import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProjectsPage, { metadata } from "./page";

vi.mock("@/components/illustration/EndcapShell", () => ({
  default: ({ cta }: { cta?: { label: string; href: string } }) => (
    <div data-testid="endcap-shell">
      {cta && <a href={cta.href}>{cta.label}</a>}
    </div>
  ),
}));

vi.mock("@/components/portfolio/ProjectCatalog", () => ({
  default: () => <div data-testid="project-catalog" />,
}));

describe("ProjectsPage", () => {
  it("exports portfolio metadata", () => {
    expect(metadata.title).toBe("Portfolio | Mark Anthony Serrano");
  });

  it("renders page title, catalog, and contact endcap CTA", () => {
    render(<ProjectsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Portfolio" })).toBeInTheDocument();
    expect(screen.getByTestId("project-catalog")).toBeInTheDocument();

    const contactCta = screen.getByRole("link", { name: "Contact Me" });
    expect(contactCta).toHaveAttribute("href", "/contact/");
    expect(screen.getByTestId("endcap-shell")).toBeInTheDocument();
  });
});
