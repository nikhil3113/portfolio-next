import { BlogCard } from "@/components/blog/BlogCard";
import { getBlogs } from "@/lib/action/blogs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Web Development, Next.js, React & AI Insights",
  description:
    "Articles by Nikhil Chavan on full stack web development, Next.js, React, TypeScript, performance, SEO, and how AI tools like ChatGPT and Claude work under the hood.",
  keywords: [
    "web development blog",
    "next.js articles",
    "react tutorials",
    "typescript guides",
    "ai explained",
    "nikhil chavan blog",
  ],
  alternates: {
    canonical: "https://nikchavan.com/blogs",
  },
  openGraph: {
    title: "Blog | Nikhil Chavan",
    description:
      "Articles on full stack web development, Next.js, React, TypeScript, performance, SEO, and AI explained.",
    url: "https://nikchavan.com/blogs",
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
    title: "Blog | Nikhil Chavan",
    description:
      "Articles on full stack web development, Next.js, React, TypeScript, performance, SEO, and AI explained.",
    images: ["/opengraph-image"],
  },
};

export default async function Blogs() {
  const blogs = await getBlogs();

  if (!blogs || blogs.length === 0) {
    <div className="text-center py-12">
      <p className="text-gray-500 text-lg">No blogs found.</p>
    </div>;
  }

  return (
    <div className="md:mx-32 px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">
          Blogs
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Discover my latest articles and insights
        </p>
      </div>

      <BlogCard blogs={blogs} />
    </div>
  );
}
