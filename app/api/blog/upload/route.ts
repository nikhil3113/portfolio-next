import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("image") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `image-${uniqueSuffix}${path.extname(file.name)}`;
    const uploadsDir = path.join(process.cwd(), "public/blogs");

    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (err) {
      console.log("Directory already exists or error creating directory:", err);
    }

    const filepath = path.join(uploadsDir, filename);

    await writeFile(filepath, buffer);

    return NextResponse.json(
      {
        url: `/blogs/${filename}`,
        message: "File uploaded successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { fileName } = await request.json();
    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json(
        { error: "File name is required" },
        { status: 400 }
      );
    }
    const filePath = path.join(process.cwd(), "public/blogs", fileName);
    await unlink(filePath);
    return NextResponse.json(
      { message: "File deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
