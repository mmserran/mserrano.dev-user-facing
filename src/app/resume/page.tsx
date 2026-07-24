import type { Metadata } from "next";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { MdDescription, MdLink, MdOpenInNew } from "react-icons/md";
import type { IconType } from "react-icons";
import { getHeaderLinks, getResumeUrl } from "@/lib/content";

export const metadata: Metadata = {
  title: "Résumé | Mark Serrano",
  description: "View or download Mark Serrano's résumé.",
};

const LINK_ICONS: Record<string, IconType> = {
  Resume: MdDescription,
  LinkedIn: FaLinkedin,
  GitHub: FaGithub,
};

function getFooterHref(title: string, url: string, resumeUrl: string) {
  return title.toLowerCase() === "resume" ? resumeUrl : url;
}

export default function ResumePage() {
  const resumeUrl = getResumeUrl();
  const headerLinks = getHeaderLinks();

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-slate-50 text-slate-950">
      <section className="mx-auto w-full max-w-6xl px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 lg:px-8">
        <h1 className="text-center text-4xl font-light tracking-[0.28em] text-slate-700 uppercase sm:text-5xl sm:tracking-[0.4em] lg:text-6xl">
          Resume
        </h1>

        <section
          aria-labelledby="resume-document-title"
          className="pt-12 sm:pt-16"
        >
          <h2 id="resume-document-title" className="sr-only">
            Résumé document
          </h2>

          <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-lg">
            <object
              data={resumeUrl}
              type="application/pdf"
              aria-label="Mark Anthony Serrano résumé"
              className="hidden h-[calc(100dvh-10rem)] min-h-[44rem] w-full sm:block"
            >
              <ResumeFallback resumeUrl={resumeUrl} />
            </object>

            <div className="sm:hidden">
              <ResumeFallback resumeUrl={resumeUrl} />
            </div>
          </div>
        </section>

        <nav aria-label="Résumé links" className="pt-14 sm:pt-20">
          <h2 className="sr-only">Résumé links</h2>
          <ul className="mx-auto grid w-fit justify-center gap-4 sm:grid-cols-3 sm:gap-8">
            {headerLinks.map((link) => {
              const href = getFooterHref(link.title, link.url, resumeUrl);
              const Icon = LINK_ICONS[link.title] ?? MdLink;
              const opensNewTab =
                link.title.toLowerCase() === "resume" || !href.startsWith("/");

              return (
                <li key={link.id}>
                  <a
                    href={href}
                    {...(opensNewTab
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    aria-label={
                      opensNewTab
                        ? `${link.title} (opens in a new tab)`
                        : link.title
                    }
                    className="mx-auto flex size-48 items-center justify-center rounded-sm border border-slate-200 bg-white text-slate-400 shadow-xl transition-[color,transform,box-shadow] hover:-translate-y-1 hover:text-slate-600 hover:shadow-2xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-brand-blue sm:size-36 lg:size-40"
                  >
                    <Icon aria-hidden="true" className="text-7xl sm:text-6xl" />
                    <span className="sr-only">{link.title}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex justify-center pt-16 sm:pt-20">
          <a
            href="/projects/"
            className="inline-flex min-h-12 min-w-56 items-center justify-center rounded-sm border border-slate-300 bg-white px-7 py-3 text-lg font-light text-slate-700 shadow-lg transition-[color,transform,box-shadow] hover:-translate-y-0.5 hover:text-brand-blue hover:shadow-xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-brand-blue"
          >
            View My Portfolio
          </a>
        </div>
      </section>
    </main>
  );
}

function ResumeFallback({ resumeUrl }: { resumeUrl: string }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
      <MdDescription
        aria-hidden="true"
        className="text-6xl text-brand-blue"
      />
      <h3 className="mt-5 text-2xl font-bold">Résumé PDF</h3>
      <p className="mt-3 max-w-md leading-7 text-slate-600">
        Your browser does not display PDF documents here. Open the original
        file to view it with your preferred PDF reader.
      </p>
      <a
        href={resumeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-brand-blue px-5 py-3 font-semibold text-white hover:bg-blue-800 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-brand-blue"
      >
        Open résumé PDF
        <MdOpenInNew aria-hidden="true" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </div>
  );
}
