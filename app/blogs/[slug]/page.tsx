import { getBlogBySlug } from "@/lib/action/blogs";
import { prisma } from "@/lib/prisma";
import { CircleUser, CalendarDays, Clock } from "lucide-react";
import { Metadata } from "next";
import Image from "next/image";
import * as cheerio from "cheerio";
import { notFound } from "next/navigation";
import slugify from "slugify";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { BlogViewTracker } from "@/components/blog/ViewTracker";
import { CodeBlockEnhancer } from "@/components/blog/CodeBlockEnhancer";
import { highlightCodeBlocks } from "@/lib/blog/highlight-code";
import { absoluteUrl } from "@/lib/site";

export async function generateStaticParams() {
  const blogs = await prisma.blog.findMany({ select: { slug: true } });
  return blogs.map((blog) => ({ slug: blog.slug }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);
  if (!blog) {
    return {
      title: "Blog Not Found",
      description:
        "This article does not exist | Full Stack Developer Portfolio",
    };
  }
  const baseDesc =
    blog.metaDescription ||
    (blog.content ? blog.content.replace(/<[^>]+>/g, "").slice(0, 150) : "");
  return {
    title: `${blog.h1}`,
    description: `${baseDesc} | Full Stack Developer Portfolio`,
    alternates: {
      canonical: absoluteUrl(`/blogs/${blog.slug}`),
    },
    openGraph: {
      type: "article",
      title: blog.h1,
      description: baseDesc,
      url: absoluteUrl(`/blogs/${blog.slug}`),
      siteName: "Nikhil Chavan Portfolio",
      images: blog.imageUrl
        ? [
            {
              url: blog.imageUrl,
              width: 1200,
              height: 630,
              alt: blog.h1,
            },
          ]
        : [],
      publishedTime: blog.createdAt.toISOString(),
      modifiedTime: blog.updatedAt.toISOString(),
      authors: [blog.author],
    },
    twitter: {
      card: "summary_large_image",
      title: blog.h1,
      description: baseDesc,
      images: blog.imageUrl ? [blog.imageUrl] : [],
    },
  };
}

function estimateReadTime(html: string) {
  const text = html.replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    return notFound();
  }

  // Parse HTML and generate TOC
  const $ = cheerio.load(blog.content);
  const headings: { text: string; id: string; level: number }[] = [];
  $("h2, h3").each((i, el) => {
    const text = $(el).text();
    let id = $(el).attr("id");
    if (!id) {
      id = slugify(text, { lower: true, strict: true }) + (i > 0 ? `-${i}` : "");
      $(el).attr("id", id);
    }
    const tagName = (el as any).tagName as string;
    headings.push({ text, id, level: Number(tagName.slice(1)) });
  });
  highlightCodeBlocks($);
  const modifiedHtml = $.html();

  const blogPostingLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.h1,
    description: blog.metaDescription,
    image: blog.imageUrl,
    author: {
      "@type": "Person",
      name: blog.author,
    },
    publisher: {
      "@type": "Person",
      name: "Nikhil Chavan",
    },
    datePublished: blog.createdAt.toISOString(),
    dateModified: blog.updatedAt.toISOString(),
    mainEntityOfPage: absoluteUrl(`/blogs/${blog.slug}`),
    wordCount: blog.content.replace(/<[^>]+>/g, "").trim().split(/\s+/).length,
  };

  return (
    <div className="container mx-auto px-4 py-10 ">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }}
      />
      <div className="mx-auto w-full max-w-3xl order-2 md:order-1">
        <article className="space-y-6">
          <h1 className="text-2xl md:text-3xl font-bold  text-foreground">
            {blog.h1}
          </h1>

          <div className="flex justify-between items-center">
            <div className="flex flex-wrap items-center gap-4 text-sm text-black dark:text-white ">
              <div className="flex items-center gap-2">
                <CircleUser className="h-4 w-4" />
                <span>{blog.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>
                  {blog.createdAt
                    ? new Date(blog.createdAt).toLocaleDateString()
                    : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{estimateReadTime(blog.content)} min read</span>
              </div>
            </div>

            <div>
              <span className="text-sm text-muted-foreground">
                {blog.views ?? 0} views
              </span>
            </div>
          </div>
          <TableOfContents headings={headings} />
          {blog.imageUrl ? (
            <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl border bg-muted shadow-sm">
              <Image
                src={blog.imageUrl}
                alt={blog.h1}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            </div>
          ) : (
            <div className="w-full aspect-[16/9] rounded-xl border bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}

          <div
            id="blog-content"
            className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed"
            dangerouslySetInnerHTML={{ __html: modifiedHtml }}
          />
          <CodeBlockEnhancer containerId="blog-content" />
        </article>
      </div>
      <BlogViewTracker slug={blog.slug} />
    </div>
  );
}
