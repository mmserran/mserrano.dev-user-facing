import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import ProjectPage, { generateMetadata, generateStaticParams } from "./page";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

vi.mock("@/components/illustration/EndcapShell", () => ({
  default: () => <div data-testid="endcap-shell" />,
}));

// RelatedProjects renders every other project's real media-heavy ProjectTile;
// its own rendering/composition logic is covered by RelatedProjects.test.tsx,
// so it's stubbed here the same way EndcapShell is - this file only cares
// that ProjectPage wires the current project into it.
const relatedProjectsSpy = vi.fn();
vi.mock("@/components/portfolio/RelatedProjects", () => ({
  default: (props: { project: { slug: string } }) => {
    relatedProjectsSpy(props);
    return <div data-testid="related-projects" />;
  },
}));

describe("ProjectPage", () => {
  it("generates static params for all project slugs", async () => {
    const params = await generateStaticParams();
    expect(params.length).toBeGreaterThan(0);
    expect(params[0]).toHaveProperty("slug");
  });

  it("generates metadata for a valid project", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "cygnus-management-llc" }),
    });
    expect(meta.title).toBe("Cygnus Management, LLC | Mark Serrano");
    expect(meta.description).toContain("My uncle needed a website");
  });

  it("generates fallback metadata for invalid project", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "non-existent-slug" }),
    });
    expect(meta.title).toBe("Project Not Found | Mark Serrano");
  });

  it("renders project details, Back to Portfolio link, and EndcapShell", async () => {
    const pageComponent = await ProjectPage({
      params: Promise.resolve({ slug: "cygnus-management-llc" }),
    });
    render(pageComponent);

    expect(
      screen.getByRole("heading", { level: 1, name: "Cygnus Management, LLC" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Developer, Designer/)).toBeInTheDocument();
    expect(screen.getByText(/My uncle needed a website/)).toBeInTheDocument();

    const backLink = screen.getByRole("link", { name: "Back to Portfolio" });
    expect(backLink).toHaveAttribute("href", "/projects");
    expect(screen.getByTestId("endcap-shell")).toBeInTheDocument();
    expect(screen.getByTestId("related-projects")).toBeInTheDocument();
    expect(relatedProjectsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ project: expect.objectContaining({ slug: "cygnus-management-llc" }) }),
    );
  });

  it("calls notFound for invalid slug", async () => {
    await ProjectPage({
      params: Promise.resolve({ slug: "non-existent-slug" }),
    });
    expect(notFound).toHaveBeenCalled();
  });
});
