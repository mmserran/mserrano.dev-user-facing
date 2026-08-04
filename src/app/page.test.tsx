import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home, { metadata } from "./page";

vi.mock("@/components/illustration/EndcapShell", () => ({
  default: () => <div data-testid="endcap-shell" />,
  ENDCAP_CTA_LINK_CLASSES: "",
}));

describe("Home page", () => {
  it("exports portfolio metadata", () => {
    expect(metadata.title).toBe("Mark Anthony Serrano Portfolio Website");
  });

  it("renders developer name, title, CTA links, and EndcapShell", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Mark Anthony Serrano" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Developer | WordPress | Shopify" })
    ).toBeInTheDocument();

    const contactLink = screen.getByRole("link", { name: "Contact Me" });
    expect(contactLink).toHaveAttribute("href", "/contact/");

    const portfolioLink = screen.getByRole("link", { name: "View Portfolio" });
    expect(portfolioLink).toHaveAttribute("href", "/projects/");

    expect(screen.getByTestId("endcap-shell")).toBeInTheDocument();
  });
});
