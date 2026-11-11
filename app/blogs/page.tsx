import { BlogCard } from "@/components/blog/BlogCard";
import { getBlogs } from "@/lib/action/blogs";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog: Next.js, React & AI Insights",
  description:
    "Practical articles on Next.js, React, TypeScript, web performance and AI tooling, written by Nikhil Chavan, full stack developer.",
  keywords: [
    "web development blog",
    "next.js articles",
    "react tutorials",
    "typescript guides",
    "ai explained",
    "nikhil chavan blog",
  ],
  alternates: {
    canonical: absoluteUrl("/blogs"),
  },
  openGraph: {
    title: "Blog: Next.js, React & AI Insights | Nikhil Chavan",
    description:
      "Practical articles on Next.js, React, TypeScript, web performance and AI tooling, written by Nikhil Chavan.",
    url: absoluteUrl("/blogs"),
    siteName: "Nikhil Chavan Portfolio",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Nikhil Chavan Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog: Next.js, React & AI Insights | Nikhil Chavan",
    description:
      "Practical articles on Next.js, React, TypeScript, web performance and AI tooling, written by Nikhil Chavan.",
    images: ["/opengraph-image"],
  },
};

export default async function Blogs() {
  const blogs = await getBlogs();

  if (!blogs || blogs.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="mb-3 text-2xl font-bold text-foreground">Blogs</h1>
        <p className="text-muted-foreground">
          No published articles yet. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="md:mx-32 px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Blogs
        </h1>
        <p className="text-muted-foreground">
          Discover my latest articles and insights
        </p>
      </div>

      <BlogCard blogs={blogs} />
    </div>
  );
}
