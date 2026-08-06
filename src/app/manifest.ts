import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mark Anthony Serrano",
    short_name: "Mark Anthony Serrano",
    description: "Portfolio of Mark Anthony Serrano.",

    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#006bb6",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
