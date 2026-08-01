import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type Project, type ProjectFilter, type TechnologyCarousel as TechnologyCarouselResult } from "@/lib/content";
import TechnologyCarousel from "./TechnologyCarousel";

const { getTechnologyCarousel } = vi.hoisted(() => ({ getTechnologyCarousel: vi.fn() }));

vi.mock("@/lib/content", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/content")>()),
  getTechnologyCarousel,
}));

class FakeResizeObserver {
  observe() {}
  disconnect() {}
}

function makeProject(): Project {
  return {
    sort: 0,
    slug: "current-project",
    value: "post:project:current-project",
    general: {
      date: "2020-07",
      role: "Developer",
      title: "Current Project",
      content: "A project description.",
      url: "",
      url_wayback: "",
      repo: "",
      workplace: [],
      supported_browsers: [],
    },
    thumbnail: { static: "", on_hover: "" },
    technology: { language: [], framework: [], deployment: [], software: [] },
    screenshot: { desktop: [], desktop_cutoff: null, mobile: [] },
    pagebuilder: "[]",
  };
}

function makeFilter(overrides: Partial<ProjectFilter>): ProjectFilter {
  return {
    slug: "test-filter",
    value: "term:software:1",
    title: "Test Filter",
    url: "https://example.com",
    affinity: "",
    is_square: false,
    is_full_color: false,
    primary: "#000000",
    secondary: "#ffffff",
    image: "",
    alias: [],
    priority: 1,
    list_trait: [],
    stats: { usage: 1, first_year_used: 2020 },
    ...overrides,
  };
}

const project = makeProject();

describe("TechnologyCarousel", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  });

  it("renders the backend-provided heading and each technology as an external link", () => {
    const carousel: TechnologyCarouselResult = {
      title: "Exposed To",
      technologies: [makeFilter({ slug: "github", title: "GitHub" }), makeFilter({ slug: "heroku", title: "Heroku" })],
    };
    getTechnologyCarousel.mockReturnValue(carousel);

    render(<TechnologyCarousel project={project} />);

    expect(screen.getByRole("heading", { level: 3, name: "Exposed To" })).toBeInTheDocument();
    const githubLink = screen.getByRole("link", { name: "GitHub" });
    expect(githubLink).toHaveAttribute("href", "https://example.com");
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "Heroku" })).toBeInTheDocument();
  });

  it("renders a technology with no url as a plain, non-interactive cell", () => {
    const carousel: TechnologyCarouselResult = {
      title: "Exposed To",
      technologies: [makeFilter({ slug: "cloudinary", title: "Cloudinary", url: "" })],
    };
    getTechnologyCarousel.mockReturnValue(carousel);

    render(<TechnologyCarousel project={project} />);

    expect(screen.getByText("Cloudinary")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Cloudinary" })).not.toBeInTheDocument();
  });

  it("renders nothing when there are no technologies", () => {
    getTechnologyCarousel.mockReturnValue({ title: "", technologies: [] });

    const { container } = render(<TechnologyCarousel project={project} />);

    expect(container).toBeEmptyDOMElement();
  });
});
