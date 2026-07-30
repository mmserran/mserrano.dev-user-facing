import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Project } from "@/lib/content";
import ProjectTile from "./ProjectTile";

const project: Project = {
  sort: 0,
  slug: "test-project",
  value: "post:project:1",
  general: {
    date: "2020-07",
    role: "Developer",
    title: "Test Project",
    content: "A".repeat(140),
    url: "",
    url_wayback: "",
    repo: "",
    workplace: [],
    supported_browsers: [],
  },
  thumbnail: { static: "WordPress.png", on_hover: "" },
  technology: { language: [], framework: [], deployment: [], software: [] },
  screenshot: { desktop: [], desktop_cutoff: null, mobile: [] },
  pagebuilder: "[]",
};

describe("ProjectTile", () => {
  it("renders exactly one link pointing at the project detail page", () => {
    render(<ProjectTile project={project} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/projects/test-project");
  });

  it("shows the title, rounded date, truncated description, and Learn More", () => {
    render(<ProjectTile project={project} />);

    expect(screen.getByRole("heading", { level: 3, name: "Test Project" })).toBeInTheDocument();
    expect(screen.getByText("Mid 2020")).toBeInTheDocument();
    expect(screen.getByText(`${"A".repeat(117)}...`)).toBeInTheDocument();
    expect(screen.getByText("Learn More")).toBeInTheDocument();
  });
});
