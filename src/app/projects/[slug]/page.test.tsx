import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import ProjectPage, { generateMetadata, generateStaticParams } from "./page";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

vi.mock("@/components/illustration/EndcapShell", () => ({
  default: ({ cta }: { cta?: { label: string; href: string } }) => (
    <div data-testid="endcap-shell">
      {cta && <a href={cta.href}>{cta.label}</a>}
    </div>
  ),
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

// TechnologyCarousel renders the shared Carousel primitive, which needs a
// real ResizeObserver; its own rendering/composition logic is covered by
// TechnologyCarousel.test.tsx, so it's stubbed here for the same reason as
// RelatedProjects - this file only cares that ProjectPage wires the current
// project into it.
const technologyCarouselSpy = vi.fn();
vi.mock("@/components/portfolio/TechnologyCarousel", () => ({
  default: (props: { project: { slug: string } }) => {
    technologyCarouselSpy(props);
    return <div data-testid="technology-carousel" />;
  },
}));

// MobileMosaic also needs a real ResizeObserver, for the same reason as
// TechnologyCarousel above; its own rendering/composition logic is covered
// by MobileMosaic.test.tsx.
const mobileMosaicSpy = vi.fn();
vi.mock("@/components/portfolio/MobileMosaic", () => ({
  default: (props: { project: { slug: string } }) => {
    mobileMosaicSpy(props);
    return <div data-testid="mobile-mosaic" />;
  },
}));

// CenterEmphasisCarousel renders every slide's real 3D coverflow styling
// (mask-image gradients, calc()-based custom properties, a duplicated
// click-catcher layer) for the same reason as the three above - its own
// rendering/composition logic is covered by CenterEmphasisCarousel.test.tsx,
// and jsdom's CSS matching is slow enough on that much arbitrary-value
// Tailwind that rendering it unmocked here made this suite's own tests
// flaky under load (a stderr "[csstree-match] BREAK after 15000
// iterations" warning, then an outright timeout) even though it's never
// slow in a real browser.
const centerEmphasisCarouselSpy = vi.fn();
vi.mock("@/components/portfolio/CenterEmphasisCarousel", () => ({
  default: (props: { project: { slug: string } }) => {
    centerEmphasisCarouselSpy(props);
    return <div data-testid="center-emphasis-carousel" />;
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
    expect(meta.title).toBe("Cygnus Management, LLC | Mark Anthony Serrano");
    expect(meta.description).toContain("My uncle needed a website");
    expect(meta.alternates).toEqual({
      canonical: "/projects/cygnus-management-llc/",
    });
  });

  it("generates fallback metadata for invalid project", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "non-existent-slug" }),
    });
    expect(meta.title).toBe("Project Not Found | Mark Anthony Serrano");
  });

  // 10s, not vitest's 5s default: this still renders a genuinely large real
  // Server Component tree (ProjectHeader, TechnologyBreakdown's SVG chart,
  // two Triplet blocks, CenterEmphasisCarousel and friends mocked above
  // notwithstanding) that's landed close enough to the default under a
  // resource-contended full-suite run to be worth the headroom, even though
  // it's never actually slow standalone or in a real browser.
  it(
    "renders project details, Back to Portfolio link, and EndcapShell",
    async () => {
      const pageComponent = await ProjectPage({
        params: Promise.resolve({ slug: "cygnus-management-llc" }),
      });
      render(pageComponent);

      expect(
        screen.getByRole("heading", { level: 1, name: "Cygnus Management, LLC" }),
      ).toBeInTheDocument();
      expect(screen.getByText(/Developer, Designer/)).toBeInTheDocument();
      expect(screen.getByText(/My uncle needed a website/)).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: "Technology breakdown" })).toBeInTheDocument();

      const backLink = screen.getByRole("link", { name: "Back to Portfolio" });
      expect(backLink).toHaveAttribute("href", "/projects/");
      expect(screen.getByTestId("endcap-shell")).toBeInTheDocument();
      expect(screen.getByTestId("related-projects")).toBeInTheDocument();
      expect(relatedProjectsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ project: expect.objectContaining({ slug: "cygnus-management-llc" }) }),
      );
      expect(screen.getByTestId("technology-carousel")).toBeInTheDocument();
      expect(technologyCarouselSpy).toHaveBeenCalledWith(
        expect.objectContaining({ project: expect.objectContaining({ slug: "cygnus-management-llc" }) }),
      );
      expect(screen.getByTestId("mobile-mosaic")).toBeInTheDocument();
      expect(mobileMosaicSpy).toHaveBeenCalledWith(
        expect.objectContaining({ project: expect.objectContaining({ slug: "cygnus-management-llc" }) }),
      );
      expect(screen.getByTestId("center-emphasis-carousel")).toBeInTheDocument();
      expect(centerEmphasisCarouselSpy).toHaveBeenCalledWith(
        expect.objectContaining({ project: expect.objectContaining({ slug: "cygnus-management-llc" }) }),
      );

      const jsonLd = document.querySelector('script[type="application/ld+json"]');
      expect(jsonLd).not.toBeNull();
      expect(JSON.parse(jsonLd!.textContent ?? "")).toEqual(
        expect.objectContaining({
          "@type": "CreativeWork",
          name: "Cygnus Management, LLC",
          url: "https://mserrano.dev/projects/cygnus-management-llc/",
        }),
      );
    },
    10000,
  );

  it("calls notFound for invalid slug", async () => {
    await ProjectPage({
      params: Promise.resolve({ slug: "non-existent-slug" }),
    });
    expect(notFound).toHaveBeenCalled();
  });
});
