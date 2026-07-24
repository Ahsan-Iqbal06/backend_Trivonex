import nodemailer, { type Transporter } from "nodemailer";
import { env } from "./env.js";
import type { ContactFormInput } from "./validators.js";

class MailerService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });
  }

  async sendContactFormEmail(input: ContactFormInput): Promise<void> {
    await this.transporter.sendMail({
      from: `"Website Contact Form" <${env.SMTP_USER}>`,
      to: env.CONTACT_FORM_RECEIVER,
      replyTo: input.email,
      subject: `[Contact Form] ${input.subject}`,
      text: [
        `Name: ${input.name}`,
        `Email: ${input.email}`,
        input.phone ? `Phone: ${input.phone}` : null,
        "",
        input.message,
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }
}

export const mailerService = new MailerService();
