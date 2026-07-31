import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type Project, type RelatedProjects as RelatedProjectsResult } from "@/lib/content";
import RelatedProjects from "./RelatedProjects";

const { getRelatedProjects } = vi.hoisted(() => ({ getRelatedProjects: vi.fn() }));

vi.mock("@/lib/content", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/content")>()),
  getRelatedProjects,
}));

class FakeResizeObserver {
  observe() {}
  disconnect() {}
}

// Lightweight fixture (empty thumbnail) so ProjectTile doesn't mount real
// media layers - matches ProjectCatalog.test.tsx's makeProject convention.
// The real recommendation algorithm is covered against real content.json by
// content.test.ts's getRelatedProjects suite; this file only exercises
// RelatedProjects' own rendering/composition logic.
function makeProject(slug: string, title: string): Project {
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
  };
}

const project = makeProject("current-project", "Current Project");

describe("RelatedProjects", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  });

  it("renders the backend-provided heading and each related project as a link", () => {
    const related: RelatedProjectsResult = {
      title: "Related",
      projects: [makeProject("pulsemobile", "pulseMobile"), makeProject("pulselink", "pulseLink")],
    };
    getRelatedProjects.mockReturnValue(related);

    render(<RelatedProjects project={project} />);

    expect(screen.getByRole("heading", { level: 3, name: "Related" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /pulseMobile/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /pulseLink/ })).toBeInTheDocument();
  });

  it("renders nothing when there are no related projects", () => {
    getRelatedProjects.mockReturnValue({ title: "", projects: [] });

    const { container } = render(<RelatedProjects project={project} />);

    expect(container).toBeEmptyDOMElement();
  });
});
