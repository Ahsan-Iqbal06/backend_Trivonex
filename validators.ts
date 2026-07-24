import { z } from "zod";

export const initiateMASchema = z.object({
  orderId: z.string().min(1, "orderId is required"),
  amount: z
    .union([z.string(), z.number()])
    .refine((value) => Number(value) > 0, { message: "amount must be greater than 0" }),
  // Easypaisa mobile account format: 03xxxxxxxxx (11 digits)
  mobileAccountNo: z
    .string()
    .regex(/^03\d{9}$/, "mobileAccountNo must be in format 03xxxxxxxxx"),
  emailAddress: z.string().email("emailAddress must be a valid email"),
});

export const contactFormSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(5000),
});

export type InitiateMAInput = z.infer<typeof initiateMASchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
