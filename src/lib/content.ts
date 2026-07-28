import type { IconType } from "react-icons";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { MdDescription } from "react-icons/md";
import rawContent from "../../content/content.json";

export interface HeaderLink {
  id: number;
  sort: number;
  title: string;
  url: string;
  parent: string;
}

export const HEADER_LINK_ICONS: Record<string, IconType> = {
  Resume: MdDescription,
  LinkedIn: FaLinkedin,
  GitHub: FaGithub,
};

export interface ProjectGeneral {
  date: string;
  role: string;
  title: string;
  content: string;
  url: string;
  url_wayback: string;
  repo: string;
  workplace: string[];
  supported_browsers: string[];
}

export interface ProjectThumbnail {
  static: string;
  on_hover: string;
}

export interface ProjectTechnology {
  language: string[];
  framework: string[];
  deployment: string[];
  software: string[];
}

export interface ProjectScreenshot {
  desktop: string[];
  desktop_cutoff?: string | null;
  mobile: string[];
}

export interface Project {
  sort: number;
  slug: string;
  value: string;
  general: ProjectGeneral;
  thumbnail: ProjectThumbnail;
  technology: ProjectTechnology;
  screenshot: ProjectScreenshot;
  pagebuilder: string;
}

interface Content {
  "nav-header": HeaderLink[];
  projects: Project[];
  resume: {
    filename: string;
    contact_email: string;
  };
}

const content = rawContent as Content;

export function getHeaderLinks(): HeaderLink[] {
  return [...content["nav-header"]].sort((a, b) => a.sort - b.sort);
}

export function getProjects(): Project[] {
  return [...content.projects].sort((a, b) => {
    if (a.general.date && b.general.date) {
      return b.general.date.localeCompare(a.general.date);
    }
    return b.sort - a.sort;
  });
}

export function getProjectBySlug(slug: string): Project | undefined {
  return content.projects.find((p) => p.slug === slug);
}

export function getMediaUrl(filename: string): string {
  const trimmedFilename = filename.trim();

  if (!trimmedFilename) {
    throw new Error("content.json resume.filename must not be empty.");
  }

  return `/media/${trimmedFilename
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

export function getResumeUrl(): string {
  return getMediaUrl(content.resume.filename);
}

export function getContactEmail(): string {
  const email = content.resume.contact_email.trim();

  if (!email) {
    throw new Error("content.json resume.contact_email must not be empty.");
  }

  return email;
}

