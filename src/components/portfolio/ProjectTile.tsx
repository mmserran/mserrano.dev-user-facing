import Link from "next/link";
import { formatRoundedDate, truncate, type Project } from "@/lib/content";
import ProjectTileImage from "./ProjectTileImage";

// A single link wraps the whole card (thumbnail, title, and "Learn More" all
// point to the same destination) rather than the Gridsome frontend's three
// separate same-target <a> tags - one tab stop per project instead of three
// identical ones, per WCAG 2.1 AA link-purpose guidance.
export default function ProjectTile({ project, className = "" }: { project: Project; className?: string }) {
  return (
    <Link
      href={`/projects/${project.slug}/`}
      className={`group flex h-full flex-col overflow-hidden rounded-lg bg-white text-black shadow-lg transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue motion-reduce:transform-none ${className}`}
    >
      <ProjectTileImage staticFilename={project.thumbnail.static} hoverFilename={project.thumbnail.on_hover} />

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold text-brand-blue group-hover:underline">{project.general.title}</h3>
        <p className="mt-1 text-xs text-black/60">{formatRoundedDate(project.general.date)}</p>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-black/80">
          {truncate(project.general.content, 120)}
        </p>
        <span className="mt-4 self-end text-sm font-medium text-brand-blue">Learn More</span>
      </div>
    </Link>
  );
}
