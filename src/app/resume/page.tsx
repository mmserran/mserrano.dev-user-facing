import type { Metadata } from "next";
import Image from "next/image";
import { MdDescription, MdOpenInNew } from "react-icons/md";
import { getHeaderLinks, getResumeUrl } from "@/lib/content";
import EndcapShell from "@/components/illustration/EndcapShell";
import PageTitle from "@/components/typography/PageTitle";

export const metadata: Metadata = {
  title: "Resume | Mark Serrano",
  description: "View or download Mark Serrano's resume.",
  alternates: {
    canonical: "/resume/",
  },
};

const LINK_ARTWORK: Record<string, string> = {
  Resume: "/assets/icon-pdf.svg",
  LinkedIn: "/assets/icon-linkedin.svg",
  GitHub: "/assets/icon-github.svg",
};

function getFooterHref(title: string, url: string, resumeUrl: string) {
  return title.toLowerCase() === "resume" ? resumeUrl : url;
}

export default function ResumePage() {
  const resumeUrl = getResumeUrl();
  const headerLinks = getHeaderLinks();

  return (
    <main className="min-h-[calc(100dvh-4rem)] text-white">
      <PageTitle>Resume</PageTitle>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
        <section
          aria-labelledby="resume-document-title"
          className="pt-12 sm:pt-16"
        >
          <h2 id="resume-document-title" className="sr-only">
            Resume document
          </h2>

          <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-lg">
            <object
              data={resumeUrl}
              type="application/pdf"
              aria-label="Mark Anthony Serrano resume"
              className="hidden h-[calc(100dvh-10rem)] min-h-[44rem] w-full sm:block"
            >
              <ResumeFallback resumeUrl={resumeUrl} />
            </object>

            <div className="sm:hidden">
              <ResumeFallback resumeUrl={resumeUrl} />
            </div>
          </div>
        </section>

        <nav aria-label="Resume links" className="pt-14 sm:pt-20">
          <h2 className="sr-only">Resume links</h2>
          <ul className="mx-auto grid w-fit justify-center gap-4 sm:grid-cols-3 sm:gap-8">
            {headerLinks.map((link) => {
              const href = getFooterHref(link.title, link.url, resumeUrl);
              const artwork = LINK_ARTWORK[link.title];
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
                    className="group mx-auto flex size-48 items-center justify-center rounded-sm border border-slate-200 bg-white shadow-xl transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue sm:size-36 lg:size-40"
                  >
                    {artwork && (
                      <Image
                        src={artwork}
                        alt=""
                        width={512}
                        height={512}
                        unoptimized
                        className="size-32 opacity-50 grayscale transition-[filter,opacity] duration-250 group-hover:opacity-100 group-hover:grayscale-0 sm:size-20 lg:size-24"
                      />
                    )}
                    <span className="sr-only">{link.title}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

      </section>

      <EndcapShell cta={{ label: "View My Portfolio", href: "/projects/" }} />
    </main>
  );
}

function ResumeFallback({ resumeUrl }: { resumeUrl: string }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
      <MdDescription aria-hidden="true" className="text-6xl text-brand-blue" />
      <h3 className="mt-5 text-2xl font-bold">Resume PDF</h3>
      <p className="mt-3 max-w-md leading-7 text-slate-600">
        Your browser does not display PDF documents here. Open the original file
        to view it with your preferred PDF reader.
      </p>
      <a
        href={resumeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-brand-blue px-5 py-3 font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
      >
        Open resume PDF
        <MdOpenInNew aria-hidden="true" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </div>
  );
}
