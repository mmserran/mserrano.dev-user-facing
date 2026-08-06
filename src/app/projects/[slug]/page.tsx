import type { Metadata } from "next";
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
      title: "Project Not Found | Mark Anthony Serrano",
    };
  }

  return {
    title: `${project.general.title} | Mark Anthony Serrano`,
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

      <EndcapShell cta={{ label: "Back to Portfolio", href: "/projects/" }} />
    </main>
  );
}
