import type { Metadata } from "next";
import EndcapShell from "@/components/illustration/EndcapShell";

export const metadata: Metadata = {
  title: "Mark Anthony Serrano Portfolio Website",
  description:
    "Portfolio of Mark Anthony Serrano — software engineer specializing in WordPress and Shopify development.",
};

const CTA_LINK_CLASSES =
  "shadow-cta inline-flex w-full max-w-[330px] items-center justify-center rounded bg-[#f5f5f5] px-3 py-3 text-xl leading-8 font-medium tracking-[0.0125em] text-black/87 transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue md:px-16 md:py-4";

export default function Home() {
  return (
    <main className="relative flex-1">
      <EndcapShell fill />

      <div className="absolute inset-0 z-10 flex items-center justify-center px-[5vmin] py-[10vmin]">
        <div className="flex w-full max-w-[800px] flex-col items-center gap-[2vw] text-center">
          <h1 className="shine-text animate-shine motion-reduce:animate-none font-bold text-white uppercase tracking-[0.325em] [font-size:calc(0.5rem+4vmin)] lg:[font-size:calc(0.5rem+4.75vmin)]">
            Mark Anthony Serrano
          </h1>
          <h2 className="shine-text animate-shine motion-reduce:animate-none pb-[2vmin] font-bold text-white uppercase tracking-[0.325em] [font-size:calc(0.25rem+1vmin)] md:[font-size:calc(0.5rem+1vmin)]">
            Developer | WordPress | Shopify
          </h2>

          <div className="mt-5 flex w-full flex-col items-center gap-5 md:flex-row md:justify-center">
            <a href="/contact/" className={CTA_LINK_CLASSES}>
              Contact Me
            </a>
            <a href="/projects/" className={CTA_LINK_CLASSES}>
              View Portfolio
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
