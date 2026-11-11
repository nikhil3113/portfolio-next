import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getBlogBySlugForPreview } from "@/lib/action/blogs";
import { BlogArticle } from "@/components/blog/BlogArticle";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Draft preview",
};

export default async function BlogPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { slug } = await params;
  const blog = await getBlogBySlugForPreview(slug);
  if (!blog) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Previewing{" "}
          <span className="font-semibold text-foreground">{blog.h1}</span>
          {blog.isPublished ? " (published)" : " (draft)"}
        </p>
        <Link
          href="/admin/blog"
          className="text-sm font-medium text-accent-text hover:underline"
        >
          Back to blogs
        </Link>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <BlogArticle blog={blog} showViewTracker={false} />
      </div>
    </div>
  );
}
