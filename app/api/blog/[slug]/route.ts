import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { sanitizeBlogHtml, stripTags } from "@/lib/blog/sanitize";
import { blogUpdateSchema, slugSchema } from "@/lib/validation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { message: "Unauthorized access" },
      { status: 401 },
    );
  }
  try {
    const { slug } = await params;
    const blog = await prisma.blog.findUnique({
      where: { slug },
    });
    if (!blog) {
      return NextResponse.json({ message: "Blog not found" }, { status: 404 });
    }
    return NextResponse.json(blog);
  } catch (error) {
    console.error("Error fetching blog:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { message: "Unauthorized access" },
      { status: 401 },
    );
  }
  try {
    const { slug } = await params;
    const parsed = blogUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid blog payload",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      h1,
      metaDescription,
      content,
      imageUrl,
      author,
      isPublished,
      newSlug,
    } = parsed.data;

    const safeH1 = stripTags(h1);
    const safeMetaDescription = stripTags(metaDescription);
    const safeAuthor = stripTags(author);
    const safeContent = sanitizeBlogHtml(content);
    const targetSlug = newSlug ?? slug;

    if (targetSlug !== slug) {
      const slugCheck = slugSchema.safeParse(targetSlug);
      if (!slugCheck.success) {
        return NextResponse.json(
          {
            message: "Invalid blog payload",
            errors: { newSlug: slugCheck.error.issues.map((issue) => issue.message) },
          },
          { status: 400 },
        );
      }
    }

    const existingSlug = await prisma.blog.findUnique({
      where: { slug: targetSlug },
    });

    if (existingSlug && existingSlug.slug !== slug) {
      return NextResponse.json(
        { message: "Slug already in use" },
        { status: 409 },
      );
    }

    let updatedBlog: Awaited<ReturnType<typeof prisma.blog.update>>;
    try {
      updatedBlog = await prisma.blog.update({
        where: { slug },
        data: {
          h1: safeH1,
          metaDescription: safeMetaDescription,
          content: safeContent,
          imageUrl,
          author: safeAuthor,
          slug: targetSlug,
          isPublished,
        },
      });
    } catch (error) {
      if ((error as { code?: string }).code === "P2002") {
        return NextResponse.json(
          { message: "Slug already in use" },
          { status: 409 },
        );
      }
      throw error;
    }
    revalidatePath(`/blogs/${slug}`);
    if (newSlug && newSlug !== slug) {
      revalidatePath(`/blogs/${newSlug}`);
    }
    revalidatePath("/blogs");
    revalidatePath("/");
    revalidatePath("/sitemap.xml");
    return NextResponse.json(updatedBlog, { status: 200 });
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { message: "Unauthorized access" },
      { status: 401 },
    );
  }

  const { slug } = await params;

  try {
    const existing = await prisma.blog.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });

    if (!existing) {
      return NextResponse.json({ message: "Blog not found" }, { status: 404 });
    }

    await prisma.blog.delete({ where: { slug } });

    revalidatePath(`/blogs/${slug}`);
    revalidatePath("/blogs");
    revalidatePath("/");
    revalidatePath("/sitemap.xml");

    return NextResponse.json({ message: "Blog deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
