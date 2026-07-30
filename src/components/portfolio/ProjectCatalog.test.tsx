import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project, ProjectFilter } from "@/lib/content";
import ProjectCatalog from "./ProjectCatalog";

let mockSearch = "";
const push = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/projects",
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

function makeProject(slug: string, title: string, overrides: Partial<Project> = {}): Project {
  return {
    sort: 0,
    slug,
    value: `post:project:${slug}`,
    general: {
      date: "2020-07",
      role: "Developer",
      title,
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
    ...overrides,
  };
}

function makeFilter(overrides: Partial<ProjectFilter>): ProjectFilter {
  return {
    slug: "wordpress",
    value: "term:framework:1",
    title: "WordPress",
    url: "",
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

const projects: Project[] = [
  makeProject("wp-project", "WordPress Project", {
    technology: { language: [], framework: ["wordpress"], deployment: [], software: [] },
  }),
  makeProject("other-project", "Other Project"),
];

const filters: ProjectFilter[] = [makeFilter({})];

describe("ProjectCatalog", () => {
  beforeEach(() => {
    mockSearch = "";
    push.mockClear();
  });

  it("shows every project and the total count when no filter is selected", () => {
    render(<ProjectCatalog projects={projects} filters={filters} />);

    expect(screen.getByText("2 / 2 Projects Visible")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /WordPress Project/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Other Project/ })).toBeInTheDocument();
  });

  it("narrows the visible tiles and count based on the ?q= URL parameter", () => {
    mockSearch = "q=wordpress";
    render(<ProjectCatalog projects={projects} filters={filters} />);

    expect(screen.getByText("1 / 2 Projects Visible")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /WordPress Project/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Other Project/ })).not.toBeInTheDocument();
  });

  it("pushes the selected filter slug onto the query string", async () => {
    const user = userEvent.setup();
    render(<ProjectCatalog projects={projects} filters={filters} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: /WordPress/ }));

    expect(push).toHaveBeenCalledWith("/projects?q=wordpress", { scroll: false });
  });
});
