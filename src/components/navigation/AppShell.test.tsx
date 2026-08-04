import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppShell from "./AppShell";
import type { HeaderLink, Project } from "@/lib/content";

let mockPathname = "/projects";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

describe("AppShell", () => {
  beforeEach(() => {
    mockPathname = "/projects";
  });

  const mockHeaderLinks: HeaderLink[] = [
    { id: 1, sort: 1, title: "Resume", url: "/resume/", parent: "" },
    { id: 2, sort: 2, title: "LinkedIn", url: "https://linkedin.com", parent: "" },
    { id: 3, sort: 3, title: "GitHub", url: "https://github.com", parent: "" },
  ];

  const mockProjects: Project[] = [
    {
      sort: 0,
      slug: "cygnus-management-llc",
      value: "post:project:14",
      general: {
        date: "2014-07",
        role: "Developer",
        title: "Cygnus Management, LLC",
        content: "Content",
        url: "",
        url_wayback: "",
        repo: "",
        workplace: [],
        supported_browsers: [],
      },
      thumbnail: { static: "", on_hover: "" },
      technology: { language: [], framework: [], deployment: [], software: [] },
      screenshot: { desktop: [], mobile: [] },
      pagebuilder: "[]",
    },
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
  }, 15_000);

  it("shows the full identity and keeps the drawer scrollable in short viewports", () => {
    const { container } = render(
      <AppShell headerLinks={mockHeaderLinks}>
        <div>Content</div>
      </AppShell>
    );

    const identity = screen.getByText("Mark Anthony Serrano");
    const navDrawer = container.querySelector("#site-drawer");

    expect(identity).toHaveClass("whitespace-nowrap", "text-[19px]");
    expect(identity).not.toHaveClass("truncate");
    expect(navDrawer).toHaveClass(
      "h-[calc(100dvh-6.25rem)]",
      "overflow-y-auto",
      "overscroll-y-contain",
      "pb-[max(1rem,env(safe-area-inset-bottom))]",
    );
  });

  it("relies on CSS alone for the default open state on desktop, applying a forced override only after a manual toggle", () => {
    const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 1264px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal("matchMedia", matchMediaMock);

    const { container } = render(
      <AppShell headerLinks={mockHeaderLinks}>
        <div>Content</div>
      </AppShell>
    );

    const navDrawer = container.querySelector("#site-drawer");
    const toggleButton = screen.getByRole("button", { name: /navigation/i });

    // No manual override yet: the drawer's default open/closed state is
    // purely CSS-driven (min-[1264px]:translate-x-0), not gated by JS.
    expect(navDrawer).not.toHaveAttribute("data-forced");
    expect(navDrawer).toHaveClass("min-[1264px]:translate-x-0", "transition-transform");

    // Interaction/a11y follows the same cascade: open on desktop, not inert.
    expect(toggleButton).toHaveAttribute("aria-expanded", "true");
    expect(navDrawer).toHaveAttribute("aria-hidden", "false");
    expect(navDrawer).not.toHaveAttribute("inert");

    // First toggle derives next state from the media/data-forced cascade
    // (closes when desktop-open), rather than a stale isDesktop=false snapshot.
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
    expect(navDrawer).toHaveAttribute("data-forced", "closed");
    expect(navDrawer).toHaveAttribute("inert");

    vi.unstubAllGlobals();
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

    const contactIcon = within(navDrawer).getByRole("link", { name: "Contact" }).querySelector("svg");
    expect(contactIcon?.className.baseVal).toContain("text-[22px]");
    expect(contactIcon?.className.baseVal).toContain("text-black/55");

    const resumeIcon = resumeSidebarLink.querySelector("svg");
    expect(resumeIcon?.className.baseVal).toContain("translate-x-[3px]");
  });

  it("renders active project links in navigation drawer when on a project page", () => {
    mockPathname = "/projects/cygnus-management-llc";
    const { container } = render(
      <AppShell headerLinks={mockHeaderLinks} projects={mockProjects}>
        <div>Content</div>
      </AppShell>
    );

    const toggleButton = screen.getByRole("button", { name: /navigation/i });
    fireEvent.click(toggleButton);

    const navDrawer = container.querySelector("#site-drawer") as HTMLElement;
    const portfolioLink = within(navDrawer).getByRole("link", { name: "Portfolio" });
    expect(portfolioLink).not.toHaveAttribute("aria-current");
    expect(portfolioLink.className).toContain("after:right-4");
    expect(portfolioLink.className).toContain("pr-8");

    const projectLink = within(navDrawer).getByRole("link", { name: "Cygnus Management, LLC" });
    expect(projectLink).toHaveAttribute("href", "/projects/cygnus-management-llc");
    expect(projectLink).toHaveAttribute("aria-current", "page");
    expect(projectLink.className).toContain("after:right-6");
  });
});
