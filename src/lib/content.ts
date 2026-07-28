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

interface Content {
  "nav-header": HeaderLink[];
  projects: unknown[];
  resume: {
    filename: string;
    contact_email: string;
  };
}

const content = rawContent as Content;

export function getHeaderLinks(): HeaderLink[] {
  return [...content["nav-header"]].sort((a, b) => a.sort - b.sort);
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
