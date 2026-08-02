import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PageBuilderSection, Project, ProjectFilter, TripletSectionView } from "@/lib/content";
import Triplet from "./Triplet";

const { getTripletSectionView } = vi.hoisted(() => ({ getTripletSectionView: vi.fn() }));

vi.mock("@/lib/content", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/content")>()),
  getTripletSectionView,
}));

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
    value: "term:framework:1",
    title: "Test Filter",
    url: "https://example.com",
    affinity: "",
    is_square: false,
    is_full_color: false,
    primary: "#123456",
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
const section: PageBuilderSection = { type: "pbTriplet", title: "Technology", content: "", list_triplet: [] };

describe("Triplet", () => {
  it("renders the section title and each technology item as a logo link", () => {
    const view: TripletSectionView = {
      title: "Technology",
      content: "",
      items: [
        { type: "itemTechnology", key: "tech-0", technology: makeFilter({ slug: "django", title: "Django" }) },
        {
          type: "itemTechnology",
          key: "tech-1",
          technology: makeFilter({ slug: "cloudinary", title: "Cloudinary", url: "" }),
        },
      ],
    };
    getTripletSectionView.mockReturnValue(view);

    render(<Triplet section={section} project={project} />);

    expect(screen.getByRole("heading", { level: 3, name: "Technology" })).toBeInTheDocument();
    const djangoLink = screen.getByRole("link", { name: "Django" });
    expect(djangoLink).toHaveAttribute("href", "https://example.com");
    expect(djangoLink).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Cloudinary")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Cloudinary" })).not.toBeInTheDocument();
  });

  it("renders resolved section content beneath the title", () => {
    const view: TripletSectionView = {
      title: "Usage vs Similar",
      content: "Striped bars represent similar technology used by my other projects.",
      items: [
        {
          type: "itemGraph",
          key: "graph-0",
          title: "Frameworks",
          cards: [
            {
              key: "django",
              technology: makeFilter({ slug: "django", title: "Django" }),
              projects: 4,
              isHighProficiency: false,
              isFirstUsedHere: false,
              isActive: true,
              statistic: "Using Web Framework since 2018",
            },
          ],
        },
      ],
    };
    getTripletSectionView.mockReturnValue(view);

    render(<Triplet section={section} project={project} />);

    expect(
      screen.getByText("Striped bars represent similar technology used by my other projects."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 5, name: "Frameworks" })).toBeInTheDocument();
    expect(screen.getByText("4 projects")).toBeInTheDocument();
    expect(screen.getByText("Using Web Framework since 2018")).toBeInTheDocument();

    const djangoLink = screen.getByRole("link", { name: /Django/ });
    expect(djangoLink).toHaveAttribute("href", "https://example.com");
    expect(djangoLink).toHaveAttribute("target", "_blank");
  });

  it("renders a graph card with no url as a plain, non-interactive cell", () => {
    const view: TripletSectionView = {
      title: "Usage vs Similar",
      content: "",
      items: [
        {
          type: "itemGraph",
          key: "graph-0",
          title: "Frameworks",
          cards: [
            {
              key: "cloudinary",
              technology: makeFilter({ slug: "cloudinary", title: "Cloudinary", url: "" }),
              projects: 2,
              isHighProficiency: false,
              isFirstUsedHere: false,
              isActive: true,
              statistic: "Using CDN since 2018",
            },
          ],
        },
      ],
    };
    getTripletSectionView.mockReturnValue(view);

    render(<Triplet section={section} project={project} />);

    expect(screen.getByText("Cloudinary")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Cloudinary/ })).not.toBeInTheDocument();
  });

  it("shows a High Proficiency badge and a First used here badge as accessible, hoverable icons", () => {
    const django = makeFilter({ slug: "django", title: "Django" });
    const flask = makeFilter({ slug: "flask", title: "Flask" });
    const view: TripletSectionView = {
      title: "Usage vs Similar",
      content: "",
      items: [
        {
          type: "itemGraph",
          key: "graph-0",
          title: "Frameworks",
          cards: [
            {
              key: "django",
              technology: django,
              projects: 8,
              isHighProficiency: true,
              isFirstUsedHere: false,
              isActive: true,
              statistic: "Using Web Framework since 2014",
            },
            {
              key: "flask",
              technology: flask,
              projects: 1,
              isHighProficiency: false,
              isFirstUsedHere: true,
              isActive: true,
              statistic: "Using Web Framework since 2014",
            },
          ],
        },
      ],
    };
    getTripletSectionView.mockReturnValue(view);

    render(<Triplet section={section} project={project} />);

    expect(screen.getByText("High Proficiency")).toBeInTheDocument();
    expect(screen.getByText("First used here")).toBeInTheDocument();

    const djangoLink = screen.getByRole("link", { name: /Django/ });
    expect(djangoLink).not.toContainElement(screen.getByText("High Proficiency"));
    const flaskLink = screen.getByRole("link", { name: /Flask/ });
    expect(flaskLink).not.toContainElement(screen.getByText("First used here"));
  });

  it("dims a dormant card without a High Proficiency or First used here badge", () => {
    const cobol = makeFilter({ slug: "cobol", title: "COBOL" });
    const view: TripletSectionView = {
      title: "Usage vs Similar",
      content: "",
      items: [
        {
          type: "itemGraph",
          key: "graph-0",
          title: "Languages",
          cards: [
            {
              key: "cobol",
              technology: cobol,
              projects: 1,
              isHighProficiency: false,
              isFirstUsedHere: false,
              isActive: false,
              statistic: "Web Framework of choice in 2014",
            },
          ],
        },
      ],
    };
    getTripletSectionView.mockReturnValue(view);

    const { container } = render(<Triplet section={section} project={project} />);

    expect(screen.getByText("Web Framework of choice in 2014")).toBeInTheDocument();
    expect(screen.queryByText("High Proficiency")).not.toBeInTheDocument();
    expect(screen.queryByText("First used here")).not.toBeInTheDocument();
    expect(container.querySelector(".opacity-70")).toBeInTheDocument();
  });

  it("omits the heading when the section has no title", () => {
    const view: TripletSectionView = {
      title: "",
      content: "",
      items: [
        { type: "itemTechnology", key: "tech-0", technology: makeFilter({ slug: "django", title: "Django" }) },
      ],
    };
    getTripletSectionView.mockReturnValue(view);

    render(<Triplet section={section} project={project} />);

    expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
    expect(screen.getByText("Django")).toBeInTheDocument();
  });

  it("renders nothing when there are no resolvable items", () => {
    getTripletSectionView.mockReturnValue({ title: "Technology", content: "", items: [] });

    const { container } = render(<Triplet section={section} project={project} />);

    expect(container).toBeEmptyDOMElement();
  });

});
