import type { Metadata } from "next";
import { Suspense } from "react";
import EndcapShell from "@/components/illustration/EndcapShell";
import ProjectCatalog from "@/components/portfolio/ProjectCatalog";
import PageTitle from "@/components/typography/PageTitle";
import { getProjectFilters, getProjects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Portfolio | Mark Anthony Serrano",
  description: "Browse Mark Anthony Serrano's portfolio of WordPress and Shopify projects, filterable by technology.",

};

export default function ProjectsPage() {
  const projects = getProjects();
  const filters = getProjectFilters();

  return (
    <main className="min-h-[calc(100dvh-4rem)] text-white">
      <PageTitle>Portfolio</PageTitle>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
        {/* useSearchParams (inside ProjectCatalog) requires a Suspense boundary for static export. */}
        <Suspense fallback={null}>
          <ProjectCatalog projects={projects} filters={filters} />
        </Suspense>
      </section>

      <EndcapShell cta={{ label: "Contact Me", href: "/contact/" }} />
    </main>
  );
}
