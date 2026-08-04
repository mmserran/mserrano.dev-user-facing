import type { Metadata } from "next";
import Link from "next/link";
import EndcapShell, {
  ENDCAP_CTA_LINK_CLASSES,
} from "@/components/illustration/EndcapShell";

export const metadata: Metadata = {
  title: "Mark Anthony Serrano Portfolio Website",
  description:
    "Portfolio of Mark Anthony Serrano — software engineer specializing in WordPress and Shopify development.",
};

export default function Home() {
  return (
    <main className="relative flex flex-1">
      <EndcapShell fill />

      <div className="relative z-10 flex flex-1 items-center justify-center px-[5vmin] py-[10vmin]">
        <div className="flex w-full max-w-[800px] flex-col items-center gap-[2vw] text-center">
          <h1 className="shine-text animate-shine motion-reduce:animate-none font-medium text-white uppercase tracking-[0.325em] [font-size:calc(0.5rem+4vmin)] lg:[font-size:calc(0.5rem+4.75vmin)]">
            Mark Anthony Serrano
          </h1>
          <h2 className="shine-text animate-shine motion-reduce:animate-none pb-[2vmin] font-medium text-white uppercase tracking-[0.325em] [font-size:calc(0.25rem+1vmin)] md:[font-size:calc(0.5rem+1vmin)]">
            Developer | WordPress | Shopify
          </h2>

          <div className="mt-5 flex w-full flex-col items-center gap-5 md:flex-row md:justify-center">
            <Link href="/contact/" className={ENDCAP_CTA_LINK_CLASSES}>
              Contact Me
            </Link>
            <Link href="/projects/" className={ENDCAP_CTA_LINK_CLASSES}>
              View Portfolio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
