import rawContent from "../../content/content.json";

export interface HeaderLink {
  id: number;
  sort: number;
  title: string;
  url: string;
  parent: string;
}

interface Content {
  "nav-header": HeaderLink[];
  projects: unknown[];
  resume: {
    filename: string;
  };
}

const content = rawContent as Content;

export function getHeaderLinks(): HeaderLink[] {
  return [...content["nav-header"]].sort((a, b) => a.sort - b.sort);
}

export function getResumeUrl(): string {
  const filename = content.resume.filename.trim();

  if (!filename) {
    throw new Error("content.json resume.filename must not be empty.");
  }

  return `/media/${filename
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}
