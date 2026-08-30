import { ProjectCard } from "@/components/project/ProjectCard";
import { getProjects } from "@/lib/action/projects";
import { Project } from "@/types/projects";
import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Projects | Full Stack Web Apps by Nikhil Chavan",
  description:
    "Portfolio projects by Nikhil Chavan: production-ready full stack web apps built with Next.js, React, TypeScript, Node.js, MySQL, and MongoDB. Explore live demos and source code.",
  keywords: [
    "full stack projects",
    "next.js projects",
    "react portfolio",
    "typescript projects",
    "node.js projects",
    "nikhil chavan projects",
  ],
  alternates: {
    canonical: absoluteUrl("/projects"),
  },
  openGraph: {
    title: "Projects | Nikhil Chavan",
    description:
      "Production-ready full stack projects built with Next.js, React, TypeScript, Node.js, MySQL, and MongoDB.",
    url: absoluteUrl("/projects"),
    siteName: "Nikhil Chavan Portfolio",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Nikhil Chavan Projects",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Projects | Nikhil Chavan",
    description:
      "Production-ready full stack projects built with Next.js, React, TypeScript, Node.js, MySQL, and MongoDB.",
    images: ["/opengraph-image"],
  },
};

export default async function ProjectsPage() {
  const projects = await getProjects();
  return (
    <div className="px-2 md:mx-32 py-16">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <p className="text-accent-text font-semibold mb-2 tracking-wide">MY WORK</p>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Projects</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore my portfolio of projects that showcase my technical skills and
          problem-solving abilities. Each project represents unique challenges
          I&apos;ve tackled using different technologies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project: Project) => (
          <ProjectCard key={project.id} {...project} />
        ))}
      </div>

      <div className="text-center mt-16 ">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            ></path>
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
