import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EndcapShell from "@/components/illustration/EndcapShell";
import PageBuilder from "@/components/portfolio/PageBuilder";
import { getProjectBySlug, getProjects } from "@/lib/content";

export async function generateStaticParams() {
  const projects = getProjects();
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project Not Found | Mark Serrano",
    };
  }

  return {
    title: `${project.general.title} | Mark Serrano`,
    description:
      project.general.content.trim() ||
      `View details for ${project.general.title}.`,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
    return null;
  }

  return (
    <main className="min-h-[calc(100dvh-4rem)] text-white">
      <PageBuilder project={project} />

      <div className="flex justify-center px-4 pt-16 pb-16 sm:pt-24">
        <Link
          href="/projects/"
          className="inline-flex min-h-12 min-w-56 items-center justify-center rounded-sm border border-slate-300 bg-white px-7 py-3 text-lg font-light text-slate-700 shadow-lg transition-[color,transform,box-shadow] hover:-translate-y-0.5 hover:text-brand-blue hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue motion-reduce:transform-none"
        >
          Back to Portfolio
        </Link>
      </div>

      <EndcapShell />
    </main>
  );
}
