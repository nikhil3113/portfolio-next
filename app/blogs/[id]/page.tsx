import { prisma } from "@/lib/prisma";
import { CircleUser, CalendarDays, Clock } from "lucide-react";
import Image from "next/image";

const getBlogById = async (id: string) => {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id },
    });
    return blog;
  } catch (error) {
    console.log("Error fetching blog by ID:", error);
    return null;
  }
};

function estimateReadTime(html: string) {
  const text = html.replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const blog = await getBlogById(id);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        {blog ? (
          <article className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold  text-foreground">
              {blog.h1}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-black ">
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

            {blog.imageUrl ? (
              <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl border bg-muted shadow-sm">
                <Image
                  src={blog.imageUrl}
                  alt={blog.h1}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority
                />
              </div>
            ) : (
              <div className="w-full aspect-[16/9] rounded-xl border bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center text-muted-foreground">
                No image
              </div>
            )}

            <div
              className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </article>
        ) : (
          <p className="text-destructive">Blog not found.</p>
        )}
      </div>
    </div>
  );
}
