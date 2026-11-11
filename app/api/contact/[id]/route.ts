import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { message: "Unauthorized access" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.isRead !== "boolean") {
    return NextResponse.json(
      { message: "isRead must be a boolean" },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.contact.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ message: "Contact not found" }, { status: 404 });
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: { isRead: body.isRead },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { message: "Unauthorized access" },
      { status: 401 },
    );
  }

  const { id } = await params;

  try {
    const existing = await prisma.contact.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ message: "Contact not found" }, { status: 404 });
    }

    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ message: "Contact deleted" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
