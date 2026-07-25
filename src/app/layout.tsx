import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import AppShell from "@/components/navigation/AppShell";
import Footer from "@/components/navigation/Footer";
import { getHeaderLinks } from "@/lib/content";
import "./globals.css";

// Matches the Gridsome frontend's site-wide font (`$font-reading` in
// _base-styles.scss), loaded there via @font-face. Every weight below is
// used by an existing Tailwind font-* utility somewhere in the app - any
// weight left out here gets silently substituted by the browser with
// whichever loaded weight is nearest, which reads as noticeably off.
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mark Serrano",
  description: "Portfolio of Mark Serrano.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`flex min-h-full flex-col overflow-x-hidden antialiased ${montserrat.className}`}
      >
        <AppShell headerLinks={getHeaderLinks()}>{children}</AppShell>
        <Footer />
      </body>
    </html>
  );
}
