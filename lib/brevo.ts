import * as Brevo from "@getbrevo/brevo";

export async function sednMail(email: string, message: string, name: string) {
  try {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        status: 400,
        message: "Invalid email address.",
      };
    }

    if (!process.env.BREVO_API_KEY || !process.env.SMTP_EMAIL) {
      return {
        status: 500,
        message:
          "Brevo API key or SMTP email is not set in environment variables.",
      };
    }

    console.log("Sending OTP to:", email);

    const apiInstance = new Brevo.TransactionalEmailsApi();

    apiInstance.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.sender = {
      name: "Nikhil Chavan",
      email: process.env.SMTP_EMAIL,
    };
    sendSmtpEmail.to = [{ email }];
    sendSmtpEmail.bcc = [
      { email: process.env.MY_EMAIL || process.env.SMTP_EMAIL },
    ];
    sendSmtpEmail.subject = `Thanks for reaching out, ${name}! | Nikhil Chavan Portfolio`;
    sendSmtpEmail.htmlContent = `
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
    `;

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log("Brevo API response:", JSON.stringify(data, null, 2));

    return {
      status: 200,
      message: "OTP sent successfully.",
      messageId: data.body.messageId,
    };
  } catch (error) {
    console.error("Error sending OTP:", error);
    return {
      status: 500,
      message: `Failed to send OTP: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
