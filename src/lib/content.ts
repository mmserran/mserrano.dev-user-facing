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
  resume: unknown;
}

const content = rawContent as Content;

export function getHeaderLinks(): HeaderLink[] {
  return [...content["nav-header"]].sort((a, b) => a.sort - b.sort);
}
