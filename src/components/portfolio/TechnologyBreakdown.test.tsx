import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getProjectBySlug, type Project } from "@/lib/content";
import TechnologyBreakdown from "./TechnologyBreakdown";

describe("TechnologyBreakdown", () => {
  it("renders an accessible graph and grouped technology legend", () => {
    const project = getProjectBySlug("mserrano-dev") as Project;
    render(<TechnologyBreakdown project={project} />);

    expect(screen.getByRole("heading", { level: 2, name: "Technology breakdown" })).toBeInTheDocument();
    const graph = screen.getByRole("img", { name: `Technology usage breakdown for ${project.general.title}` });
    expect(graph).toBeInTheDocument();
    expect(graph.querySelector('path[fill="#41B883"]:not([fill-opacity])')).toBeInTheDocument();
    const nestedVueOverlay = graph.querySelector('path[fill="#41B883"][fill-opacity="0.25"]');
    expect(nestedVueOverlay).toHaveAttribute("pointer-events", "none");
    const outerVueWedge = graph.querySelector('path[fill="#41B883"]:not([fill-opacity])');
    fireEvent.mouseEnter(outerVueWedge as SVGPathElement);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Vue");
    expect(screen.getByRole("heading", { level: 3, name: "Scripts" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Template / Styles" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Server" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Dev Environment" })).toBeInTheDocument();

    const scripts = screen.getByRole("heading", { name: "Scripts" }).closest("section");
    expect(scripts).not.toBeNull();
    expect(within(scripts as HTMLElement).getByRole("link", { name: "JavaScript" })).toHaveAttribute(
      "href",
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    );
  });

  it("does not render when the graph block is unavailable", () => {
    const project = getProjectBySlug("mserrano-dev") as Project;
    const { container } = render(<TechnologyBreakdown project={{ ...project, pagebuilder: "[]" }} />);

    expect(container).toBeEmptyDOMElement();
  });
});
