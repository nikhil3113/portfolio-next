import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendContactMail } from "@/lib/brevo";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(1).max(5000),
  website: z.string().max(200).optional().default(""),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid fields",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { name, email, message, website } = parsed.data;

  if (website) {
    return NextResponse.json(
      { message: "Message sent successfully" },
      { status: 200 },
    );
  }

  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  const perIp = checkRateLimit(`contact:${ip}`, 5, 10 * 60 * 1000);
  const global = checkRateLimit("contact:global", 60, 60 * 60 * 1000);

  if (!perIp.allowed || !global.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(perIp.retryAfterSeconds || 60),
        },
      },
    );
  }

  try {
    await prisma.contact.create({
      data: {
        name,
        email,
        message,
        isRead: false,
        createdAt: new Date(),
      },
    });

    const result = await sendContactMail({ name, email, message });

    if (!result.ok) {
      return NextResponse.json(
        {
          error:
            "Message saved, but email could not be sent. Please try again later.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        message: "Message sent successfully",
      },
      {
        status: 200,
      },
    );
  } catch {
    console.error("Unexpected error in POST /api/contact");
    return NextResponse.json(
      {
        error: "Something went wrong",
      },
      {
        status: 500,
      },
    );
  }
}
