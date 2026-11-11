import { v2 as cloudinary } from "cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ALLOWED_SIGNING_PARAMS = new Set([
  "timestamp",
  "upload_preset",
  "folder",
  "public_id",
  "source",
  "tags",
  "context",
  "transformation",
  "eager",
  "overwrite",
  "invalidate",
]);

const MAX_SIGNING_PARAMS = 20;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidPublicId(publicId: unknown): publicId is string {
  if (typeof publicId !== "string") return false;
  if (publicId.length < 1 || publicId.length > 500) return false;
  if (publicId.includes("..")) return false;
  if (publicId.startsWith("/")) return false;
  if (publicId.includes("\\")) return false;
  if (/\s/.test(publicId)) return false;

  const allowedFolder = process.env.CLOUDINARY_ALLOWED_FOLDER;
  if (allowedFolder && !publicId.startsWith(`${allowedFolder}/`)) return false;

  return true;
}

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    !process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return new Response("Cloudinary API credentials are not set", {
      status: 500,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid signing parameters" },
      { status: 400 }
    );
  }

  const paramsToSign = isPlainObject(body) ? body.paramsToSign : undefined;
  if (!isPlainObject(paramsToSign)) {
    return Response.json(
      { error: "Invalid signing parameters" },
      { status: 400 }
    );
  }

  const keys = Object.keys(paramsToSign);
  if (
    keys.length > MAX_SIGNING_PARAMS ||
    keys.some((key) => !ALLOWED_SIGNING_PARAMS.has(key))
  ) {
    return Response.json(
      { error: "Invalid signing parameters" },
      { status: 400 }
    );
  }

  try {
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );
    return Response.json({ signature });
  } catch (error) {
    console.error("Error in Cloudinary API:", error);
    return Response.json(
      { error: "Failed to sign Cloudinary parameters" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid public ID" }, { status: 400 });
  }

  const publicId = isPlainObject(body) ? body.publicId : undefined;
  if (!isValidPublicId(publicId)) {
    return Response.json({ error: "Invalid public ID" }, { status: 400 });
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return Response.json(
      { message: "Cloudinary resource deleted successfully", result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting Cloudinary resource:", error);
    return Response.json(
      { error: "Failed to delete Cloudinary resource" },
      { status: 500 }
    );
  }
}
