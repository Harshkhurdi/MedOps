import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MedOps — Medical equipment operations",
    short_name: "MedOps",
    description: "Private operations and engineer service workflow",
    start_url: "/engineer",
    scope: "/",
    display: "standalone",
    background_color: "#f4f7f9",
    theme_color: "#142d39",
    icons: [
      {
        src: "/medops-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/medops-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
