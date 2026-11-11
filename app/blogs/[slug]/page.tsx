import { getBlogBySlug, getPublishedBlogSlugs } from "@/lib/action/blogs";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/blog/BlogArticle";
import { serializeJsonLd } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

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
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(blogPostingLd) }}
      />
      <div className="mx-auto w-full max-w-3xl order-2 md:order-1">
        <BlogArticle blog={blog} />
      </div>
    </div>
  );
}
