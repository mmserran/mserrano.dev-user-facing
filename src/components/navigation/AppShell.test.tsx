import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AppShell from "./AppShell";
import type { HeaderLink } from "@/lib/content";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/projects",
}));

describe("AppShell", () => {
  const mockHeaderLinks: HeaderLink[] = [
    { id: 1, sort: 1, title: "Resume", url: "/resume/", parent: "" },
    { id: 2, sort: 2, title: "LinkedIn", url: "https://linkedin.com", parent: "" },
    { id: 3, sort: 3, title: "GitHub", url: "https://github.com", parent: "" },
  ];

  it("renders skip link, header links, and children", () => {
    render(
      <AppShell headerLinks={mockHeaderLinks}>
        <div data-testid="main-child">Main Content</div>
      </AppShell>
    );

    expect(screen.getByText("Skip to content")).toBeInTheDocument();
    expect(screen.getByTestId("main-child")).toBeInTheDocument();

    const resumeLink = screen.getByRole("link", { name: "Resume" });
    expect(resumeLink).toHaveAttribute("href", "/resume/");

    const linkedinLink = screen.getByRole("link", { name: "LinkedIn (opens in a new tab)" });
    expect(linkedinLink).toHaveAttribute("href", "https://linkedin.com");
    expect(linkedinLink).toHaveAttribute("target", "_blank");
  });

  it("toggles the navigation drawer on menu button click", () => {
    const { container } = render(
      <AppShell headerLinks={mockHeaderLinks}>
        <div>Content</div>
      </AppShell>
    );

    const toggleButton = screen.getByRole("button", { name: /navigation/i });
    const navDrawer = container.querySelector("#site-drawer");
    expect(navDrawer).toBeInTheDocument();

    // Initial state: drawer closed
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
    expect(navDrawer).toHaveAttribute("aria-hidden", "true");
    expect(navDrawer).toHaveAttribute("inert");

    // Click menu button to open drawer
    fireEvent.click(toggleButton);

    expect(toggleButton).toHaveAttribute("aria-expanded", "true");
    expect(navDrawer).toHaveAttribute("aria-hidden", "false");
    expect(navDrawer).not.toHaveAttribute("inert");

    // Click menu button again to close
    fireEvent.click(toggleButton);

    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
    expect(navDrawer).toHaveAttribute("aria-hidden", "true");
    expect(navDrawer).toHaveAttribute("inert");
  });

  it("closes the drawer on Escape key press", () => {
    const { container } = render(
      <AppShell headerLinks={mockHeaderLinks}>
        <div>Content</div>
      </AppShell>
    );

    const toggleButton = screen.getByRole("button", { name: /navigation/i });
    const navDrawer = container.querySelector("#site-drawer");
    expect(navDrawer).toBeInTheDocument();

    // Open drawer
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute("aria-expanded", "true");

    // Press Escape
    fireEvent.keyDown(document, { key: "Escape" });

    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
    expect(navDrawer).toHaveAttribute("aria-hidden", "true");
  });

  it("highlights the active link in the navigation drawer when opened", () => {
    const { container } = render(
      <AppShell headerLinks={mockHeaderLinks}>
        <div>Content</div>
      </AppShell>
    );

    const toggleButton = screen.getByRole("button", { name: /navigation/i });
    // Open drawer so inert attribute is removed and items become accessible
    fireEvent.click(toggleButton);

    const navDrawer = container.querySelector("#site-drawer") as HTMLElement;
    expect(navDrawer).toBeInTheDocument();

    // /projects is mocked as current pathname
    const portfolioLink = within(navDrawer).getByRole("link", { name: "Portfolio" });
    expect(portfolioLink).toHaveAttribute("aria-current", "page");

    const resumeSidebarLink = within(navDrawer).getByRole("link", { name: "Resume" });
    expect(resumeSidebarLink).not.toHaveAttribute("aria-current");
  });
});
