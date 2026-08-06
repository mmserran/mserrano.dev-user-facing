import type { Metadata } from "next";
import EndcapShell from "@/components/illustration/EndcapShell";
import PageTitle from "@/components/typography/PageTitle";

export const metadata: Metadata = {
  title: "404 | Mark Serrano",
};

export default function NotFound() {
  return (
    <main className="min-h-[calc(100dvh-4rem)] text-white">
      <PageTitle>404</PageTitle>

      <EndcapShell cta={{ label: "Home", href: "/" }} />
    </main>
  );
}
