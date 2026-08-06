"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { filterProjects, type Project, type ProjectFilter } from "@/lib/content";
import FilterBar from "./FilterBar";
import ProjectTile from "./ProjectTile";

function parseSelectedSlugs(searchParams: URLSearchParams): string[] {
  const raw = searchParams.get("q");
  if (!raw) return [];
  return raw
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
}

// A tile spans two grid columns at the same 794px breakpoint as the
// Gridsome frontend's `.card:first-child, .card:nth-child(10n)` rule -
// verified live: tile 1 (and, on a longer list, tile 10, 20...) is
// double-width on desktop.
function spansTwoColumns(index: number): boolean {
  const position = index + 1;
  return position === 1 || position % 10 === 0;
}

export default function ProjectCatalog({
  projects,
  filters,
}: {
  projects: Project[];
  filters: ProjectFilter[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedSlugs = parseSelectedSlugs(searchParams);
  const visibleProjects = filterProjects(projects, selectedSlugs);

  function setSelectedSlugs(slugs: string[]) {
    const query = slugs.length > 0 ? `?q=${slugs.map(encodeURIComponent).join(",")}` : "";
    router.push(`${pathname}${query}`, { scroll: false });
  }

  return (
    <>
      <FilterBar filters={filters} selectedSlugs={selectedSlugs} onChange={setSelectedSlugs} />

      <p aria-live="polite" className="mx-auto mt-6 max-w-6xl text-sm text-white/80">
        {visibleProjects.length} / {projects.length} Projects Visible
      </p>

      <div className="mx-auto mt-6 grid max-w-6xl gap-5 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
        {visibleProjects.map((project, index) => (
          <ProjectTile
            key={project.slug}
            project={project}
            className={spansTwoColumns(index) ? "min-[794px]:col-span-2" : ""}
          />
        ))}
      </div>
    </>
  );
}
