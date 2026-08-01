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
          columns: [
            {
              key: "django",
              technology: makeFilter({ slug: "django", title: "Django" }),
              segments: [{ technology: makeFilter({ slug: "django", title: "Django" }), usage: 4, striped: false }],
              total: 4,
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

  it("uses secondary for striped segments when primary is white", () => {
    const composer = makeFilter({
      slug: "composer",
      title: "Composer",
      primary: "#FFFFFF",
      secondary: "#131313",
    });
    const yarn = makeFilter({ slug: "yarn", title: "Yarn", primary: "#2C8EBB", secondary: "#ffffff" });
    const view: TripletSectionView = {
      title: "Usage vs Similar",
      content: "",
      items: [
        {
          type: "itemGraph",
          key: "graph-0",
          title: "Software",
          columns: [
            {
              key: "yarn",
              technology: yarn,
              segments: [
                { technology: yarn, usage: 2, striped: false },
                { technology: composer, usage: 3, striped: true },
              ],
              total: 5,
            },
          ],
        },
      ],
    };
    getTripletSectionView.mockReturnValue(view);

    const { container } = render(<Triplet section={section} project={project} />);
    const solid = container.querySelector('[title="Yarn: 2"]') as HTMLElement;
    const striped = container.querySelector('[title="Composer: 3"]') as HTMLElement;

    expect(solid.style.backgroundColor).toBe("rgb(44, 142, 187)");
    expect(solid.style.backgroundImage).toBe("");
    expect(striped.style.backgroundColor).toBe("transparent");
    expect(striped.style.backgroundImage).toBe(
      "repeating-linear-gradient(45deg, rgb(19, 19, 19) 0 3px, transparent 3px 7px)",
    );
  });
});
