import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { projectCreateSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { message: "Unauthorized access" },
      { status: 401 },
    );
  }
  try {
    const parsed = projectCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid project payload",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      title,
      description,
      tags,
      siteLink,
      githubLink,
      imageUrl,
      createdAt,
      hidden,
    } = parsed.data;

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
        createdAt: createdAt
          ? new Date(`${createdAt}T00:00:00.000Z`)
          : new Date(),
        hidden,
      },
    });

    revalidatePath("/projects");
    revalidatePath("/");
    return NextResponse.json("Project Created", { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/projects:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const where = session?.user ? {} : { hidden: false };

  try {
    const projects = await prisma.project.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
