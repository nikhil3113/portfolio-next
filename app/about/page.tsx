import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, siteUrl } from "@/lib/site";
import { serializeJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: "About Nikhil Chavan" },
  description:
    "Nikhil Chavan is a full stack developer building production web apps with Next.js, React, TypeScript and Node.js. Background, approach and contact.",
  alternates: {
    canonical: absoluteUrl("/about"),
  },
  openGraph: {
    title: "About Nikhil Chavan",
    description:
      "Full stack developer building production web apps with Next.js, React, TypeScript and Node.js.",
    url: absoluteUrl("/about"),
    siteName: "Nikhil Chavan Portfolio",
    type: "profile",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Nikhil Chavan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Nikhil Chavan",
    description:
      "Full stack developer building production web apps with Next.js, React, TypeScript and Node.js.",
    images: ["/opengraph-image"],
  },
};

const background = [
  {
    role: "Full Stack Developer - Developer Executive",
    company: "Digixpressions Pvt Ltd",
    period: "January 2025 - Present",
  },
  {
    role: "Product Intern",
    company: "Digixpressions Pvt Ltd",
    period: "September 2024 - January 2025",
  },
  {
    role: "Java Developer Intern",
    company: "Mira Advanced Engineering",
    period: "June 2023 - July 2023",
  },
  {
    role: "Flutter Developer Intern",
    company: "Terna Engineering College",
    period: "February 2023 - April 2023",
  },
];

const stack = [
  "Next.js",
  "React",
  "TypeScript",
  "Node.js",
  "Tailwind CSS",
  "Prisma",
  "MongoDB",
  "MySQL",
  "Go",
  "Java",
];

export default function AboutPage() {
  const profileLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": absoluteUrl("/about#profile"),
    url: absoluteUrl("/about"),
    name: "About Nikhil Chavan",
    mainEntity: { "@id": `${siteUrl}/#person` },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "About",
        item: absoluteUrl("/about"),
      },
    ],
  };

  return (
    <div className="px-4 py-16 md:px-2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(profileLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }}
      />
      <article className="mx-auto w-full max-w-3xl">
        <p className="mb-2 font-semibold tracking-wide text-accent-text">
          ABOUT
        </p>
        <h1 className="mb-6 text-3xl font-bold text-foreground md:text-4xl">
          About Nikhil Chavan
        </h1>

        <div className="space-y-6 leading-relaxed text-muted-foreground">
          <p>
            I&apos;m a full stack developer who builds and ships production web
            applications. Most of my work is in TypeScript: Next.js and React on
            the front end, Node.js on the server, with MongoDB or MySQL behind
            it.
          </p>
          <p>
            I care about the parts of a product that are easy to skip: server
            rendering, caching, accessibility, and page weight. The articles on
            this site come from that work, reverse engineering how coding agents
            and chat models actually operate, and rebuilding the ideas in small
            projects to see where they break.
          </p>
        </div>

        <h2 className="mb-4 mt-12 text-2xl font-bold text-foreground">
          What I work with
        </h2>
        <ul className="flex flex-wrap gap-2">
          {stack.map((item) => (
            <li
              key={item}
              className="rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium text-foreground"
            >
              {item}
            </li>
          ))}
        </ul>

        <h2 className="mb-4 mt-12 text-2xl font-bold text-foreground">
          Background
        </h2>
        <div className="divide-y divide-border">
          {background.map((item) => (
            <div
              key={`${item.company}-${item.role}`}
              className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
            >
              <div>
                <h3 className="font-semibold text-foreground">{item.role}</h3>
                <p className="text-sm text-muted-foreground">{item.company}</p>
              </div>
              <p className="text-sm text-muted-foreground">{item.period}</p>
            </div>
          ))}
        </div>

        <h2 className="mb-4 mt-12 text-2xl font-bold text-foreground">
          Elsewhere
        </h2>
        <ul className="flex flex-wrap gap-6 text-foreground">
          <li>
            <a
              href="https://github.com/nikhil3113"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-border underline-offset-4 transition-colors hover:text-accent-text"
            >
              GitHub
            </a>
          </li>
          <li>
            <a
              href="https://www.linkedin.com/in/nikchavan"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-border underline-offset-4 transition-colors hover:text-accent-text"
            >
              LinkedIn
            </a>
          </li>
          <li>
            <a
              href="mailto:chavann717@gmail.com"
              className="underline decoration-border underline-offset-4 transition-colors hover:text-accent-text"
            >
              Email
            </a>
          </li>
        </ul>

        <p className="mt-12 text-muted-foreground">
          See what I&apos;ve built on{" "}
          <Link
            href="/projects"
            className="underline decoration-border underline-offset-4 transition-colors hover:text-accent-text"
          >
            the projects page
          </Link>
          , or read{" "}
          <Link
            href="/blogs"
            className="underline decoration-border underline-offset-4 transition-colors hover:text-accent-text"
          >
            the blog
          </Link>
          .
        </p>
      </article>
    </div>
  );
}
