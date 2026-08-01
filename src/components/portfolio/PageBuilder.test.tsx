import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getProjectBySlug, type PageBuilderSection, type Project } from "@/lib/content";
import PageBuilder from "./PageBuilder";

const projectHeaderSpy = vi.fn();
vi.mock("./ProjectHeader", () => ({
  default: (props: {
    project: Project;
    section: PageBuilderSection;
    index: number;
  }) => {
    projectHeaderSpy(props);
    return <div data-testid="pbHeader" />;
  },
}));
vi.mock("./TechnologyBreakdown", () => ({
  default: () => <div data-testid="pbGraphBreakdown" />,
}));
vi.mock("./TechnologyCarousel", () => ({
  default: () => <div data-testid="pbCarouselTechnology" />,
}));
vi.mock("./RelatedProjects", () => ({
  default: () => <div data-testid="pbCarouselRelatedPosts" />,
}));

function projectWithPageBuilder(sections: Record<string, unknown>[]): Project {
  const base = getProjectBySlug("cygnus-management-llc") as Project;
  return { ...base, pagebuilder: JSON.stringify(sections) };
}

describe("PageBuilder", () => {
  it("renders each project's real pagebuilder array in its own order", () => {
    const project = getProjectBySlug("cygnus-management-llc") as Project;
    render(<PageBuilder project={project} />);

    const rendered = screen
      .getAllByTestId(/^pb/)
      .map((element) => element.getAttribute("data-testid"));
    expect(rendered).toEqual([
      "pbHeader",
      "pbGraphBreakdown",
      "pbCarouselTechnology",
      "pbCarouselRelatedPosts",
    ]);
  });

  it("skips block types without a ported component", () => {
    const project = projectWithPageBuilder([
      { type: "pbHeader" },
      { type: "pbTriplet" },
      { type: "pbCarouselTechnology" },
    ]);
    render(<PageBuilder project={project} />);

    expect(screen.getByTestId("pbHeader")).toBeInTheDocument();
    expect(screen.getByTestId("pbCarouselTechnology")).toBeInTheDocument();
    expect(screen.queryByTestId("pbTriplet")).not.toBeInTheDocument();
  });

  it("renders a repeated block type once per occurrence with its own section and index", () => {
    projectHeaderSpy.mockClear();
    const project = projectWithPageBuilder([
      { type: "pbHeader", title: "First" },
      { type: "pbHeader", title: "Second" },
    ]);
    render(<PageBuilder project={project} />);

    expect(screen.getAllByTestId("pbHeader")).toHaveLength(2);
    expect(projectHeaderSpy).toHaveBeenCalledTimes(2);
    expect(projectHeaderSpy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        section: expect.objectContaining({ type: "pbHeader", title: "First" }),
        index: 0,
      }),
    );
    expect(projectHeaderSpy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        section: expect.objectContaining({ type: "pbHeader", title: "Second" }),
        index: 1,
      }),
    );
  });

  it("renders nothing for a project with an empty pagebuilder array", () => {
    const project = projectWithPageBuilder([]);
    const { container } = render(<PageBuilder project={project} />);

    expect(container).toBeEmptyDOMElement();
  });
});
