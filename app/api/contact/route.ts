import { prisma } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

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
      if (!process.env.MAILER_SEND_API_KEY || !process.env.MAILERSEND_EMAIL) {
        return new Response("Missing MailerSend ENV", { status: 500 });
      }

      const mailerSend = new MailerSend({
        apiKey: process.env.MAILER_SEND_API_KEY,
      });
      const sentFrom = new Sender(process.env.MAILERSEND_EMAIL, "Nikhil Chavan");

      const recipents = [new Recipient(email, name)];

      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipents)
        .setReplyTo(sentFrom)
        .setSubject(
          `Thanks for reaching out, ${name}! | Nikhil Chavan Portfolio`
        ).setHtml(`
          <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h2 style="color: #6d28d9; margin-bottom: 20px;">Hello ${name},</h2>
            
            <p>Thank you for taking the time to reach out through my portfolio website. I've received your message about:</p>
            
            <blockquote style="border-left: 4px solid #8b5cf6; padding-left: 15px; margin: 20px 0; font-style: italic;">
              "${message.substring(0, 100)}${message.length > 100 ? "..." : ""}"
            </blockquote>
            
            <p>I personally review all inquiries and will get back to you within 1-2 business days.</p>
            
            <p>In the meantime, feel free to connect with me on:</p>
            <ul style="list-style-type: none; padding-left: 0;">
              <li style="margin-bottom: 8px;">• <a href="https://github.com/nikhil3113" style="color: #6d28d9; text-decoration: none;">GitHub</a></li>
              <li style="margin-bottom: 8px;">• <a href="https://www.linkedin.com/in/nikhil-chavan-8b83ab184" style="color: #6d28d9; text-decoration: none;">LinkedIn</a></li>
            </ul>
            
            <p>Looking forward to our conversation!</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>Nikhil Chavan</strong><br>Full Stack Developer</p>
          </div>
        `).setText(`Hello ${name},
        
        Thank you for taking the time to reach out through my portfolio website. I've received your message regarding:
        
        "${message.substring(0, 100)}${message.length > 100 ? "..." : ""}"
        
        I personally review all inquiries and will get back to you within 1-2 business days. If your matter is urgent, you can also reach me directly at +1 (234) 567-890.
        
        In the meantime, feel free to connect with me on:
        - GitHub: https://github.com/nikhil3113
        - LinkedIn: https://www.linkedin.com/in/nikhil-chavan-8b83ab184
        
        Looking forward to our conversation!
        
        Best regards,
        Nikhil Chavan
        Full Stack Developer`);

      await mailerSend.email.send(emailParams);

      if (!process.env.MAIL) {
        return new Response("Missing MAIL ENV", { status: 500 });
      }
      const myEmail = process.env.MAIL;
      const notificationRecipients = [new Recipient(myEmail, "Nikhil Chavan")];
  
      const notificationParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(notificationRecipients)
        .setReplyTo(new Sender(email, name)) // Allow direct reply to the sender
        .setSubject(`New Contact Form Submission: ${name}`)
        .setHtml(`
          <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h2 style="color: #6d28d9; margin-bottom: 20px;">New Contact Form Submission</h2>
            
            <p><strong>From:</strong> ${name} (${email})</p>
            
            <h3 style="color: #6d28d9; margin-top: 20px;">Message:</h3>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              ${message}
            </div>
            
            <p style="color: #666; font-size: 14px;">This is an automated notification from your portfolio website.</p>
          </div>
        `)
        .setText(`New Contact Form Submission
        
        From: ${name} (${email})
        
        Message:
        ${message}
        
        This is an automated notification from your portfolio website.`);
    
      await mailerSend.email.send(notificationParams);

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
