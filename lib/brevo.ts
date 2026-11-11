import * as Brevo from "@getbrevo/brevo";

export type MailResult = { ok: true } | { ok: false; error: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function subjectSafe(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function createClient(apiKey: string) {
  const apiInstance = new Brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
  return apiInstance;
}

export async function sendContactMail(input: {
  name: string;
  email: string;
  message: string;
}): Promise<MailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SMTP_EMAIL;
  const ownerEmail = process.env.MY_EMAIL || senderEmail;

  if (!apiKey || !senderEmail || !ownerEmail) {
    return { ok: false, error: "Mail is not configured" };
  }

  const safeName = escapeHtml(input.name);
  const safeMessage = escapeHtml(input.message);
  const quotedMessage =
    safeMessage.length > 500 ? `${safeMessage.slice(0, 500)}...` : safeMessage;
  const safeSubjectName = subjectSafe(input.name);

  const apiInstance = createClient(apiKey);

  try {
    const ownerMessage = new Brevo.SendSmtpEmail();
    ownerMessage.sender = {
      name: "Nikhil Chavan Portfolio",
      email: senderEmail,
    };
    ownerMessage.to = [{ email: ownerEmail }];
    ownerMessage.replyTo = { email: input.email, name: input.name };
    ownerMessage.subject = `New contact message from ${safeSubjectName}`;
    ownerMessage.htmlContent = `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #6d28d9; margin-bottom: 20px;">New contact message</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
        <blockquote style="border-left: 4px solid #8b5cf6; padding-left: 15px; margin: 20px 0; white-space: pre-wrap;">
          ${quotedMessage}
        </blockquote>
      </div>
    `;

    const data = await apiInstance.sendTransacEmail(ownerMessage);
    console.log("Contact notification sent", data?.body?.messageId ?? "");
  } catch {
    console.error("Failed to send contact notification");
    return { ok: false, error: "Failed to send contact notification" };
  }

  try {
    const autoReply = new Brevo.SendSmtpEmail();
    autoReply.sender = {
      name: "Nikhil Chavan",
      email: senderEmail,
    };
    autoReply.to = [{ email: input.email }];
    autoReply.subject = `Thanks for reaching out, ${safeSubjectName}! | Nikhil Chavan Portfolio`;
    autoReply.htmlContent = `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #6d28d9; margin-bottom: 20px;">Hello ${safeName},</h2>

        <p>Thank you for taking the time to reach out through my portfolio website. I've received your message about:</p>

        <blockquote style="border-left: 4px solid #8b5cf6; padding-left: 15px; margin: 20px 0; font-style: italic;">
          "${quotedMessage}"
        </blockquote>

        <p>I personally review all inquiries and will get back to you within 1-2 business days.</p>

        <p>In the meantime, feel free to connect with me on:</p>
        <ul style="list-style-type: none; padding-left: 0;">
          <li style="margin-bottom: 8px;">• <a href="https://github.com/nikhil3113" style="color: #6d28d9; text-decoration: none;">GitHub</a></li>
          <li style="margin-bottom: 8px;">• <a href="https://www.linkedin.com/in/nikchavan" style="color: #6d28d9; text-decoration: none;">LinkedIn</a></li>
        </ul>

        <p>Looking forward to our conversation!</p>

        <p style="margin-top: 30px;">Best regards,<br><strong>Nikhil Chavan</strong><br>Full Stack Developer</p>
      </div>
    `;

    await apiInstance.sendTransacEmail(autoReply);
  } catch {
    console.error("Failed to send contact auto-reply");
  }

  return { ok: true };
}
