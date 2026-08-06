import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Gridsome (the previous frontend) emitted directory-style URLs (e.g. /contact/).
  // Matching that here keeps every existing URL intact for this SEO-sensitive migration.
  trailingSlash: true,
};

export default nextConfig;
