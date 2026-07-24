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
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex flex-col gap-6 border-b border-slate-300 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-semibold tracking-[0.18em] text-brand-blue uppercase">
              Software Engineer
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              Mark Anthony Serrano
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              View my résumé below or open the original PDF in your browser.
            </p>
          </div>

          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-brand-blue px-5 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-brand-blue"
          >
            Open résumé PDF
            <MdOpenInNew aria-hidden="true" className="text-lg" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>

        <section aria-labelledby="resume-document-title" className="py-8">
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

        <nav aria-label="Résumé links" className="border-t border-slate-300 pt-8">
          <h2 className="text-center text-xl font-bold">Find me online</h2>
          <ul className="mt-5 flex flex-wrap justify-center gap-3">
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
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-slate-400 bg-white px-5 py-3 font-semibold text-slate-900 transition-colors hover:border-brand-blue hover:text-brand-blue focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-brand-blue"
                  >
                    <Icon aria-hidden="true" className="text-xl" />
                    {link.title}
                    {opensNewTab && (
                      <span className="sr-only">(opens in a new tab)</span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
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
