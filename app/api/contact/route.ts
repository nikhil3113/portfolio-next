import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sednMail } from "@/lib/brevo";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, message } = body;

  if (!name || !email || !message) {
    return new Response("Missing fields", { status: 400 });
  }

  if (!email.includes("@")) {
    return new Response("Invalid email", { status: 400 });
  }

  try {
    await prisma.contact.create({
      data: {
        name,
        email,
        message,
      },
    });

    try {
      await sednMail(email, message, name);
      console.log("Email sent successfully");
    } catch (error) {
      console.log("Error sending email", error);
      return NextResponse.json(
        {
          error: "Error sending email",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        message: "Message sent successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        error: "Something went wrong",
      },
      {
        status: 500,
      }
    );
  }
}
