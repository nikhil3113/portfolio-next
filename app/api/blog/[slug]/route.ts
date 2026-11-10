import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { sanitizeBlogHtml, stripTags } from "@/lib/blog/sanitize";

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
    const body = await request.json();
    const {
      h1,
      metaDescription,
      content,
      imageUrl,
      author,
      isPublished,
      newSlug,
    } = body;
    if (!h1 || !metaDescription || !content) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    const safeH1 = stripTags(h1);
    const safeMetaDescription = stripTags(metaDescription);
    const safeAuthor = author ? stripTags(author) : author;
    const safeContent = sanitizeBlogHtml(content);

    const existingSlug = await prisma.blog.findUnique({
      where: { slug: newSlug },
    });

    if (existingSlug && existingSlug.slug !== slug) {
      return NextResponse.json(
        { message: "Slug already in use" },
        { status: 409 },
      );
    }

    const updatedBlog = await prisma.blog.update({
      where: { slug },
      data: {
        h1: safeH1,
        metaDescription: safeMetaDescription,
        content: safeContent,
        imageUrl,
        author: safeAuthor,
        slug: newSlug,
        isPublished,
      },
    });
    revalidatePath(`/blogs/${slug}`);
    revalidatePath("/blogs");
    revalidatePath("/");
    return NextResponse.json(updatedBlog, { status: 200 });
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
