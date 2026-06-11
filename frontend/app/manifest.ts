import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EPUBMaker — Web-based EPUB Creator & Converter",
    short_name: "EPUBMaker",
    description:
      "Create professional EPUB ebooks online. A simple web-based EPUB maker and converter.",
    lang: "en",
    start_url: "/",
    display: "standalone",
    background_color: "#181c35",
    theme_color: "#181c35",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
