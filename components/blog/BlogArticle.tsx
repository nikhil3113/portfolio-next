import type { Blog } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import * as cheerio from "cheerio";
import slugify from "slugify";
import { CircleUser, CalendarDays, Clock } from "lucide-react";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { CodeBlockEnhancer } from "@/components/blog/CodeBlockEnhancer";
import { BlogViewTracker } from "@/components/blog/ViewTracker";
import { highlightCodeBlocks } from "@/lib/blog/highlight-code";
import { sanitizeBlogHtml } from "@/lib/blog/sanitize";
import { AUTHOR_NAME, normalizeAuthor } from "@/lib/seo";

function estimateReadTime(html: string) {
  const text = html.replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function BlogArticle({
  blog,
  showViewTracker = true,
}: {
  blog: Blog;
  showViewTracker?: boolean;
}) {
  // Parse HTML and generate TOC
  const safeContent = sanitizeBlogHtml(blog.content);
  const $ = cheerio.load(safeContent);
  const headings: { text: string; id: string; level: number }[] = [];
  $("h2, h3").each((i, el) => {
    const text = $(el).text();
    let id = $(el).attr("id");
    if (!id) {
      id = slugify(text, { lower: true, strict: true }) + (i > 0 ? `-${i}` : "");
      $(el).attr("id", id);
    }
    const tagName = (el as { tagName: string }).tagName;
    headings.push({ text, id, level: Number(tagName.slice(1)) });
  });
  highlightCodeBlocks($);
  const modifiedHtml = $("body").html() ?? "";
  const authorName = normalizeAuthor(blog.author);
  const wasUpdated =
    blog.updatedAt instanceof Date &&
    blog.updatedAt.getTime() - blog.createdAt.getTime() > 24 * 60 * 60 * 1000;

  return (
    <article className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold  text-foreground">
        {blog.h1}
      </h1>

      <div className="flex justify-between items-center">
        <div className="flex flex-wrap items-center gap-4 text-sm text-foreground">
          <div className="flex items-center gap-2">
            <CircleUser className="h-4 w-4" />
            <Link href="/about" rel="author" className="hover:text-accent-text">
              {authorName}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>
              {blog.createdAt
                ? new Date(blog.createdAt).toLocaleDateString()
                : ""}
            </span>
          </div>
          {wasUpdated && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                Updated {new Date(blog.updatedAt).toLocaleDateString()}
              </span>
            </div>
          )}
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

      <div className="mt-10 flex gap-4 rounded-xl border border-border bg-muted/40 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
          NC
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{AUTHOR_NAME}</p>
          <p className="text-sm text-muted-foreground">
            Full stack developer writing about Next.js, AI tooling and the web.{" "}
            <Link
              href="/about"
              className="underline decoration-border underline-offset-4 hover:text-accent-text"
            >
              More about me
            </Link>
          </p>
        </div>
      </div>

      {showViewTracker && <BlogViewTracker slug={blog.slug} />}
    </article>
  );
}
