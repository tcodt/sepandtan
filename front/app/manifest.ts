import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "سپندتن | مربی هوشمند فیتنس",
    short_name: "سپندتن",
    description: "برنامه تمرینی و رژیم شخصی با هوش مصنوعی",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#f97316",
    orientation: "portrait",
    lang: "fa",
    dir: "rtl",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
