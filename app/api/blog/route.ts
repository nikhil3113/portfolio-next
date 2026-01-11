import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  try {
    const { h1, metaDescription, content, imageUrl, author, isPublished } =
      await request.json();

    if (!h1 || !metaDescription || !content || !imageUrl || !author) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    await prisma.blog.create({
      data: {
        h1,
        metaDescription,
        content,
        imageUrl,
        author,
        isPublished,
      },
    });
    await redis.del("blogs");
    revalidatePath("/blogs");
    revalidatePath("/");
    return NextResponse.json(
      { message: "Blog created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error in POST /api/blog:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
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
      { status: 500 }
    );
  }
}
