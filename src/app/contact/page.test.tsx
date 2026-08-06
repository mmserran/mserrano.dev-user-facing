import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ContactPage, { metadata } from "./page";

vi.mock("@/components/illustration/EndcapShell", () => ({
  default: ({ cta }: { cta?: { label: string; href: string } }) => (
    <div data-testid="endcap-shell">
      {cta && <a href={cta.href}>{cta.label}</a>}
    </div>
  ),
}));

vi.mock("@/components/contact/ContactForm", () => ({
  default: ({ contactEmail }: { contactEmail: string }) => (
    <div data-testid="contact-form" data-email={contactEmail} />
  ),
}));

describe("ContactPage", () => {
  it("exports contact metadata", () => {
    expect(metadata.title).toBe("Contact | Mark Serrano");
    expect(metadata.alternates).toEqual({ canonical: "/contact/" });
  });

  it("renders page title, form, and resume endcap CTA", () => {
    render(<ContactPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Contact" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Let's Talk" })).toBeInTheDocument();

    const form = screen.getByTestId("contact-form");
    expect(form).toBeInTheDocument();
    expect(form.getAttribute("data-email")).toMatch(/@/);

    const resumeCta = screen.getByRole("link", { name: "View My Resume" });
    expect(resumeCta).toHaveAttribute("href", "/resume/");
    expect(screen.getByTestId("endcap-shell")).toBeInTheDocument();
  });
});
