import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  if (
    !process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return new Response("Cloudinary API credentials are not set", {
      status: 500,
    });
  }

  try {
    const body = await request.json();
    const { paramsToSign } = body;

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
