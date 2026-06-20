import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nikhil Chavan - Full Stack Developer",
    short_name: "Nikhil Chavan",
    description:
      "Full Stack Developer Portfolio of Nikhil Chavan. Modern web apps, scalable APIs, projects, and blogs.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b12",
    theme_color: "#0b0b12",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
