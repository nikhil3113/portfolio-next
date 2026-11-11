import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { projectCreateSchema } from "@/lib/validation";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { message: "Unauthorized access" },
      { status: 401 },
    );
  }
  try {
    const id = (await params).id;
    const parsed = projectCreateSchema.safeParse(await request.json());
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

    await prisma.project.update({
      where: { id },
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
          : undefined,
        hidden,
      },
    });
    revalidatePath("/projects");
    revalidatePath("/");
    return NextResponse.json("Project Updated", { status: 200 });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json(
      { message: "Unauthorized access" },
      { status: 401 },
    );
  }
  const id = (await params).id;
  try {
    const projects = await prisma.project.findUnique({
      where: { id },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { message: "Unauthorized access" },
      { status: 401 },
    );
  }

  const id = (await params).id;
  try {
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });
    if (!existingProject) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }
    await prisma.project.delete({
      where: { id },
    });
    revalidatePath("/projects");
    revalidatePath("/");
    return NextResponse.json("Project Deleted", { status: 200 });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
