import type { MetadataRoute } from "next";

// Manifest de la PWA. Next lo sirve en /manifest.webmanifest e inyecta el
// <link rel="manifest"> automáticamente. Los íconos viven en /public.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Prode Mundial 2026",
    short_name: "Prode 26",
    description:
      "Jugá al prode del Mundial 2026 con tus amigos. Cargá tus pronósticos y competí por la corona.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es-AR",
    dir: "ltr",
    categories: ["sports", "games"],
    background_color: "#f7f2e7",
    theme_color: "#f7f2e7",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
