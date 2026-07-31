import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Project } from "@/lib/content";
import ProjectHeader from "./ProjectHeader";

const baseProject: Project = {
  sort: 0,
  slug: "test-project",
  value: "post:project:1",
  general: {
    date: "2014-07",
    role: "Developer, Designer",
    title: "Test Project",
    content: "A description of the test project.",
    url: "https://example.com/",
    url_wayback: "",
    repo: "",
    workplace: [],
    supported_browsers: ["firefox", "chrome", "safari"],
  },
  thumbnail: { static: "WordPress.png", on_hover: "" },
  technology: { language: [], framework: [], deployment: [], software: [] },
  screenshot: { desktop: [], desktop_cutoff: null, mobile: [] },
  pagebuilder: "[]",
};

describe("ProjectHeader", () => {
  it("shows the title, role, rounded date, and content", () => {
    render(<ProjectHeader project={baseProject} />);

    expect(screen.getByRole("heading", { level: 1, name: "Test Project" })).toBeInTheDocument();
    expect(screen.getByText("Developer, Designer")).toBeInTheDocument();
    expect(screen.getByText("Mid 2014")).toBeInTheDocument();
    expect(screen.getByText("A description of the test project.")).toBeInTheDocument();
  });

  it("always shows Launch Website when a url is present, and hides Launch Wayback when none is set", () => {
    render(<ProjectHeader project={baseProject} />);

    const launch = screen.getByRole("link", { name: "Launch Website" });
    expect(launch).toHaveAttribute("href", "https://example.com/");
    expect(launch).toHaveAttribute("target", "_blank");
    expect(screen.queryByRole("link", { name: "Launch Wayback" })).not.toBeInTheDocument();
  });

  it("shows Launch Wayback only when url_wayback is set", () => {
    const project: Project = {
      ...baseProject,
      general: { ...baseProject.general, url_wayback: "https://web.archive.org/web/2015/https://example.com/" },
    };
    render(<ProjectHeader project={project} />);

    const wayback = screen.getByRole("link", { name: "Launch Wayback" });
    expect(wayback).toHaveAttribute("href", "https://web.archive.org/web/2015/https://example.com/");
  });

  it("omits the screenshot carousel when there are no desktop screenshots", () => {
    const { container } = render(<ProjectHeader project={baseProject} />);

    expect(container.querySelectorAll("img").length).toBe(0);
  });

  it("renders the screenshot carousel when desktop screenshots exist", () => {
    const project: Project = {
      ...baseProject,
      screenshot: { desktop: ["screencapture-cygnusmgmt-desktop.jpg"], desktop_cutoff: null, mobile: [] },
    };
    const { container } = render(<ProjectHeader project={project} />);

    expect(container.querySelector('img[src*="browser-firefox.svg"]')).not.toBeNull();
  });
});
