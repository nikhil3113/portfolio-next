import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { message: "Unauthorized access" },
      { status: 401 }
    );
  }
  try {
    const {
      title,
      description,
      tags,
      siteLink,
      githubLink,
      imageUrl,
      createdAt,
    } = await req.json();
    if (
      !title ||
      !description ||
      !tags ||
      !siteLink ||
      !githubLink ||
      !imageUrl
    ) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }
    if (Array.isArray(tags) && tags.length === 0) {
      return NextResponse.json(
        { message: "Tags cannot be an empty array" },
        { status: 400 }
      );
    }

    await prisma.project.create({
      data: {
        title,
        description,
        tags: {
          set: tags,
        },
        siteLink,
        githubLink,
        imageUrl,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
      },
    });

    await redis.del("projects");
    revalidatePath("/projects");
    revalidatePath("/");
    return NextResponse.json("Project Created", { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/projects:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
