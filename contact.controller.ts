import type { Request, Response, NextFunction } from "express";
import { contactFormSchema } from "./validators.js";
import { mailerService } from "./mailer.service.js";

export async function submitContactForm(req: Request, res: Response, next: NextFunction) {
  try {
    const input = contactFormSchema.parse(req.body);
    await mailerService.sendContactFormEmail(input);
    res.json({ success: true, message: "Thanks! We'll get back to you shortly." });
  } catch (err) {
    next(err);
  }
}
