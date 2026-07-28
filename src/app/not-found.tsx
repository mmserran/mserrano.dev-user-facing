import type { Metadata } from "next";
import Link from "next/link";
import EndcapShell from "@/components/illustration/EndcapShell";
import PageTitle from "@/components/typography/PageTitle";

export const metadata: Metadata = {
  title: "404 | Mark Serrano",
};

export default function NotFound() {
  return (
    <main className="min-h-[calc(100dvh-4rem)] text-white">
      <PageTitle>404</PageTitle>

      <div className="flex justify-center pb-16 sm:pb-24">
        <Link
          href="/"
          className="inline-flex min-h-12 min-w-56 items-center justify-center rounded-sm border border-slate-300 bg-white px-7 py-3 text-lg font-light text-slate-700 shadow-lg transition-[color,transform,box-shadow] hover:-translate-y-0.5 hover:text-brand-blue hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue"
        >
          Home
        </Link>
      </div>

      <EndcapShell />
    </main>
  );
}
