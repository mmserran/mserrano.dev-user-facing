import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "@/components/navigation/AppShell";
import Footer from "@/components/navigation/Footer";
import { getHeaderLinks } from "@/lib/content";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html
      lang="en"
      className={`h-full ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden antialiased">
        <AppShell headerLinks={getHeaderLinks()}>{children}</AppShell>
        <Footer />
      </body>
    </html>
  );
}
