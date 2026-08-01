import type { Project } from "@/lib/content";
import { formatRoundedDate } from "@/lib/content";
import ProjectScreenshotCarousel from "./ProjectScreenshotCarousel";

const LAUNCH_BUTTON_CLASS =
  "inline-flex min-h-12 min-w-56 items-center justify-center rounded-md bg-brand-blue px-5 py-3 text-lg font-medium text-white shadow-lg transition-[transform,box-shadow] hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue motion-reduce:transform-none";

// Ported from pbHeader.vue: the top-of-page project summary - title, role,
// rounded date, description, Launch Website / Launch Wayback links - paired
// with the alternating-browser-frame screenshot carousel.
export default function ProjectHeader({ project }: { project: Project }) {
  const { general, screenshot } = project;

  return (
    <div className="mx-auto flex w-full max-w-[768px] flex-col gap-10 px-5 py-10 md:max-w-[1024px] md:px-[60px] lg:flex-row lg:items-center lg:gap-16 xl:max-w-[1440px] xl:px-[100px]">
      <div className="flex w-full flex-col items-start lg:w-1/2">
        <h1 className="shine-text animate-shine motion-reduce:animate-none text-3xl font-bold text-white uppercase tracking-wide sm:text-4xl">
          {general.title}
        </h1>
        <p className="mt-2 text-lg font-medium text-brand-blue uppercase tracking-wide">{general.role}</p>
        <p className="mb-6 text-lg font-medium text-brand-blue uppercase tracking-wide">
          {formatRoundedDate(general.date)}
        </p>
        <p className="text-base leading-relaxed text-white/90">{general.content}</p>

        <div className="mt-8 flex flex-wrap gap-4">
          {general.url && (
            <a href={general.url} target="_blank" rel="noopener noreferrer" className={LAUNCH_BUTTON_CLASS}>
              Launch Website
            </a>
          )}
          {general.url_wayback && (
            <a href={general.url_wayback} target="_blank" rel="noopener noreferrer" className={LAUNCH_BUTTON_CLASS}>
              Launch Wayback
            </a>
          )}
        </div>
      </div>

      {screenshot.desktop.length > 0 && (
        <div className="w-full lg:w-1/2">
          <ProjectScreenshotCarousel screenshots={screenshot.desktop} supportedBrowsers={general.supported_browsers} />
        </div>
      )}
    </div>
  );
}
