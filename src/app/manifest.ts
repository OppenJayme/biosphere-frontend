/** Install metadata for the BioSphere public site and protected curator PWA. */

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BioSphere — USC Biological Museum",
    short_name: "BioSphere",
    description:
      "Museum cataloging and public information for the USC Biological Museum.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#166534",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
