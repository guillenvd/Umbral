import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Umbral",
    short_name: "Umbral",
    description: "Control residencial de visitas y caseta",
    start_url: "/today",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f766e",
    lang: "es-MX",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };
}
