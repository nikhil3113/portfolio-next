import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    await prisma.blog.update({
      where: { slug },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json(
      { message: "Blog views incremented" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error incrementing blog views:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
