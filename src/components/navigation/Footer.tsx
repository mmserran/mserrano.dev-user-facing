"use client";

import { useState } from "react";

export default function Footer() {
  // Computed client-side so the year is always correct in the visitor's
  // browser, not frozen at whatever year the site was last deployed.
  const [year] = useState(() => new Date().getFullYear());

  return (
    <footer className="sticky bottom-0 z-50 flex h-9 items-center justify-between bg-brand-blue px-4 text-sm text-white">
      <span>mserrano.dev</span>
      <span suppressHydrationWarning>&copy; {year}</span>
    </footer>
  );
}
