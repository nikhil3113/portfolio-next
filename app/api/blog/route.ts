import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { sanitizeBlogHtml, stripTags } from "@/lib/blog/sanitize";
import { blogCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      { status: 401 },
    );
  }

  try {
    const parsed = blogCreateSchema.safeParse(await request.json());
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
      slug,
    } = parsed.data;

    const safeH1 = stripTags(h1);
    const safeMetaDescription = stripTags(metaDescription);
    const safeAuthor = stripTags(author);
    const safeContent = sanitizeBlogHtml(content);

    try {
      await prisma.blog.create({
        data: {
          h1: safeH1,
          slug,
          metaDescription: safeMetaDescription,
          content: safeContent,
          imageUrl,
          author: safeAuthor,
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
    revalidatePath("/blogs");
    revalidatePath(`/blogs/${slug}`);
    revalidatePath("/");
    revalidatePath("/sitemap.xml");
    return NextResponse.json(
      { message: "Blog created successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.log("Error in POST /api/blog:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const blogs = await prisma.blog.findMany();
    return NextResponse.json(blogs, { status: 200 });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
