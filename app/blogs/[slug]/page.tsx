import { getBlogBySlug, getPublishedBlogSlugs } from "@/lib/action/blogs";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/blog/BlogArticle";
import {
  AUTHOR_NAME,
  buildBlogTitle,
  clampDescription,
  normalizeAuthor,
  serializeJsonLd,
} from "@/lib/seo";
import { absoluteUrl, siteUrl } from "@/lib/site";

export async function generateStaticParams() {
  const blogs = await getPublishedBlogSlugs();
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
      description: "This article could not be found.",
    };
  }
  const description = clampDescription(
    blog.metaDescription ||
      (blog.content ? blog.content.replace(/<[^>]+>/g, "").slice(0, 150) : ""),
  );
  const title = buildBlogTitle(blog.h1, blog.metaTitle);
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: absoluteUrl(`/blogs/${blog.slug}`),
    },
    openGraph: {
      type: "article",
      title,
      description,
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
      authors: [normalizeAuthor(blog.author)],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: blog.imageUrl ? [blog.imageUrl] : [],
    },
  };
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

  const authorName = normalizeAuthor(blog.author);
  const articleUrl = absoluteUrl(`/blogs/${blog.slug}`);

  const blogPostingLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${articleUrl}#article`,
    headline: blog.h1,
    description: clampDescription(blog.metaDescription),
    image: blog.imageUrl ? [blog.imageUrl] : undefined,
    author: {
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: authorName,
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: AUTHOR_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icon"),
        width: 512,
        height: 512,
      },
    },
    datePublished: blog.createdAt.toISOString(),
    dateModified: blog.updatedAt.toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    wordCount: blog.content.replace(/<[^>]+>/g, "").trim().split(/\s+/).length,
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
        name: "Blog",
        item: absoluteUrl("/blogs"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: blog.h1,
        item: articleUrl,
      },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-10 ">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(blogPostingLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }}
      />
      <div className="mx-auto w-full max-w-3xl order-2 md:order-1">
        <BlogArticle blog={blog} />
      </div>
    </div>
  );
}
