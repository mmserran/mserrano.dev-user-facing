import type { Metadata } from "next";
import localFont from "next/font/local";
import JsonLd from "@/components/JsonLd";
import AppShell from "@/components/navigation/AppShell";
import Footer from "@/components/navigation/Footer";
import { getHeaderLinks, getProjects } from "@/lib/content";
import { getSiteJsonLd } from "@/lib/json-ld";
import "./globals.css";

// Matches the Gridsome frontend's site-wide font (`$font-reading` in
// _base-styles.scss), loaded there via @font-face. Self-hosted directly
// (rather than next/font/google) because this Next.js build's Google
// Fonts loader was serving byte-identical files for every requested
// weight - every font-* utility rendered as the same face regardless of
// its declared weight. These 5 static files were fetched straight from
// fonts.gstatic.com and confirmed distinct (by size and OS/2.usWeightClass).
const montserrat = localFont({
  src: [
    { path: "../fonts/montserrat/Montserrat-300.woff2", weight: "300", style: "normal" },
    { path: "../fonts/montserrat/Montserrat-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/montserrat/Montserrat-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/montserrat/Montserrat-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/montserrat/Montserrat-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mserrano.dev"),
  title: "Mark Serrano",
  description: "Portfolio of Mark Serrano.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US" className="h-full">
      <body
        className={`flex min-h-full flex-col overflow-x-hidden antialiased ${montserrat.className}`}
      >
        <JsonLd data={getSiteJsonLd()} />
        <AppShell headerLinks={getHeaderLinks()} projects={getProjects()}>
          {children}
        </AppShell>
        <Footer />
      </body>
    </html>
  );
}

